const express = require("express");
const router = express.Router();

const { authenticate } = require("../../utils/authMiddleware");
const controller = require("./onboarding_execution.controller");

// 🟢 Submit onboarding step (runtime execution)
router.post("/submit", authenticate, controller.submitStep);
router.post("/:flowId/steps/:stepId/submit", authenticate, controller.submitStep);
router.get("/:flowId/steps/:stepId", authenticate, controller.getStepData);

// (optional future expansion)
// router.get("/progress/:flowId", authenticate, controller.getProgress);
// router.get("/current-step/:flowId", authenticate, controller.getCurrentStep);

module.exports = router;