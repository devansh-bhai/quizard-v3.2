
const { getDB } = require('../DataBase/db1');



async function get_subject_name (req, res) {
    const { batch_name, batch_id, subject_slug } = req.params;

    if (!batch_name || !batch_id || !subject_slug) {
        return res.status(400).json({ 
            error: 'Missing required parameters' 
        });
    }

    try {
        // Use direct collection name format
        //const collectionName = `name_${batch_name}&batch_${batch_id}`;
        const collectionName = batch_id;
        
        // Use simple findOne query instead of aggregation
        const result = await getDB('dpp_quiz').collection(collectionName).findOne(
            { subject_slug: subject_slug },
            { projection: { subject_name: 1, _id: 0 } }
        );

        if (!result) {
            return res.status(404).json({
                error: 'Subject not found'
            });
        }

        // Return the subject name
        res.json({
            success: true,
            subject_name: result.subject_name,
            subject_slug
        });

    } catch (error) {
        console.error('Error fetching subject name:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};


module.exports = { get_subject_name }