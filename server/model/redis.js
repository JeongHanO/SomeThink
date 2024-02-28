const redis = require("redis");
require("dotenv").config();
const client = redis.createClient({
    host: process.env.REDIS_TEST_HOST || process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    legacyMode: true,
});
client.on("connect", () => {
    console.log("Success Conenect Redis");
});

client.on("error", () => {
    console.log("Error redis");
});
module.exports = {
    client,
};
