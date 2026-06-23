const express = require("express");
const logController = require("../controllers/log.controller");

const router = express.Router();

router.post("/log", logController.registerLog);

module.exports = router;
