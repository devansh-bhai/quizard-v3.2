



const { getDB } = require('../DataBase/db1'); // Adjust path as needed
const { ObjectId } = require('mongodb'); // Import ObjectId for MongoDB queries
const { formatDateTime, restructureUserRecentTests } = require('../utils/time'); 
const { getTestStatus } = require('../utils/test_status');



async function dashboard (req, res) {
    try {
        console.log("Request user:", req.user);
        const users = getDB('users');
        const user = await users.findOne({ _id: new ObjectId(req.user.userId) });
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        const liveTestsCollection = getDB('live_test_db').collection('live_test');
        const currentTime = Date.now().toString();
        
        // Clean up old tests
        //await cleanupOldTests(liveTestsCollection);

        // Calculate timestamp for 7 days ago
        const sevenDaysAgo = (Date.now() - (7 * 24 * 60 * 60 * 1000)).toString();

        // Pipeline for LIVE tests
        const livePipeline = [
            {
                $match: {
                    end_time: { 
                        $gte: currentTime,
                        $gte: sevenDaysAgo
                    }
                }
            },
            {
                $addFields: {
                    startTimeNum: { $toDouble: "$start_time" },
                    endTimeNum: { $toDouble: "$end_time" },
                    currentTimeNum: { $toDouble: currentTime },
                    hasUserSubmitted: {
                        $in: [req.user.userId, {
                            $ifNull: [
                                { $map: {
                                    input: "$user_responses",
                                    as: "response",
                                    in: "$$response.user_id"
                                }},
                                []
                            ]
                        }]
                    }
                }
            },
            {
                $project: {
                    batch_name: 1,
                    test_name: 1,
                    test_id: 1,
                    batch_id: 1,
                    start_time: 1,
                    end_time: 1,
                    hasUserSubmitted: 1,
                    status: {
                        $cond: {
                            if: { $and: [
                                { $lte: ["$startTimeNum", "$currentTimeNum"] },
                                { $gte: ["$endTimeNum", "$currentTimeNum"] }
                            ]},
                            then: 'live',
                            else: 'upcoming'
                        }
                    }
                }
            },
            { $sort: { start_time: 1 } }
        ];

        // Pipeline for ENDED tests
        const endedPipeline = [
            {
                $match: {
                    end_time: { 
                        $lt: currentTime,
                        $gte: sevenDaysAgo
                    }
                }
            },
            {
                $addFields: {
                    startTimeNum: { $toDouble: "$start_time" },
                    endTimeNum: { $toDouble: "$end_time" },
                    currentTimeNum: { $toDouble: currentTime },
                    hasUserSubmitted: {
                        $in: [req.user.userId, {
                            $ifNull: [
                                { $map: {
                                    input: "$user_responses",
                                    as: "response",
                                    in: "$$response.user_id"
                                }},
                                []
                            ]
                        }]
                    }
                }
            },
            {
                $project: {
                    batch_name: 1,
                    test_name: 1,
                    test_id: 1,
                    batch_id: 1,
                    start_time: 1,
                    end_time: 1,
                    hasUserSubmitted: 1
                }
            },
            { $sort: { end_time: -1 } }
        ];

        // Execute both queries in parallel
        const [liveTests, endedTests] = await Promise.all([
            liveTestsCollection.aggregate(livePipeline).toArray(),
            liveTestsCollection.aggregate(endedPipeline).toArray()
        ]);

        // Process live tests
        liveTests.forEach(test => {
            test.formatted_start_time = formatDateTime(test.start_time);
            test.formatted_end_time = formatDateTime(test.end_time);
            test.status = getTestStatus(test.start_time, test.end_time);
            test.batch_id = test.batch_id;
            test.test_id = test.test_id;
            
            if (test.status === 'live' && test.hasUserSubmitted) {
                test.buttonText = 'Attempted!';
                test.disableStartButton = true;
            } else if (test.status === 'live') {
                test.buttonText = 'Start Test';
                test.disableStartButton = false;
            } else {
                test.buttonText = 'Test Missed';
                test.disableStartButton = true;
            }
        });

        // Process ended tests
        endedTests.forEach(test => {
            test.formatted_start_time = formatDateTime(test.start_time);
            test.formatted_end_time = formatDateTime(test.end_time);
            test.userAttempted = test.hasUserSubmitted;
        
            if (test.userAttempted) {
                test.buttonText = 'View Result';
                test.buttonDisabled = false;
            } else {
                test.buttonText = 'Test Missed';
                test.buttonDisabled = true;
            }
        });

        // Restructure recent tests for the current user
        const restructuredTests = await restructureUserRecentTests(users, req.user.userId);

        // Render the dashboard with restructured data
        res.render('dashboard', {
            username: user.username,
            recentTests: restructuredTests,
            favoriteBatches: user.favoriteBatches || [],
            liveTests,
            endedTests,
            currentTime
        });

    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('An error occurred while loading the dashboard');
    }
};

module.exports = {dashboard}