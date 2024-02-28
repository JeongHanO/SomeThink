const usersDB = {
    users: require("../../model/users.json"),
    setUsers: function (data) {
        this.users = data;
    },
};

const fsPromises = require("fs").promises;
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../../model/mysql");
const QUERY_LIST = require("../../model/queries/userQueries");
const getNewUser = async (req, res) => {
    const user_data = await db.execute(QUERY_LIST.GET_USER, "test1");
    res.json(user_data);
};
const handleNewUser = async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: `Username and password are required` });
    }
    const get_user = await db.execute(QUERY_LIST.GET_USER, username);
    if (get_user.length > 0) return res.sendStatus(409);
    //Test extra Database
    try {
        const hashedPwd = await bcrypt.hash(password, 10);
        //store the new user
        const newUser = {
            username: username,
            roles: {
                User: 2,
            },
            password: hashedPwd,
            email: email,
        };
        usersDB.setUsers([...usersDB.users, newUser]);
        //email, password, created_at, username
        await db.execute(QUERY_LIST.POST_USER, [newUser.email, newUser.password, newUser.username]);
        // TODO: Add Role query

        res.status(201).json({ success: `New user ${username} created!` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getNewUser, handleNewUser };
