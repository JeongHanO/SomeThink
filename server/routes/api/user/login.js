const express = require("express");
const router = express.Router();
const loginController = require("../../../controllers/user/loginController");

router.get("/", loginController.handleLogout);

module.exports = router;
