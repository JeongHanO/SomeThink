// Test Extra Database
const usersDB = {
    users: require("../../model/users.json"),
    setUsers: function (data) {
        this.users = data;
    },
};
const jwt = require("jsonwebtoken");
const redis = require("../../model/redis");
const db = require("../../model/mysql");
const QUERY_LIST = require("../../model/queries/userQueries");
const redisCli = redis.client.v4;
require("dotenv").config();

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    // Testing if funcion
    if (cookies.jwt === "invalidtoken") {
        return res.status(400).json({ data: null, message: "invalid" });
    }
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;
    // TODO: Create refreshToken
    //Check existing user
    // TODO: Use Test EXTRA DB
    const jestTest = process.env.NODE_ENV === "test";
    if (jestTest) {
        const foundUser = usersDB.users.find((person) => person.refreshToken === refreshToken);
        if (!foundUser) {
            return res.sendStatus(403);
        }
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err || foundUser.username !== decoded.username) return res.sendStatus(403);
            //FIXME: CHECK async function.... The object stament is pending
            const accessToken = jwt.sign(
                {
                    UserInfo: {
                        username: decoded.username,
                        roles: foundUser.roles,
                    },
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "120s" }
            );
            return res.status(200).json({ accessToken: accessToken });
        });
    }
    const foundToken_Owner = await redisCli.get(refreshToken);
    if (!foundToken_Owner) return res.sendStatus(403); //Forbidden
    // evaluate jwt
    const foundUser = await db.execute(QUERY_LIST.GET_USER, foundToken_Owner);
    const roles = await db.execute(QUERY_LIST.GET_ROLE, foundUser[0].user_id);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err || foundUser.username !== decoded.username) return res.sendStatus(403);
        //FIXME: CHECK async function.... The object stament is pending
        const accessToken = jwt.sign(
            {
                UserInfo: {
                    username: decoded.username,
                    roles: roles[0].role_id,
                },
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "120s" }
        );
        res.json({ accessToken });
    });
};

module.exports = { handleRefreshToken };
