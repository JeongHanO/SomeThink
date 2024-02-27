const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const fsPromises = require("fs").promises;
const DB = require("../../model/mysql");
const db = new DB();
const path = require("path");
const usersDB = {
    users: require("../../model/users.json"),
    setUsers: function (data) {
        this.users = data;
    },
};
const allUser = async (req, res) => {
    const userdata = await db.query("SELECT * FROM user");
    console.log(userdata);
    res.json(userdata);
};
const handleLogin = async (req, res) => {
    console.log(req.query);
    const { username, password } = req.query;
    console.log(username, password);
    if (!username || !password)
        return res.status(400).json({ message: `Username and password are required` });

    // get_DBdata
    // if the database query was executed, close the connection
    const userdata = await db.query("SELECT * FROM user");
    const foundUser = userdata.find((person) => person.username === username);
    if (!foundUser) return res.sendStatus(401);

    const match = await bcrypt.compare(password, foundUser.password);

    if (match) {
        // jwt create
        const accessToken = jwt.sign(
            {
                UserInfo: {
                    username: foundUser.username,
                    roles: roles,
                },
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "120s",
            }
        );
        const refreshToken = jwt.sign(
            {
                username: foundUser.username,
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "1d" }
        );
        const otehrUsers = usersDB.users.filter((person) => person.username !== foundUser.username);
        const currentUser = { ...foundUser, refreshToken };
        usersDB.setUsers([...otehrUsers, currentUser]);
        // Insert refreshtoken data;
        // Replace existing Database with RDS Database
        await fsPromises.writeFile(
            path.join(__dirname, "..", "..", "model", "users.json"),
            JSON.stringify(usersDB.users)
        );
        // refreshToken을 프론트 cookie에 전달하는 방식
        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.json({ accessToken });
    } else {
        res.sendStatus(401);
    }
};

module.exports = { allUser, handleLogin };
