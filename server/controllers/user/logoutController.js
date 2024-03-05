const usersDB = {
    users: require("../../model/users.json"),
    setUsers: function (data) {
        this.users = data;
    },
};
const fsPromises = require("fs").promises;
const path = require("path");
const redisClient = require("../../model/redis");
const redisCli = redisClient.client.v4;

const handleLogout = async (req, res) => {
    // On client, also delete the accessToken

    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); //No content
    const refreshToken = cookies.jwt;

    const jestTest = process.env.NODE_ENV === "test";
    if (jestTest) {
        const foundUser = usersDB.users.find((person) => person.refreshToken === refreshToken);
        if (!foundUser) {
            return res.sendStatus(400);
        }
        try {
            const otherUsers = usersDB.users.filter(
                (person) => person.refreshToken !== foundUser.refreshToken
            );
            const currentUser = { ...foundUser, refreshToken: "" };
            usersDB.setUsers([...otherUsers, currentUser]);
            await fsPromises.writeFile(
                path.join(__dirname, "..", "..", "model", "users.json"),
                JSON.stringify(usersDB.users)
            );
            return res.status(200).json({ message: "Success logout" });
        } catch (err) {
            return res.status(400).json({ message: "invalid" });
        }
    }
    // Test Extra Database
    // Is refreshToken in db?

    try {
        const foundUser = await redisCli.exist(refreshToken);
        if (!foundUser) {
            res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
            return res.sendStatus(204);
        }
        await redisCli.del(refreshToken);
        res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
        res.sendStatus(204);
    } catch (err) {
        console.log(err);
    }
};

module.exports = { handleLogout };
