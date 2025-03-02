const { getDB } = require('../DataBase/db1');
const { ObjectId } = require('mongodb');

async function get_id_info(params, res) {
    try {
        const { batch_id_or_id, type } = params;
        const allDataDb = getDB('allDataDb'); // Ensure database connection
        
        
        // Mapping request type to actual collection names in all_data
        const collectionMap = {
            "batch_test": "tests",
            "batch_dpp": "dpp",
            "test_series": "test_series"
        };
        
        // Validate type and get the corresponding collection name
        const collectionName = collectionMap[type];
        if (!collectionName) {
            return res.status(400).json({ success: false, error: "Invalid type parameter" });
        }
        
        const collection = allDataDb.collection(collectionName);
        

        const batchDataList = await collection.find(
            { $or: [{ batch_id: batch_id_or_id }, { _id: batch_id_or_id }] },
            { projection: { _id: 1, name: 1, batch_id: 1 } }
        ).toArray();
        
        // If no document found, return false
        if (batchDataList.length === 0) {
            return res.json({ success: false, message: "Not Found :(", type });
        }
        
        // If multiple matches exist, handle conflict
        if (batchDataList.length > 1) {
            return res.json({
                success: false,
                error: "Conflict: Multiple documents found for the given batch_id or _id",
                data: batchDataList,
                type
            });
        }
        
        // If only one document found, return success
        const batchData = batchDataList[0];
        return res.json({
            success: true,
            message: "Found :)",
            _id: batchData._id,
            batch_name: batchData.name,
            batch_id: batchData.batch_id,
            type
        });
    } catch (error) {
        console.error("Error verifying batch:", error);
        return res.status(500).json({ success: false, error: "An error occurred while verifying the batch" });
    }
}

module.exports = { get_id_info };