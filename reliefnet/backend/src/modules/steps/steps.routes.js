const express = require('express');
const router = express.Router();
const { authenticate } = require('../../utils/authMiddleware');
const controller = require('./steps.controller');

router.get('/:id', authenticate, controller.getStepById);

module.exports = router;
