



const { getDB } = require('../DataBase/db1');
const { getTestStatus } = require('../utils/test_status');
const { generateResultHtml } = require('../utils/generateResultHtml');
const { calculate_live_Marks } = require('../live_test_data/calculate_marks');

async  function admin_dashboard (req, res) {
    try {
        const currentTime = Date.now();

        // Run optimized queries in parallel
        const [totalUsers, dppBatchesCount, testBatchesCount, liveTests] = await Promise.all([
            // Get total users count
            getDB('users').countDocuments(),

            // Get DPP batches count
            getDB("dpp_quiz").listCollections().toArray().then(collections => collections.length),

            // Get test batches count
            getDB('test_db').listCollections().toArray().then(collections => collections.length),

            // Fetch live tests with required fields
            getDB('live_test_db').collection('live_test').find(
                {},
                {
                    projection: {
                        test_id: 1,
                        batch_id: 1,
                        start_time: 1,
                        end_time: 1,
                        test_name: 1,
                        batch_name: 1,
                        user_responses: 1,
                        correct_answers: 1,
                    }
                }
            ).toArray()
        ]);

        // Process live tests and calculate statuses
        const testStats = {
            ongoing: 0,
            ended: 0,
            upcoming: 0
        };

        const formattedTests = liveTests.map(test => {
            const status = getTestStatus(test.start_time, test.end_time);
            testStats[status.toLowerCase()]++;

            return {
                test_id: test.test_id,
                batch_id: test.batch_id,
                test_name: test.test_name,
                batch_name: test.batch_name,
                start_time: test.start_time,
                end_time: test.end_time,
                status: status.toUpperCase(),
                attendedCount: test.user_responses ? test.user_responses.length : 0,
                answersUploaded: Array.isArray(test.correct_answers) && test.correct_answers.length > 0
            };
        });

        // Render the dashboard
        res.render('admin_dashboard', {
            totalUsers,
            dppBatches: dppBatchesCount,
            testBatches: testBatchesCount,
            ongoingTests: testStats.ongoing,
            endedTests: testStats.ended,
            upcomingTests: testStats.upcoming,
            liveTests: formattedTests
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};







async function generate_results (req, res) {
    const { batchId: batch_id, testId: test_id } = req.params;

    try {
        const liveTestCollection = getDB('live_test_db').collection('live_test');
        const test = await liveTestCollection.findOne({ test_id, batch_id });

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const currentTime = Date.now();
        if (currentTime < test.end_time) {
            return res.status(403).json({ message: 'Test has not ended yet' });
        }

        if (!test.correct_answers || test.correct_answers.length === 0) {
            return res.status(400).json({ message: 'Correct answers not uploaded yet' });
        }

        const userResponses = test.user_responses || [];
        const results = [];

        // Calculate results for each user
        for (const userResponse of userResponses) {
            if (!userResponse.answers) continue;

            //batchId, testId, userId,testData,userAnswers

            const [overallReport, sections] = await calculate_live_Marks(
                test.batch_id,
                test_id,
                userResponse.user_id,
                test,
                userResponse.answers
            );

            results.push({
                user_id: userResponse.user_id,
                totalMarks: overallReport.totalMarks,
                report: overallReport,
                sections
            });
        }

        // Sort results by total marks to calculate ranks
        results.sort((a, b) => b.totalMarks - a.totalMarks);

        // Add ranks and generate HTML results
        const updatedResponses = [];
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const rank = i + 1;
            
            // Generate result HTML with rank and total marks
            const resultHtml = generateResultHtml({
                overallReport: {
                    ...result.report,
                    rank,
                    totalParticipants: results.length
                },
                sections: result.sections
            });

            const resultBase64 = Buffer.from(resultHtml).toString('base64');

            updatedResponses.push({
                user_id: result.user_id,
                result_html: resultBase64,
                rank,
                totalMarks: result.totalMarks
            });
        }

        // Update all user responses with results
        const bulkOps = updatedResponses.map(response => ({
            updateOne: {
                filter: { 
                    test_id: test_id,
                    'user_responses.user_id': response.user_id
                },
                update: {
                    $set: {
                        'user_responses.$.result_html': response.result_html,
                        'user_responses.$.rank': response.rank,
                        'user_responses.$.totalMarks': response.totalMarks
                    }
                }
            }
        }));

        await liveTestCollection.bulkWrite(bulkOps);

        res.status(200).json({
            message: 'Results generated successfully',
            totalParticipants: results.length
        });

    } catch (error) {
        console.error('Error generating results:', error);
        res.status(500).json({
            message: 'An error occurred while generating results',
            error: error.message
        });
    }
};


module.exports = { admin_dashboard , generate_results }