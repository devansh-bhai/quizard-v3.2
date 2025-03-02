
const bcrypt = require('bcryptjs');

const encodeBase64 = (data) => {
    return Buffer.from(data).toString('base64'); 
};

module.exports = { encodeBase64 };
