const childProcess = require("child_process");
const startProxyServer = () => {
    const proxyServer = childProcess.spawn("node", ["proxy-server.js"]);

    /**
     * @param {any} data
     */
    proxyServer.stdout.on("data", (data) => {
        console.log(`프록시 서버: ${data}`);
    });

    /**
     * @param {any} data
     */
    proxyServer.stderr.on("data", (data) => {
        console.error(`프록시 서버 에러: ${data}`);
    });

    /**
     * @param {termiate code} code
     */
    proxyServer.on("close", (code) => {
        console.log(`프록시 서버 종료. 종료 코드: ${code}`);
    });
};

module.exports = startProxyServer;
