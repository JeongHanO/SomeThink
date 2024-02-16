let OPENVIDU_URL = process.env.OPENVIDU_URL || "http://localhost:4443";
// // Environment variable: secret shared with our OpenVidu server
let OPENVIDU_SECRET = process.env.OPENVIDU_SECRET;
const OpenVidu = require("openvidu-node-client").OpenVidu;
const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

const leavesession = (req, res) => {
    const { roomNum } = req.body;
    return res.status(201).json({ wsinfo: roomNum });
};

const createsessions = async (req, res) => {
    var session = await openvidu.createSession(req.body);
    res.send(session.sessionId);
};

const generatecheck = async (req, res) => {
    var session = openvidu.activeSessions.find((s) => s.sessionId === req.params.sessionId);
    if (!session) {
        res.status(404).send();
    } else {
        var connection = await session.createConnection(req.body);
        console.log("connection", connection);
        res.send(connection.token);
    }
};

const findActivateSession = (req, res) => {
    const sessionId = req.params.sessionId;
    const sessionExists = openvidu.activeSessions.find((s) => s.sessionId === sessionId);
    if (sessionExists) {
        res.send(true);
    } else {
        res.send(false);
    }
};

module.exports = {
    leavesession,
    createsessions,
    generatecheck,
    findActivateSession,
};
