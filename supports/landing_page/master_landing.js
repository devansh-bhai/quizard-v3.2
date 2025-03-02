
const {auth_check} = require('../middleware_auth/auth');
const { getDB } = require('../DataBase/db1');
//const { ObjectId } = require('mongodb');  // ✅ Required for `_id` query


async function batch_test (req, res) {
    let isLoggedIn = auth_check(req, res);
    try {
        // Use all_data database and access tests collection
        const testsCollection = getDB('allDataDb').collection('tests');

        // Fetch all documents from the tests collection
        const tests = await testsCollection.find({}, { projection: { name: 1, batch_id: 1, exam_name: 1, class: 1 } }).toArray();

        // Define categorized structure
        const categorizedBatches = {
            jee: { '11': [], '12': [] },
            neet: { '11': [], '12': [] },
            dropper: { jee: [], neet: [] },
            boards: { '10': [], '12': [] },
            other: []
        };

        // Process fetched data
        tests.forEach(test => {
            const batchData = {
                batch_name: test.name,
                batch_id: test._id
            };

            const examName = (test.exam_name || 'other').toLowerCase();
            const batchClass = test.class || 'other';

            if (['jee', 'neet', 'boards'].includes(examName)) {
                if (['11', '12', '10'].includes(batchClass)) {
                    categorizedBatches[examName][batchClass].push(batchData);
                } else if (batchClass === 'dropper') {
                    categorizedBatches['dropper'][examName].push(batchData);
                }
            } else {
                categorizedBatches['other'].push(batchData);
            }
        });

        // Render the response
        res.render('index', {
            categorizedBatches: categorizedBatches,
            isLoggedIn: isLoggedIn,
            type: "batch_test"
        });

    } catch (error) {
        console.error('Error in root route:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
};
                     






async function batch_dpp (req, res)  {
    try {
        // Use all_data database and access dpp collection
        const dppCollection = getDB('allDataDb').collection('dpp');

        // Fetch all documents from the dpp collection
        const dppData = await dppCollection.find({}, { projection: { name: 1, batch_id: 1, exam_name: 1, class: 1 } }).toArray();

        // Define categorized structure
        const categorizedBatches = {
            jee: { '11': [], '12': [] },
            neet: { '11': [], '12': [] },
            dropper: { jee: [], neet: [] },
            other: []
        };

        // Process fetched data
        dppData.forEach(dpp => {
            const batchData = {
                batch_name: dpp.name,
                batch_id: dpp._id
            };

            const examName = (dpp.exam_name || 'other').toLowerCase();
            const batchClass = dpp.class || 'other';

            if (['jee', 'neet'].includes(examName)) {
                if (['11', '12'].includes(batchClass)) {
                    categorizedBatches[examName][batchClass].push(batchData);
                } else if (batchClass === 'dropper') {
                    categorizedBatches['dropper'][examName].push(batchData);
                }
            } else {
                categorizedBatches['other'].push(batchData);
            }
        });

        // Render the response
        res.render('dpp_index', { categorizedBatches });

    } catch (error) {
        console.error('Error in /dpp route:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
};


async function test_series (req, res) {
    let isLoggedIn = auth_check(req, res);
    try {
        // Use all_data database and access test_series collection
        const testSeriesCollection = getDB('allDataDb').collection('test_series');

        // Fetch all documents from the test_series collection
        const testSeries = await testSeriesCollection.find({}, { projection: { name: 1, batch_id: 1 } }).toArray();

        // Define categorized structure
        const categorizedBatches = {
            other: []
        };

        // Process fetched data
        testSeries.forEach(test => {
            const batchData = {
                batch_name: test.name,
                batch_id: test._id
            };
            categorizedBatches['other'].push(batchData);
        });

        // Render the response
        res.render('index', {
            categorizedBatches: categorizedBatches,
            isLoggedIn: isLoggedIn,
            type: "test_series"
        });

    } catch (error) {
        console.error('Error in /test-series route:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
};




module.exports = { batch_test , batch_dpp , test_series}