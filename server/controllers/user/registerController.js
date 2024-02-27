const usersDB = {
    users: require("../../model/users.json"),
    setUsers: function (data) {
        this.users = data;
    },
};

const fsPromises = require("fs").promises;
const path = require("path");
const bcrypt = require("bcrypt");
const DB = require("../../model/mysql");
const db = new DB();
const QUERY_LIST = require("../../model/queries/userQueries");
const getNewUser = async (req, res) => {
    console.log(usersDB.users);
    res.json(usersDB.users);
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
        await db.execute(QUERY_LIST.POST_ROLE);
        // Testing Extra Database
        await fsPromises.writeFile(
            path.join(__dirname, "..", "..", "model", "users.json"),
            JSON.stringify(usersDB.users)
        );
        res.status(201).json({ success: `New user ${username} created!` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getNewUser, handleNewUser };
