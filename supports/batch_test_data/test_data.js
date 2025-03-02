const { getDB } = require('../DataBase/db1');

async function getTestData(batchId, testId, batch_name, type) {
    try {
        let testData = null;
        const collectionName = batchId;

        if (type === "batch_test") {
            testData = await getDB('test_db').collection(collectionName).findOne({ test_id: testId });
        } else if (type === "test_series") {
            testData = await getDB('testSeriesDb').collection(collectionName).findOne({ test_id: testId });
        } else {
            throw new Error("Invalid test type");
        }

        if (!testData) {
            return { error: 'Test data not found' };
        }

        // Process the test data
        return {
            test_name: testData.test_name,
            test_id: testData.test_id,
            questions: testData.questions.map(question => ({
                question: question.question || '',
                type: question.type || '',
                options: question.options || ["A", "B", "C", "D"],
                userAnswer: null,  // Initialize as null
                skipped: false,    // Initialize as false
                visited: false,
                timeTaken: 0,      // Initialize as 0
                section: question.section || 'N/A',
                marks: question.marks || { "correct": 1, "wrong": 0 }
            }))
        };
    } catch (error) {
        console.error('Error fetching test data:', error);
        return { error: 'An error occurred while fetching test data' };
    }
}

module.exports = { getTestData };
