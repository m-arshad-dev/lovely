const express = require("express");
const router = express.Router();

const controller = require("./session.controller");
const { authenticate } = require("../../utils/authMiddleware");

// 🔐 Single source of truth endpoint
router.get("/", authenticate, controller.getSession);

module.exports = router;