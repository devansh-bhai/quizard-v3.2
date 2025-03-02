const { getDB } = require('../DataBase/db1');
const { formatDateTime } = require('../utils/time');



async function live_test_page (req, res) {
    const testId = req.params.testId;
    const batchId = req.params.batchId;
    const userId = req.user.userId; // Assuming `req.user` contains the authenticated user's info
    const currentTime = Date.now().toString();

    try {
        const liveTest = await getDB('live_test_db').collection('live_test').findOne({ test_id: testId, batch_id: batchId });

        if (!liveTest) {
            return res.status(404).send('Test not found');
        }

        // Ensure user_responses exists and is an array
        const userResponses = liveTest.user_responses || [];
        if (!Array.isArray(userResponses)) {
            return res.status(500).send('Invalid test data format');
        }


        
        if (currentTime < liveTest.start_time) {
            return res.render('warning', {
                message: `This test will start at ${formatDateTime(liveTest.start_time)}.`,
            });
        }
        if (currentTime > liveTest.end_time) {
            return res.render('warning', {
                message: `This test ended at ${formatDateTime(liveTest.end_time)}.`,
            });
        }
        // Check if the user has already submitted the test
        const userResponse = userResponses.find(response => response.user_id === userId);
        if (userResponse && Array.isArray(userResponse.answers) && userResponse.answers.length > 0) {
            return res.render('warning', {
                message: 'You have already attempted this test.',
            });
        }

        // Add formatted times to the test data
        liveTest.formatted_start_time = formatDateTime(liveTest.start_time);
        liveTest.formatted_end_time = formatDateTime(liveTest.end_time);

        liveTest.questions = liveTest.questions.map(question => ({
            question: question.question || '',
            type: question.type || '',
            options: question.options || ["A","B","C","D"],
            userAnswer: null,  // Initialize as null
            skipped: false,    // Initialize as false
            visited: false,
            timeTaken: 0,      // Initialize as 0
            section: question.section || 'N/A',
        }));

        res.render('live_test_template', {
            questions: JSON.stringify(liveTest.questions),
            submit_url: "/submit-live-test",
        });
    } catch (error) {
        console.error('Error accessing live test:', error);
        res.status(500).send('An error occurred while accessing the live test');
    }
};

module.exports = { live_test_page }