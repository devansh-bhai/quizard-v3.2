
const { getDB } = require('../DataBase/db1');
const { generateResultHtml } = require('../utils/generateResultHtml');
const { calculate_live_Marks } = require('./calculate_marks');



async function validate_test (req, res) {
    const { batchId: batch_id, testId: test_id } = req.params;
    const user_id = req.user.userId;

    console.log("Test ID:", test_id);
    console.log("Batch ID:", batch_id);

    // Validate IDs
    if (!test_id || !batch_id || !user_id) {
        return res.status(400).json({ message: 'Invalid test, batch, or user ID' });
    }

    try {
        const liveTestCollection = getDB('live_test_db').collection('live_test');

        // Query the live test document with necessary fields
        const liveTest = await liveTestCollection.findOne(
            { test_id, batch_id },
            { projection: { end_time: 1, correct_answers: 1, questions: 1,user_responses: { $elemMatch: { user_id } } } }
        );

        if (!liveTest) {
            return res.status(404).json({ message: 'Live test not found' });
        }

        const currentTime = Date.now();
        if (currentTime < liveTest.end_time) {
            return res.status(403).json({ message: 'Test has not ended yet' });
        }

        const correctAnswers = liveTest.correct_answers || [];
        if (correctAnswers.length === 0) {
            return res.status(200).json({ 
                result: 'pending', 
                message: 'Results are not yet available. Please check back later.' 
            });
        }

        const userResponse = liveTest.user_responses?.[0];
        if (!userResponse) {
            return res.status(404).json({ message: 'User response not found' });
        }

        if (userResponse.result_html || (userResponse.result_html && !userResponse.answers)) {
    return res.status(200).json({ 
        result: 'success', 
        message: 'Probably a duplicate request. Please check.' 
    });
}


        // Calculate marks for the user
        const [overallReport, sections] = await calculate_live_Marks(
            batch_id, 
            test_id, 
            user_id, 
            liveTest, 
            userResponse.answers
        );

        // Generate and encode result HTML
        const resultHtml = generateResultHtml({ overallReport, sections });
        const resultBase64 = Buffer.from(resultHtml).toString('base64');

        // Update the user's response with result HTML and remove answers
        const updateResult = await liveTestCollection.updateOne(
            { test_id, 'user_responses.user_id': user_id },
            { 
                $set: { 'user_responses.$.result_html': resultBase64 },
                // $unset: { 'user_responses.$.answers': "" }
            }
        );

        if (updateResult.modifiedCount === 0) {
            throw new Error('Failed to update user response.');
        }

        return res.status(200).json({ 
            result: 'success', 
            message: 'User test results validated and stored successfully.' 
        });
    } catch (error) {
        console.error('Error validating test:', error);
        return res.status(500).json({ 
            result: 'error', 
            message: 'An error occurred while validating the test.' 
        });
    }
};

module.exports = { validate_test }