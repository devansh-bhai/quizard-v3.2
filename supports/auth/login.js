const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../DataBase/db1');

const JWT_SECRET = '132432xsdcdscjnmb';
async  function login(req, res) {
    const { username, password } = req.body;
    try {
        // Use projection to retrieve only necessary fields
        const users = getDB('users');
        const user = await users.findOne(
            { $or: [{ username }, { email: username }] }, 
            { projection: { _id: 1, username: 1, password: 1 } }
        );

        if (user && await bcrypt.compare(password, user.password)) {
            // Update the last login time asynchronously to avoid slowing down response
            users.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }).catch(console.error);

            // Generate JWT token
            const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '1d' });

            res.cookie('auth_token', token, { 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });

           // return res.redirect('/dashboard');
           return res.status(200).json({ success: true });
        }

        res.status(400).json({ error: 'Invalid username/email or password' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
};

module.exports = { login }