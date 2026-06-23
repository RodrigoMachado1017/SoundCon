const express = require("express");
const { requireAuth } = require("../middlewares/auth.middleware");
const profileController = require("../controllers/profile.controller");

const router = express.Router();

router.get("/me", requireAuth, profileController.getMe);
router.put("/me", requireAuth, profileController.updateMe);

module.exports = router;
