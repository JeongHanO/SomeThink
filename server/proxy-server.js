const express = require("express");
const cors = require("cors");
const proxyController = require("./controllers/proxy/proxyController");

const app = express();
const PORT = 3030;

app.use(
    cors({
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    })
);

app.get("/api/proxyImage", proxyController.imageProxy);

app.listen(PORT, () => {
    console.log(`프록시 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
