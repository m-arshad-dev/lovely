const express = require("express");
const router = express.Router();

const roleController = require("./role.controller");

// GET all roles
router.get("/", roleController.getRoles);

// GET role by id
router.get("/:id", roleController.getRole);

module.exports = router;