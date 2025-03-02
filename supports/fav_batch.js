const { getDB } = require('./DataBase/db1');
const { ObjectId } = require('mongodb');  // ✅ Required for `_id` query
const jwt = require('jsonwebtoken');

const add_to_fav_limit = 5;
const JWT_SECRET = '132432xsdcdscjnmb';

async function add_fav (req, res) {
    try {
        const { batchId, batchName } = req.body;
        const userId = new ObjectId(req.user.userId);

        if (!batchId || !batchName) {
            return res.status(400).json({ message: 'Batch ID and Name are required' });
        }
        const users = getDB('users');
        const user = await users.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const favoriteBatches = user.favoriteBatches || [];

        const batchExists = favoriteBatches.some(batch => batch.batchId === batchId);
        if (batchExists) {
            return res.json({ message: 'Batch is already in your favorites' });
        }

        if (favoriteBatches.length >= add_to_fav_limit) {
            return res.status(400).json({ message: 'Favorite limit reached' });
        }

        const result = await users.updateOne(
            { _id: userId },
            { $push: { favoriteBatches: { batchId, batchName } } }
        );

        if (result.modifiedCount > 0) {
            res.json({ message: 'Batch added to favorites successfully' });
        } else {
            res.status(500).json({ message: 'Failed to add batch to favorites' });
        }
    } catch (error) {
        console.error('Error adding batch to favorites:', error);
        res.status(500).json({ message: 'An error occurred while adding batch to favorites' });
    }
};


async function del_fav(req,res)  {
    try {
        const { batchId } = req.body; // Get the batch ID from the request body
        const token = req.cookies.auth_token;
        const decoded = jwt.verify(token, JWT_SECRET);
        const username = decoded.username;

        // Validate input
        if (!batchId) {
            return res.status(400).json({ message: 'Batch ID is required' });
        }

        // Find the user and remove the batch from their favorite list
        const users = getDB('users');
        const result = await users.updateOne(
            { username: username },
            { $pull: { favoriteBatches: { batchId: batchId } } } // Use $pull to remove the batch
        );

        if (result.modifiedCount > 0) {
            res.json({ message: 'Batch removed from favorites successfully' });
        } else {
            res.status(404).json({ message: 'Batch not found in favorites' });
        }
    } catch (error) {
        console.error('Error removing batch from favorites:', error);
        res.status(500).json({ message: 'An error occurred while removing batch from favorites' });
    }

};


module.exports = { add_fav , del_fav };
