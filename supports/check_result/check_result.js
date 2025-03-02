const { getDB } = require('../DataBase/db1');
//const { ObjectId } = require('mongodb');  // ✅ Required for `_id` query
const jwt = require('jsonwebtoken');
const { getTopperInfo } = require('../utils/get_topper_data')
const JWT_SECRET = '132432xsdcdscjnmb';




async function check_result (req, res)  {
    const { type, batchId, testId } = req.params;
    const mode = req.params.mode || 'normal';  // Default to 'normal' if mode is not provided
    const token = req.cookies.auth_token;
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const username = decoded.username;
        const user_id = req.user.userId;

        if (mode === 'live') {
            const liveTestCollection = await getDB('live_test_db').collection('live_test');
            
            const test = await liveTestCollection.findOne(
                { test_id: testId, batch_id: batchId },
                { projection: { test_name: 1, user_responses: { $elemMatch: { user_id } } } }
            );
            console.log( test)
            
            if (!test || !test.user_responses || test.user_responses.length === 0) {
                return res.status(404).send('User result not found');
            }
            
            const userResponse = test.user_responses[0];
            
            if (!userResponse.result_html) {
                return res.status(404).send('User result not found');
            }
            
            const topperMarks = await getTopperInfo(liveTestCollection, testId);
            
            return res.render('check-result', {
                test_name: test.test_name,
                resultHtml: userResponse.result_html,
                rank: userResponse.rank,
                topperMarks,
                totalMarks: userResponse.totalMarks,
            });
        } else {
            const users = getDB('users');
            const user = await users.findOne(
                { username },
                { projection: { [`recentTests.${type}`]: 1 } }
            );

            if (!user || !user.recentTests || !user.recentTests[type]) {
                return res.status(404).send('Test result not found');
            }

            const testResult = user.recentTests[type].find(test => test.testId === testId);

            if (!testResult) {
                return res.status(404).send('Test result not found');
            }

            return res.render('check-result', {
                test_name: testResult.test_name,
                resultHtml: testResult.resultHtml,
                totalMarks: null,
                topperMarks: null,
                rank: null
            });
        }
    } catch (error) {
        console.error('Error retrieving test result:', error);
        res.status(500).send('An error occurred while retrieving the test result');
    }
};


module.exports = { check_result }