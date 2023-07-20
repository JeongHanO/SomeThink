#!/usr/bin/env node

/**
 * @type {any}
 */

require("dotenv").config();
const WebSocket = require("ws");
const http = require("http");
const wss = new WebSocket.Server({ noServer: true });
const setupWSConnection = require("./utils.js").setupWSConnection;
const host = process.env.HOST || "localhost";
const port = process.env.PORT || 1234;
const server = http.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("okay");
});

const express = require("express");
const cors = require("cors"); // Add this line to import CORS
const generatorHandler = require("./generator"); // assuming generator.js is in the same directory
const app = express();

app.use(cors()); // And add this line to use CORS as middleware
app.use(express.json()); // for parsing application/json
wss.on("connection", setupWSConnection);

server.on("upgrade", (request, socket, head) => {
    // You may check auth of request here..
    // See https://github.com/websockets/ws#client-authentication
    /**
     * @param {any} ws
     */
    const handleAuth = (ws) => {
        wss.emit("connection", ws, request);
    };
    wss.handleUpgrade(request, socket, head, handleAuth);
});

server.listen(port, host, () => {
    console.log(`running at '${host}' on port ${port}`);
});

app.listen(5050, () => {
    console.log(`server started on port 5050`);
});

app.post("/api/generate", generatorHandler);
