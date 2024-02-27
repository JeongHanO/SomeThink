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
const proxy_server = require("./controllers/proxy/proxyController.js").startProxyServer;
require("dotenv").config(!!process.env.CONFIG ? { path: process.env.CONFIG } : {});
const WebSocket = require("ws");
const http = require("http");
const server = http.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("okay");
});
const wss = new WebSocket.Server({ noServer: true });
const setupWSConnection =
    require("./controllers/CRDT/sharedataSyncContorller.js").ServersetupWSConnection;
const host = process.env.HOST || "localhost";
const SYNCPORT = process.env.PORT || 1234;
const audio_server = http.createServer(app);
// // Environment variable: PORT where the node server is listening
let SERVER_PORT = process.env.SERVER_PORT || 5050;
// // Environment variable: URL where our OpenVidu server is listening
let OPENVIDU_URL = process.env.OPENVIDU_URL || "http://localhost:4443";
// // Environment variable: secret shared with our OpenVidu server
let OPENVIDU_SECRET = process.env.OPENVIDU_SECRET;

/* generate Client id */
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(logger);
// off credentail and cors if you are testing in a view file
app.use(credentails);
app.use(cors(corsOptions));
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
app.use(verifyJWT);
app.use(errorHandler);

wss.on("connection", setupWSConnection);
server.on("upgrade", (request, socket, head) => {
    // You may check auth of request here..
    /**
     * @param {any} ws
     */
    const handleAuth = (ws) => {
        wss.emit("connection", ws, request);
    };
    wss.handleUpgrade(request, socket, head, handleAuth);
});

// timer port
server.listen(SYNCPORT, host, () => {
    console.log(`running at '${host}' on port ${SYNCPORT}`);
});
// // Serve application
audio_server.listen(SERVER_PORT, () => {
    console.log("Application started on port: ", SERVER_PORT);
    console.warn("Application server connecting to OpenVidu at " + OPENVIDU_URL);
    proxy_server();
});

process.on("uncaughtException", (err) => console.error(err));
