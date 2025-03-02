
const { getDB } = require('../DataBase/db1');


async function dpp_test_data (req, res)  {
    const { batchId, subjectSlug, testId, batch_name } = req.params;

    try {
        // Construct the collection name dynamically using batch_name and batchId
        //const collectionName = `name_${batch_name}&batch_${batchId}`;
        const collectionName = batchId;
        const collection = getDB('dpp_quiz').collection(collectionName);

        // Find the document by subjectSlug with projection to fetch only necessary fields
        const document = await collection.findOne(
            { subject_slug: subjectSlug },
            { projection: { chapters: 1 } }
        );

        if (!document) {
            return res.status(404).json( { error: 'Document not found for the given subject slug' , batch_name:batch_name });
        }

        let testData = null;

        // Iterate through chapters and entries to find the test
        for (const chapter of document.chapters) {
            for (const entry of chapter.entries) {
                if (entry.test_id === testId) {
                    testData = {
                        test_name: entry.test_name,
                        test_id: entry.test_id,
                        questions: entry.questions.map(question => ({
                            question: question.question || '<p>ERROR FETCHING QUESTION CONTACT SUPPORT </p>',
                            type: question.type || '',
                            options: question.options || ["A", "B", "C", "D"],
                            userAnswer: null,  // Initialize as null
                            skipped: false,    // Initialize as false
                            timeTaken: 0,      // Initialize as 0
                            section: question.section || 'Unknown',
                            marks: question.marks || { correct: 4, wrong: 0 }
                        }))
                    };
                    break; // Exit the loop once the test is found
                }
            }
            if (testData) break; // Exit the outer loop if the test is found
        }

        if (testData) {
            // Pass testData.questions as JSON to EJS
            res.render('test_template', {
                questions: JSON.stringify(testData.questions),
                is_dpp: true,
                type:"dpp_test",
                test_name: `${testData.test_name}`,
                batch_id :batchId  ,
                test_id :testId ,
                batch_name, // Include batch_name in the template if needed
                submit_url: "/submit-dpp-quiz"
            });
        } else {
            res.status(404).render('dpp_test_template', { error: 'Test data not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};


module.exports = { dpp_test_data }