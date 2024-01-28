const handleLogin = async (req, res) => {
    //on clinet, also delete the accessToken

    const cookies = req.cookies;

    if (!cookies?.jwt) return res.sendStatus(204);

    const refreshToken = cookies.jwt;
    // Database part
    const foundUser = usersDB.users.find((person) => person.refreshToken === refreshToken);

    if (!foundUser) {
        res.clearCookie("jwt", { httpOnly: true });
        return res.sendStatus(204);
    }

    //Delete refreshToken in db
    //test by extract Database
    const otherUsers = usersDB.users.filter(
        (person) => person.refreshToken !== foundUser.refreshToken
    );
    const currentUser = { ...foundUser, refreshToken: "" };
    usersDB.setUsers([...otherUsers, currentUser]);
    await fsPromises.writeFile(
        path.join(__dirname, "..", "..", "model", "users.json"),
        JSON.stringify(usersDB.users)
    );
    res.clearCookie("jwt", { httpOnly: true }); // secure : true only serves on https
    res.sendStatus(204);
};

module.exports = { handleLogin };
