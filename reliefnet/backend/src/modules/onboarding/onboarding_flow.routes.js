const express = require("express");
const router = express.Router();
const { authenticate } = require('../../utils/authMiddleware');

const controller = require("./onboarding_flow.controller");

// start onboarding flow
router.post("/start", authenticate, controller.startFlow);

// get flow
router.get("/:id", authenticate, controller.getFlow);

module.exports = router;