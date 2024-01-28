const allowedOrigins = require("../config/allowedOrgin");

const credentails = (req, res, next) => {
    const origin = req.header.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Credentails", true);
    }
    next();
};
module.exports = credentails;
