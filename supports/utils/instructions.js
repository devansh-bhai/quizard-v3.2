const { getDB } = require('../DataBase/db1');

async function getInstructions(batch_id, batch_name, test_id, mode) {
    try {
        
        let test;

        if (mode === "live") {
            test = await getDB('live_test_db').collection('live_test').findOne({ 
                batch_id: batch_id,
                test_id: test_id 
            });
        } else if (mode === "test_series") {
            test = await getDB('testSeriesDb').collection(batch_id).findOne({ 
                test_id: test_id 
            });
        } else {
            test = await getDB('test_db').collection(batch_id).findOne({ 
                test_id: test_id 
            });
        }

        return { 
            instructions_html: test?.instructions_html || '<p>Oops! No instructions found :(</p>' 
        };

    } catch (error) {
        console.error('Error fetching instructions:', error);
        return { error: 'Internal Server Error' };
    }
}

module.exports = { getInstructions };
