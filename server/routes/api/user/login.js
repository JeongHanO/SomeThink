const express = require("express");
const router = express.Router();
const loginController = require("../../../controllers/user/loginController");
const registerController = require("../../../controllers/user/registerController");

router.get("/signin", (req, res) => {
    res.render("login");
});
router.get("/signup", (req, res) => {
    res.render("register");
});
router.post("/signup/register", registerController.handleNewUser);
router.get("/signin/login", loginController.handleLogin);
router.get("/signin/userlist", loginController.allUser);

module.exports = router;
