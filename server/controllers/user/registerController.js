const usersDB = {
    users: require("../../model/users.json"),
    setUsers: function (data) {
        this.users = data;
    },
};

const fsPromises = require("fs").promises;
const path = require("path");
const bcrypt = require("bcrypt");

const getNewUser = async (req, res) => {
    console.log(usersDB.users);
    res.json(usersDB.users);
};
const handleNewUser = async (req, res) => {
    const { user, pwd } = req.body;
    if (!user || !pwd) {
        return res.status(400).json({ message: `Username and password are required` });
    }
    const duplicate = usersDB.users.find((person) => person.username === user);
    if (duplicate) return res.sendStatus(409);

    //Test extra Database
    try {
        const hashedPwd = await bcrypt.hash(pwd, 10);
        //store the new user
        const newUser = { username: user, password: hashedPwd };
        usersDB.setUsers([...usersDB.users, newUser]);
        await fsPromises.writeFile(
            path.join(__dirname, "..", "..", "model", "users.json"),
            JSON.stringify(usersDB.users)
        );
        res.status(201).json({ success: `New user ${user} created!` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getNewUser, handleNewUser };
