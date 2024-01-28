const express = require("express");
const router = express.Router();
const audioController = require("../../../controllers/audio/audioController");
router.post("/leavesession", audioController.leavesession);

router.post("/sessions", audioController.createsessions);

router.post("/sessions/:sessionId/connections", audioController.generatecheck);

router.get("/sessions/:sessionId/validate", audioController.findActivateSession);

module.exports = router;
