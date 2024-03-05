const allowedOrigins = require("./allowedOrgin");

const corsOptions = {
    /**
     * @param {parsing url} origin
     * @param {callbackFunction}  callback
     */
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credential: true,
    optionsSuccessStatus: 200,
};

module.exports = corsOptions;
