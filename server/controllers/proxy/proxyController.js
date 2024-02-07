const childProcess = require("child_process");
const request = require("request");
const sharp = require("sharp");

const imageProxy = async (req, res) => {
    const imageUrl = req.query.url;

    try {
        const imageBuffer = await downloadImage(imageUrl);
        const optimizedBuffer = await optimizeImage(imageBuffer);
        const dataUrl = createShortDataUrl(optimizedBuffer);

        res.json({ dataUrl: dataUrl });
    } catch (error) {
        console.error("이미지 다운로드 및 변환 중 에러:", error);
        res.status(500).send("Internal Server Error");
    }
};
/**
 *
 * @param {String} imageUrl
 * @returns
 */
const downloadImage = async (imageUrl) => {
    return new Promise((resolve, reject) => {
        request.get({ url: imageUrl, encoding: null }, (err, response, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
};
/**
 *
 * @param {incoding_Buffer_data} imageBuffer
 * @returns
 */
const optimizeImage = async (imageBuffer) => {
    const metadata = await sharp(imageBuffer).metadata();
    let width = metadata.width;
    let height = metadata.height;

    let quality;
    if (width <= 200) {
        quality = 33;
    } else if (width <= 400) {
        quality = 20;
    } else if (width <= 600) {
        quality = 10;
    } else if (width <= 800) {
        quality = 5;
    } else {
        quality = 3;
    }

    return sharp(imageBuffer).webp({ quality: quality }).toBuffer();
};
/**
 *
 * @param {incoding_Buffer_data} imageBuffer
 * @returns
 */
const createShortDataUrl = (imageBuffer) => {
    const base64Image = imageBuffer.toString("base64");
    const contentType = "image/jpeg"; // 이미지 타입에 맞게 수정
    return `data:${contentType};base64,${base64Image}`;
};

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

module.exports = { imageProxy, startProxyServer };
