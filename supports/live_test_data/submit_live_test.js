const { getDB } = require("../DataBase/db1");





// only for accepting responces ! 
async function submit_live_test (req, res)  {
    const { batch_id, test_id, questions } = req.body;  // Extract the data sent from the frontend

    try {
        // Find the live test in the 'live_test' collection
        const liveTest = await getDB('live_test_db').collection('live_test').findOne({ test_id: test_id });
        
        
        if (!liveTest) {
            return res.status(404).json({ message: 'Live test not found' });
        }

        // Extract only the userAnswer from the questions array
        const userAnswers = questions.map(q => {
            return q.userAnswer !== undefined && q.userAnswer !== null ? q.userAnswer : null;
        });

        // Prepare the new user response object
        const newUserResponse = {
            user_id: req.user.userId,  // Add user ID to identify the user
            answers: userAnswers  // Store only the user answers
        };

        // Check if 'user_responses' field exists, if not initialize it
        if (!liveTest.user_responses) {
            liveTest.user_responses = [];
        }

        // Check if the user already submitted responses for this test_id
        const existingResponseIndex = liveTest.user_responses.findIndex(response => response.user_id === req.user.userId);

        if (existingResponseIndex !== -1) {
            // If the user already submitted answers, update the existing response
            liveTest.user_responses[existingResponseIndex].answers = userAnswers;
            liveTest.user_responses[existingResponseIndex].batch_id = batch_id;  // Update batch_id if needed
        } else {
            // Add the new user response to the 'user_responses' array
            liveTest.user_responses.push(newUserResponse);
        }

        // Update the live test document in the database
        await getDB('live_test_db').collection('live_test').updateOne(
            { test_id: test_id },
            { $set: { user_responses: liveTest.user_responses } }
        );

        res.status(200).json({ result: 'success', message: 'Quiz submitted successfully' });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ result: 'error', message: 'An error occurred while submitting the quiz' });
    }
};

module.exports = { submit_live_test }
