const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const fsPromises = require("fs").promises;
const redisClient = require("../../model/redis");
const redisCli = redisClient.client.v4;
const db = require("../../model/mysql");
const QUERY_LIST = require("../../model/queries/userQueries");
const path = require("path");
const { error } = require("console");
const usersDB = {
    users: require("../../model/users.json"),
    setUsers: function (data) {
        this.users = data;
    },
};
// Database Testing funciton
const allUser = async (req, res) => {
    const userdata = await db.query("SELECT * FROM user");
    res.json(userdata);
};
const handleLogin = async (req, res) => {
    const { username, password } = req.query;
    if (!username || !password)
        return res.status(400).json({ message: `Username and password are required` });

    // get_DBdata

    const get_User = await db.execute(QUERY_LIST.GET_USER, username);
    console.log(get_User);
    if (!get_User) return res.sendStatus(401);

    // FIXME: Enhance code
    const match = await bcrypt.compare(password, get_User[0].password);
    if (match) {
        // jwt create
        const roles = await db.execute(QUERY_LIST.GET_ROLE, get_User[0].user_id);
        const accessToken = jwt.sign(
            {
                UserInfo: {
                    username: get_User[0].username,
                    roles: roles,
                },
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "120s",
            }
        );
        // Create if not exist RefreshToken in Database
        const refreshToken = jwt.sign(
            {
                username: get_User[0].username,
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "1d" }
        );
        //TODO: Use Redis
        // const currentUser = { ...foundUser, refreshToken: refreshToken };
        // usersDB.setUsers([...otherUsers, currentUser]);
        // await fsPromises.writeFile(
        //     path.join(__dirname, "..", "..", "model", "users.json"),
        //     JSON.stringify(usersDB.users)
        // );
        await redisCli.set(get_User[0].username, refreshToken);
        await redisCli.expire(get_User[0].username, 24 * 60 * 60);
        // refreshToken을 프론트 cookie에 전달하는 방식
        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
        });
        // 보내면 client에서 처리
        res.json({ accessToken });
    } else {
        res.sendStatus(401);
    }
};

module.exports = { allUser, handleLogin };
