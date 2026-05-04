const express = require("express");
const router = express.Router();

const userController = require("./user.controller");

// 🔐 auth middleware (YOU MUST HAVE THIS)
const { authenticate } = require("../../utils/authMiddleware");

// Create user (optional / admin use only)
router.post("/", userController.createUser);

// Get user by id (protected)
router.get("/:id", authenticate, userController.getUser);

// 🔥 Assign role (CRITICAL FLOW - MUST BE AUTHENTICATED)
router.post(
  "/assign-role",
  authenticate,
  userController.assignRole
);

module.exports = router;