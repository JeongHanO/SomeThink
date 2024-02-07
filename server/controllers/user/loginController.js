const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const fsPromises = require("fs").promises;
const path = require("path");
const usersDB = {
    users: require("../../model/users.json"),
    setUsers: function (data) {
        this.users = data;
    },
};
const allUser = async (req, res) => {
    const users = usersDB.users;
    res.json(users);
};
const handleLogin = async (req, res) => {
    const { user, pwd } = req.query;
    console.log(user, pwd);
    console.log(req.headers.host);
    if (!user || !pwd)
        return res.status(400).json({ message: `Username and password are required` });
    const foundUser = usersDB.users.find((person) => person.username === user);
    if (!foundUser) return res.sendStatus(401);

    const match = await bcrypt.compare(pwd, foundUser.password);

    if (match) {
        // jwt create
        const accessToken = jwt.sign(
            { username: foundUser.username },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "30s",
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
        await fsPromises.writeFile(
            path.join(__dirname, "..", "..", "model", "users.json"),
            JSON.stringify(usersDB.users)
        );
        // refreshToken을 프론트 cookie에 전달하는 방식
        res.cookie("jwt", refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ accessToken });
    } else {
        res.sendStatus(401);
    }
};

module.exports = { allUser, handleLogin };
