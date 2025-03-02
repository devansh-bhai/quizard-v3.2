const { getDB } = require('../DataBase/db1');
const { formatUnixTimestampToIST } = require('../utils/time');

async function getBatchDetails(batch_id, batch_name, type) {
    try {
        const testSeriesArray = [];
        let tests;
        const collectionName = batch_id;

        const pipeline = [
            {
                $project: {
                    test_name: 1,
                    test_id: 1,
                    questions_count: { $size: { $ifNull: ['$questions', []] } },
                    instructions_html: { $ifNull: ['$instructions_html', ''] },
                    test_date: 1
                }
            }
        ];

        if (type === "batch_test") {
            tests = await getDB('test_db').collection(collectionName).aggregate(pipeline).toArray();
        } else if (type === "test_series") {
            tests = await getDB('testSeriesDb').collection(collectionName).aggregate(pipeline).toArray();
        } else {
            throw new Error("Invalid test type");
        }

        tests.forEach((test) => {
            testSeriesArray.unshift({
                test_name: test.test_name,
                test_id: test.test_id,
                questions_count: test.questions_count,
                instructions_html: test.instructions_html,
                test_date: formatUnixTimestampToIST(test.test_date)
            });
        });

        return {
            batch_name,
            test_series: testSeriesArray,
            batch_id,
            type
        };
    } catch (error) {
        console.error('Error fetching batch details:', error);
        return { error: 'An error occurred while fetching batch details' };
    }
}

module.exports = { getBatchDetails };
