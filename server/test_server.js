const express = require("express");
const app = express();
const helmet = require("helmet");
const path = require("path");
const cors = require("cors"); // Add this line to import CORS
const corsOptions = require("./config/corsOptions.js");
const { logger } = require("./middleware/logEvent.js");
const errorHandler = require("./middleware/errorHandler.js");
const verifyJWT = require("./middleware/verifyJWT.js");
const credentails = require("./middleware/credentials.js");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
let server;
const http = require("http");
const { serve } = require("swagger-ui-express");
const SERVER_PORT = process.env.TEST_SERVER_PORT || 7070;
const host = "localhost";
// // Environment variable: PORT where the node server is listening

/* generate Client id */
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(logger);
// Off credentail and cors if you are testing in a view file
// app.use(credentails);
// app.use(cors(corsOptions));
// Allow application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// Allow application/json
app.use(bodyParser.json());
app.use(cookieParser());
app.use(helmet());
app.use(express.json()); // for parsing application/json
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", require("./routes/api/audio/audio.js"));
app.use("/user", require("./routes/api/user/login.js"));
// app.use(verifyJWT);
app.use(errorHandler);

server = http.createServer(app);
server.listen(SERVER_PORT, host, () => {
    console.log(`running at '${host}' on port ${SERVER_PORT}`);
});

module.exports = server;
