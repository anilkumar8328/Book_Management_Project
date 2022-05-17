const jwt = require('jsonwebtoken');
const authorization = async function(req, res, next) {
    try {
        const token = req.headers['x-api-key'];
        if (!token)
            return res.status(400).send({ status: false, msg: "Token is required" });
        const decodedToken = jwt.verify(token, 'Uranium_project3_group10');
        if (!decodedToken)  return res.status(400).send({ status: false, msg: "Invalid user" });
         
        req.authorIdToken = decodedToken.userId;
        next();
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
};


module.exports = {authorization}
