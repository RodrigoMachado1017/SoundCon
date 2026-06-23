const express = require("express");
const audioRoutes = require("./audio.routes");
const profileRoutes = require("./profile.routes");
const logRoutes = require("./log.routes");

const router = express.Router();

router.use("/audio", audioRoutes); // /audio/convert
router.use("/", profileRoutes); // /me
router.use("/", logRoutes); // /log

module.exports = router;
