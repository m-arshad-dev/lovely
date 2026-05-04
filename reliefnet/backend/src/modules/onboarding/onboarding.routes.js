const express = require("express");
const router = express.Router();

const controller = require("./onboarding.controller");
const { authenticate } = require('../../utils/authMiddleware');
const { requirePermission } = require('../../utils/permissionMiddleware');

// create template (requires onboarding:manage)
router.post("/template", authenticate, requirePermission('onboarding:manage'), controller.createTemplate);

// add step (requires onboarding:manage)
router.post("/step", authenticate, requirePermission('onboarding:manage'), controller.addStep);

// get template with steps
router.get("/template/:id", controller.getTemplate);

// get default template for a role
router.get("/template/default/:roleId", controller.getDefaultTemplate);

module.exports = router;