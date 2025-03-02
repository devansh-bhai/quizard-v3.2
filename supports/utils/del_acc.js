const { getDB } = require('../DataBase/db1');
const { ObjectId } = require('mongodb');  // ✅ Required for `_id` query
const bcrypt = require('bcryptjs');
async function delete_acc (req, res)  {
    const { password } = req.body;

    try {
        const users = getDB('users');
        const user = await users.findOne({ _id: new ObjectId(req.user.userId) });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify the password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Delete the user account
        await users.deleteOne({ _id: new ObjectId(req.user.userId) });

        // Clear cookies
        res.clearCookie('auth_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        // Destroy session and respond
        req.session.destroy(() => {
            res.status(200).json({ message: 'Account deleted successfully' });
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'An error occurred while deleting your account' });
    }
};

module.exports = {delete_acc}
