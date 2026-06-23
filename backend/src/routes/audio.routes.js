const express = require("express");
const { upload } = require("../middlewares/upload.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const audioController = require("../controllers/audio.controller");

const router = express.Router();

router.get("/effects", audioController.effects);
router.post("/convert", requireAuth, upload.single("file"), audioController.convert);
router.post("/mix", requireAuth, upload.array("files"), audioController.mix);

module.exports = router;
