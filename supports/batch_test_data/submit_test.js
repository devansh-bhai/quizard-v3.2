


const { getDB } = require('../DataBase/db1');
const { ObjectId } = require('mongodb');
const { formatUnixTimestampToIST } = require('../utils/time');
const { encodeBase64 } = require('../utils/encodeBase64'); 
const { generateResultHtml } = require('../utils/generateResultHtml');

// const calculateMarks = async (batchId, batch_name, testId, type, userQuestions) => {
//     // const collectionName = `name_${batch_name}&batch_${batchId}`;
//     const collectionName = batchId;
//     let testData; 
//     if (type == "test_series"){
//         testData =  await getDB('testSeriesDb').collection(collectionName).findOne({ test_id: testId });
//     }else {
//         testData =  await getDB('test_db').collection(collectionName).findOne({ test_id: testId });
//     }

//     if (!testData) return [{}, {}];
//     const dbQuestions = testData.questions || [];
   
//     let overallReport = {
//         totalQuestions: userQuestions.length,
//         attempted: 0,
//         skipped: 0,
//         wrong: 0,
//         right: 0,
//         totalMarks: 0,
//         accuracy: 0,
//         sectionStats: {} // New field for section-wise statistics
//     };
//     let sections = {};

//     userQuestions.forEach((userQuestion, index) => {
//         const dbQuestion = dbQuestions[index];
//         const section = dbQuestion.section || 'Default';
        
//         // Initialize section stats if not exists
//         if (!overallReport.sectionStats[section]) {
//             overallReport.sectionStats[section] = {
//                 name: section,
//                 total_ques: 0,
//                 correct_ques: 0,
//                 wrong_ques: 0,
//                 skipped_ques: 0,
//                 marks: 0
//             };
//         }
        
//         if (!sections[section]) {
//             sections[section] = {
//                 questions: [],
//                 totalMarks: 0,
//                 accuracy: 0
//             };
//         }

//         // Increment total questions for this section
//         overallReport.sectionStats[section].total_ques++;

//         const userAnswer = userQuestion.userAnswer;
//         const correctAnswer = dbQuestion.answer;
//         const questionType = dbQuestion.type;
//         const marks = dbQuestion.marks || { correct: 1, wrong: 0 };

//         if (userAnswer === null) {
//             overallReport.skipped++;
//             overallReport.sectionStats[section].skipped_ques++;
//         } else {
//             overallReport.attempted++;

//             if (questionType === 'integer') {
//                 const userAnswerFloat = parseFloat(userAnswer);
//                 const correctAnswerFloat = parseFloat(correctAnswer);
//                 if (userAnswerFloat === correctAnswerFloat) {
//                     overallReport.right++;
//                     overallReport.sectionStats[section].correct_ques++;
//                     sections[section].totalMarks += marks.correct;
//                     overallReport.totalMarks += marks.correct;
//                     overallReport.sectionStats[section].marks += marks.correct;
//                 } else {
//                     overallReport.wrong++;
//                     overallReport.sectionStats[section].wrong_ques++;
//                     sections[section].totalMarks -= marks.wrong;
//                     overallReport.totalMarks -= marks.wrong;
//                     overallReport.sectionStats[section].marks -= marks.wrong;
//                 }
//             } else if (questionType === 'multi') {
//                 const correctAnswerArray = (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer])
//                     .map(ans => parseInt(ans))
//                     .sort((a, b) => a - b);
                
//                 const userAnswerArray = (Array.isArray(userAnswer) ? userAnswer : [userAnswer])
//                     .map(ans => parseInt(ans))
//                     .sort((a, b) => a - b);
                    
//                 if (JSON.stringify(correctAnswerArray) === JSON.stringify(userAnswerArray)) {
//                     overallReport.right++;
//                     overallReport.sectionStats[section].correct_ques++;
//                     sections[section].totalMarks += marks.correct;
//                     overallReport.totalMarks += marks.correct;
//                     overallReport.sectionStats[section].marks += marks.correct;
//                 } else {
//                     const correctlySelectedOptions = userAnswerArray.filter(ans => 
//                         correctAnswerArray.includes(ans)
//                     );
//                     const incorrectlySelectedOptions = userAnswerArray.filter(ans => 
//                         !correctAnswerArray.includes(ans)
//                     );
            
//                     if (correctlySelectedOptions.length === correctAnswerArray.length) {
//                         overallReport.right++;
//                         overallReport.sectionStats[section].correct_ques++;
//                         sections[section].totalMarks += marks.correct;
//                         overallReport.totalMarks += marks.correct;
//                         overallReport.sectionStats[section].marks += marks.correct;
//                     } else if (correctlySelectedOptions.length === 1) {
//                         overallReport.right++;
//                         overallReport.sectionStats[section].correct_ques++;
//                         sections[section].totalMarks += 1;
//                         overallReport.totalMarks += 1;
//                         overallReport.sectionStats[section].marks += 1;
//                     } else if (incorrectlySelectedOptions.length > 0) {
//                         overallReport.wrong++;
//                         overallReport.sectionStats[section].wrong_ques++;
//                         sections[section].totalMarks -= 2;
//                         overallReport.totalMarks -= 2;
//                         overallReport.sectionStats[section].marks -= 2;
//                     } 
//                 }
//             } else {
//                 if (parseInt(userAnswer) === parseInt(correctAnswer)) {
//                     overallReport.right++;
//                     overallReport.sectionStats[section].correct_ques++;
//                     sections[section].totalMarks += marks.correct;
//                     overallReport.totalMarks += marks.correct;
//                     overallReport.sectionStats[section].marks += marks.correct;
//                 } else {
//                     overallReport.wrong++;
//                     overallReport.sectionStats[section].wrong_ques++;
//                     sections[section].totalMarks -= marks.wrong;
//                     overallReport.totalMarks -= marks.wrong;
//                     overallReport.sectionStats[section].marks -= marks.wrong;
//                 }
//             }
//         }
       
//         sections[section].questions.push({
//             question: userQuestion,
//             userAnswer: userAnswer,
//             type: questionType,
//             marks: marks,
//             answer: correctAnswer,
//             options: dbQuestion.options || ['A','B','C','D']
//         });
//     });

//     overallReport.accuracy = overallReport.attempted > 0 ? (overallReport.right / overallReport.attempted) * 100 : 0;

//     return [overallReport, sections];
// };

const calculateMarks = async (batchId, batch_name, testId, type, userQuestions) => {
    // const collectionName = `name_${batch_name}&batch_${batchId}`;
    const collectionName = batchId;
    let testData; 
    if (type == "test_series"){
        testData =  await getDB('testSeriesDb').collection(collectionName).findOne({ test_id: testId });
    }else {
        testData =  await getDB('test_db').collection(collectionName).findOne({ test_id: testId });
    }

    if (!testData) return [{}, {}];
    const dbQuestions = testData.questions || [];
   
    let overallReport = {
        totalQuestions: userQuestions.length,
        attempted: 0,
        skipped: 0,
        wrong: 0,
        right: 0,
        totalMarks: 0,
        accuracy: 0,
        sectionStats: {} // New field for section-wise statistics
    };
    let sections = {};

    userQuestions.forEach((userQuestion, index) => {
        const dbQuestion = dbQuestions[index];
        const section = dbQuestion.section || 'Default';
        
        // Initialize section stats if not exists
        if (!overallReport.sectionStats[section]) {
            overallReport.sectionStats[section] = {
                name: section,
                total_ques: 0,
                correct_ques: 0,
                wrong_ques: 0,
                skipped_ques: 0,
                marks: 0,
                attempted: 0,  // Track attempted questions per section
                accuracy: 0    // Add accuracy field for each section
            };
        }
        
        if (!sections[section]) {
            sections[section] = {
                questions: [],
                totalMarks: 0,
                accuracy: 0,
                attempted: 0   // Track attempted questions in sections object too
            };
        }

        // Increment total questions for this section
        overallReport.sectionStats[section].total_ques++;

        const userAnswer = userQuestion.userAnswer;
        const correctAnswer = dbQuestion.answer;
        const questionType = dbQuestion.type;
        const marks = dbQuestion.marks || { correct: 1, wrong: 0 };

        if (userAnswer === null) {
            overallReport.skipped++;
            overallReport.sectionStats[section].skipped_ques++;
        } else {
            overallReport.attempted++;
            overallReport.sectionStats[section].attempted++; // Track section attempts
            sections[section].attempted++; // Track attempts in sections object

            if (questionType === 'integer') {
                const userAnswerFloat = parseFloat(userAnswer);
                const correctAnswerFloat = parseFloat(correctAnswer);
                if (userAnswerFloat === correctAnswerFloat) {
                    overallReport.right++;
                    overallReport.sectionStats[section].correct_ques++;
                    sections[section].totalMarks += marks.correct;
                    overallReport.totalMarks += marks.correct;
                    overallReport.sectionStats[section].marks += marks.correct;
                } else {
                    overallReport.wrong++;
                    overallReport.sectionStats[section].wrong_ques++;
                    sections[section].totalMarks -= marks.wrong;
                    overallReport.totalMarks -= marks.wrong;
                    overallReport.sectionStats[section].marks -= marks.wrong;
                }
            } else if (questionType === 'multi') {
                const correctAnswerArray = (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer])
                    .map(ans => parseInt(ans))
                    .sort((a, b) => a - b);
                
                const userAnswerArray = (Array.isArray(userAnswer) ? userAnswer : [userAnswer])
                    .map(ans => parseInt(ans))
                    .sort((a, b) => a - b);
                    
                if (JSON.stringify(correctAnswerArray) === JSON.stringify(userAnswerArray)) {
                    overallReport.right++;
                    overallReport.sectionStats[section].correct_ques++;
                    sections[section].totalMarks += marks.correct;
                    overallReport.totalMarks += marks.correct;
                    overallReport.sectionStats[section].marks += marks.correct;
                } else {
                    const correctlySelectedOptions = userAnswerArray.filter(ans => 
                        correctAnswerArray.includes(ans)
                    );
                    const incorrectlySelectedOptions = userAnswerArray.filter(ans => 
                        !correctAnswerArray.includes(ans)
                    );
            
                    if (correctlySelectedOptions.length === correctAnswerArray.length) {
                        overallReport.right++;
                        overallReport.sectionStats[section].correct_ques++;
                        sections[section].totalMarks += marks.correct;
                        overallReport.totalMarks += marks.correct;
                        overallReport.sectionStats[section].marks += marks.correct;
                    } else if (correctlySelectedOptions.length === 1) {
                        overallReport.right++;
                        overallReport.sectionStats[section].correct_ques++;
                        sections[section].totalMarks += 1;
                        overallReport.totalMarks += 1;
                        overallReport.sectionStats[section].marks += 1;
                    } else if (incorrectlySelectedOptions.length > 0) {
                        overallReport.wrong++;
                        overallReport.sectionStats[section].wrong_ques++;
                        sections[section].totalMarks -= 2;
                        overallReport.totalMarks -= 2;
                        overallReport.sectionStats[section].marks -= 2;
                    } 
                }
            } else {
                if (parseInt(userAnswer) === parseInt(correctAnswer)) {
                    overallReport.right++;
                    overallReport.sectionStats[section].correct_ques++;
                    sections[section].totalMarks += marks.correct;
                    overallReport.totalMarks += marks.correct;
                    overallReport.sectionStats[section].marks += marks.correct;
                } else {
                    overallReport.wrong++;
                    overallReport.sectionStats[section].wrong_ques++;
                    sections[section].totalMarks -= marks.wrong;
                    overallReport.totalMarks -= marks.wrong;
                    overallReport.sectionStats[section].marks -= marks.wrong;
                }
            }
        }
       
        sections[section].questions.push({
            question: userQuestion,
            userAnswer: userAnswer,
            type: questionType,
            marks: marks,
            answer: correctAnswer,
            options: dbQuestion.options || ['A','B','C','D']
        });
    });

    // Calculate overall accuracy
    overallReport.accuracy = overallReport.attempted > 0 ? (overallReport.right / overallReport.attempted) * 100 : 0;
    
    // Calculate section-wise accuracy
    Object.keys(overallReport.sectionStats).forEach(section => {
        const sectionData = overallReport.sectionStats[section];
        sectionData.accuracy = sectionData.attempted > 0 
            ? (sectionData.correct_ques / sectionData.attempted) * 100 
            : 0;
    });
    
    // Calculate accuracy in sections object too
    Object.keys(sections).forEach(section => {
        sections[section].accuracy = sections[section].attempted > 0 
            ? (overallReport.sectionStats[section].correct_ques / sections[section].attempted) * 100 
            : 0;
    });

    return [overallReport, sections];
};
// Store recent test result in the user's history
async function storeRecentTest(userId, batchId, batch_name, test_name, testId, base64ResultHtml, type) {
    try {
        const usersCollection = getDB('users')

        const testTypeKey = type === 'test_series' ? 'test_series' : 'batch_test';
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) return false;

        const recentTests = user.recentTests?.[testTypeKey] || [];
        const newTestResult = {
            batchId,
            batch_name,
            test_name,
            testId,
            resultHtml: base64ResultHtml,
            testType: testTypeKey,
            timestamp: formatUnixTimestampToIST(Math.floor(Date.now() / 1000))
        };

        // Remove existing test entry if found
        const existingTestIndex = recentTests.findIndex(test => test.testId === testId);
        if (existingTestIndex >= 0) {
            recentTests.splice(existingTestIndex, 1);
        }

        // Add new test at the beginning
        recentTests.unshift(newTestResult);

        // Limit history size (e.g., 10 tests)
        const recent_test_limit = 10;
        if (recentTests.length > recent_test_limit) {
            recentTests.pop();
        }

        // Update user record
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { [`recentTests.${testTypeKey}`]: recentTests } }
        );

        return true;
    } catch (error) {
        console.error('Error in storeRecentTest:', error);
        return false;
    }
}

// Generate result HTML in base64 format
function generateBase64ResultHtml(overallReport, sections) {
    const resultHtml = generateResultHtml({ overallReport, sections });
    return encodeBase64(resultHtml);
}

module.exports = { calculateMarks, storeRecentTest, generateBase64ResultHtml };
