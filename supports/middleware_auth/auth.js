const jwt = require('jsonwebtoken');

const JWT_SECRET = '132432xsdcdscjnmb';

function auth_check(req, res) {
    const token = req.cookies.auth_token;
    if (!token) {
      return false;
        //next();
       // console.log("auth check")
    }
    else{
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
       return  true;
    }
}

module.exports = {auth_check}