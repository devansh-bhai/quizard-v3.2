


const calculate_live_Marks = async (batchId, testId, userId, testData, userAnswers) => {
    try {
        if (!testData) return [{}, {}];

        const dbQuestions = testData.questions || [];
        const correctAnswers = testData.correct_answers || [];

        let overallReport = {
            totalQuestions: dbQuestions.length,
            attempted: 0,
            skipped: 0,
            wrong: 0,
            right: 0,
            totalMarks: 0,
            accuracy: 0,
            sectionStats: {} // Section-wise stats
        };

        let sections = {};

        dbQuestions.forEach((dbQuestion, index) => {
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
                    attempted: 0,
                    accuracy: 0
                };
            }
            
            if (!sections[section]) {
                sections[section] = {
                    questions: [],
                    totalMarks: 0,
                    accuracy: 0,
                    attempted: 0
                };
            }

            overallReport.sectionStats[section].total_ques++;
            
            const userAnswer = userAnswers[index];
            const correctAnswer = correctAnswers[index];
            const questionType = dbQuestion.type;
            const marks = dbQuestion.marks || { correct: 1, wrong: 0 };

            if (userAnswer === null) {
                overallReport.skipped++;
                overallReport.sectionStats[section].skipped_ques++;
            } else {
                overallReport.attempted++;
                overallReport.sectionStats[section].attempted++;
                sections[section].attempted++;

                if (questionType === 'integer') {
                    if (parseFloat(userAnswer) === parseFloat(correctAnswer)) {
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
                question: dbQuestion,
                userAnswer: userAnswer,
                type: questionType,
                marks: marks,
                answer: correctAnswer,
                options: dbQuestion.options || ['A', 'B', 'C', 'D']
            });
        });

        overallReport.accuracy = overallReport.attempted > 0 ? (overallReport.right / overallReport.attempted) * 100 : 0;

        Object.keys(overallReport.sectionStats).forEach(section => {
            const sectionData = overallReport.sectionStats[section];
            sectionData.accuracy = sectionData.attempted > 0
                ? (sectionData.correct_ques / sectionData.attempted) * 100
                : 0;
        });

        Object.keys(sections).forEach(section => {
            sections[section].accuracy = sections[section].attempted > 0
                ? (overallReport.sectionStats[section].correct_ques / sections[section].attempted) * 100
                : 0;
        });

        return [overallReport, sections];
    } catch (error) {
        console.error('Error calculating live test marks:', error);
        return [{}, {}];
    }
};


module.exports = { calculate_live_Marks }