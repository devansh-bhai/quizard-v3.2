
const { getDB } = require('../DataBase/db1');
const { formatUnixTimestampToIST } = require('../utils/time');
const { encodeBase64 } = require('../utils/encodeBase64');
const { generateResultHtml } = require('../utils/generateResultHtml');
const { ObjectId } = require('mongodb');  // ✅ Required for `_id` query

const recent_test_limit = 5;

async function submit_dpp (req, res)  {
    const data = req.body;
    const batchId = data.batch_id;
    const testId = data.test_id;
    const batch_name = data.batch_name;
    const test_name = data.test_name;
    const subject_slug = data.subject_slug; 
    const subject_name = data.subject_name;
    const userQuestions = data.questions || [];


    if (!batchId || !testId) {
        return res.status(400).json({ error: 'Missing batch_id or test_id' });
    }

    try {
        // Calculate marks and sections
        const [overallReport, sections] = await dpp_calculateMarks(batchId, testId, userQuestions);

        // Generate result HTML
        const responseData = {
            overallReport: overallReport,
            sections: sections
        };
        
        const base64ResultHtml = encodeBase64(generateResultHtml(responseData));
       
        if (req.cookies.auth_token) {
            console.log("token check");

            const userId = new ObjectId(req.user.userId);
            const users = getDB('users');
            const user = await users.findOne({ _id: userId });

            if (user) {
                console.log("user check");
                // Ensure recentTests is an array
                const recentTests = user.recentTests?.batch_dpp || [];

                const newTestResult = {
                    batchId,
                    batch_name,
                    test_name,
                    testId,
                    subject_slug,
                    subject_name,
                    resultHtml: base64ResultHtml,
                    testType: 'batch_dpp',
                    timestamp: formatUnixTimestampToIST(Math.floor(Date.now() / 1000))
                };

                // Find if the test already exists
                const existingTestIndex = recentTests.findIndex(test => test.testId === testId);

                if (existingTestIndex >= 0) {
                    // Remove the existing test
                    recentTests.splice(existingTestIndex, 1);
                }

                // Add new test at the beginning of the array
                recentTests.unshift(newTestResult);

                // Remove the oldest test if limit is exceeded
                if (recentTests.length > recent_test_limit) {
                    recentTests.pop(); // Remove the last (oldest) test
                }

                // Update the user's recent tests in the database
                await users.updateOne(
                    { _id: userId },
                    { $set: { 'recentTests.batch_dpp': recentTests } }
                );

                res.json({
                    success: true,
                    result: base64ResultHtml,
                    overallReport: overallReport,
                    message: "Dpp submitted successfully & Updated in Your Dashboard too"
                });
            }       
        } else {
            res.json({
                success: true,
                result: base64ResultHtml,
                overallReport: overallReport,
                message: "No login Found for You Buddy"
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({success: false, error: 'Internal Server Error' });
    }
};


const dpp_calculateMarks = async (batchId, testId, userQuestions) => { 
    // Dynamically find the collection name that includes `batch_${batchId}`
    // const collectionNames = await dpp_quiz.listCollections({}, { nameOnly: true }).toArray();
    // const matchingCollection = collectionNames.find(col => col.name.includes(`batch_${batchId}`));

    // if (!matchingCollection) {
    //     console.warn(`No collection found that includes batch_${batchId}`);
    //     return [{}, {}]; // Return empty results if no matching collection is found
    // }

    //const collectionName = matchingCollection.name;
    const collectionName = batchId;

    // Construct aggregation pipeline to fetch test data
    const aggregationPipeline = [
        { $unwind: '$chapters' },
        { $unwind: '$chapters.entries' },
        { 
            $match: { 
                'chapters.entries.test_id': testId 
            } 
        },
        { 
            $project: { 
                testData: '$chapters.entries.questions',
                _id: 0 
            } 
        }
    ];

    // Execute the aggregation
    const [result] = await getDB('dpp_quiz').collection(collectionName)
        .aggregate(aggregationPipeline)
        .toArray();

    // Handle case where no test data is found
    if (!result || !result.testData) {
        console.warn(`Test ID ${testId} not found in collection ${collectionName}`);
        return [{}, {}];
    }

    const dbQuestions = result.testData || [];

    // Initialize reports and sections
    let overallReport = {
        totalQuestions: userQuestions.length,
        attempted: 0,
        skipped: 0,
        wrong: 0,
        right: 0,
        totalMarks: 0,
        accuracy: 0,
        sectionStats: {} // Add sectionStats object like in the original function
    };
    
    // Use an object instead of a Map to maintain the same return format as the test function
    let sections = {};

    // Process user questions
    for (const [index, userQuestion] of userQuestions.entries()) {
        const dbQuestion = dbQuestions[index];
        if (!dbQuestion) {
            console.warn(`Question at index ${index} not found in test data`);
            continue;
        }

        const section = dbQuestion.section || 'Default';
        
        // Initialize section stats in overallReport if not exists
        if (!overallReport.sectionStats[section]) {
            overallReport.sectionStats[section] = {
                name: section,
                total_ques: 0,
                correct_ques: 0,
                wrong_ques: 0,
                skipped_ques: 0,
                marks: 0,
                attempted: 0,
                accuracy: 0
            };
        }
        
        // Initialize section in sections object if not exists
        if (!sections[section]) {
            sections[section] = {
                questions: [],
                totalMarks: 0,
                accuracy: 0,
                attempted: 0
            };
        }

        // Increment total questions for this section
        overallReport.sectionStats[section].total_ques++;

        const userAnswer = userQuestion.userAnswer;
        const correctAnswer = dbQuestion.answer?.$numberInt || dbQuestion.answer;
        const questionType = dbQuestion.type;
        const marks = dbQuestion.marks 
            ? {
                correct: dbQuestion.marks.correct?.$numberInt || dbQuestion.marks.correct || 1,
                wrong: dbQuestion.marks.wrong?.$numberInt || dbQuestion.marks.wrong || 0
            }
            : { correct: 1, wrong: 0 };

        if (userAnswer === null) {
            overallReport.skipped++;
            overallReport.sectionStats[section].skipped_ques++;
        } else {
            overallReport.attempted++;
            sections[section].attempted++;
            overallReport.sectionStats[section].attempted++;

            const isCorrect = questionType === 'integer'
                ? parseFloat(userAnswer) === parseFloat(correctAnswer)
                : parseInt(userAnswer) === parseInt(correctAnswer);

            if (isCorrect) {
                overallReport.right++;
                overallReport.totalMarks += marks.correct;
                sections[section].totalMarks += marks.correct;
                overallReport.sectionStats[section].correct_ques++;
                overallReport.sectionStats[section].marks += marks.correct;
            } else {
                overallReport.wrong++;
                overallReport.totalMarks -= marks.wrong;
                sections[section].totalMarks -= marks.wrong;
                overallReport.sectionStats[section].wrong_ques++;
                overallReport.sectionStats[section].marks -= marks.wrong;
            }
        }

        sections[section].questions.push({
            question: userQuestion,
            userAnswer: userAnswer,
            type: questionType,
            marks: marks,
            answer: correctAnswer,
            options: dbQuestion.options || ['A', 'B', 'C', 'D'],
            video_soln: dbQuestion.video_soln || ' '
        });
    }

    // Calculate overall accuracy
    overallReport.accuracy = overallReport.attempted > 0 ? (overallReport.right / overallReport.attempted) * 100 : 0;

    // Calculate section accuracies in both data structures
    Object.keys(sections).forEach(section => {
        sections[section].accuracy = sections[section].attempted > 0 
            ? (overallReport.sectionStats[section].correct_ques / sections[section].attempted) * 100 
            : 0;
            
        // Set the same accuracy in overallReport.sectionStats
        overallReport.sectionStats[section].accuracy = overallReport.sectionStats[section].attempted > 0 
            ? (overallReport.sectionStats[section].correct_ques / overallReport.sectionStats[section].attempted) * 100 
            : 0;
    });

    return [overallReport, sections];
};



module.exports = { submit_dpp , dpp_calculateMarks }