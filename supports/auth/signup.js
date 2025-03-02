const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../DataBase/db1');

const signup_limit = 2000;
const JWT_SECRET = '132432xsdcdscjnmb';
async function signup(req, res) {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {

        const users = getDB('users');
        const existingUser = await users.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await users.insertOne({ username, email, password: hashedPassword });

        const token = jwt.sign({ userId: newUser.insertedId.toString(), username }, 'JWT_SECRET', { expiresIn: '1d' });
        res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 86400000 });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
}

module.exports = { signup };
