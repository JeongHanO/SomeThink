const express = require("express");
require("dotenv").config();
const router = express.Router();
const loginController = require("../../../controllers/user/loginController");
const registerController = require("../../../controllers/user/registerController");
const refreshTokenController = require("../../../controllers/user/refreshTokenController");
router.get("/signin", (req, res) => {
    res.render("login");
});
router.get("/signup", (req, res) => {
    res.render("register");
});
router.post("/signup/register", registerController.handleNewUser);
router.get("/signin/login", loginController.handleLogin);
router.get("/signin/refreshToken", refreshTokenController.handleRefreshToken);
router.get("/signin/check", loginController.allUser);
router.get("/signin/userlist", loginController.allUser);

module.exports = router;
