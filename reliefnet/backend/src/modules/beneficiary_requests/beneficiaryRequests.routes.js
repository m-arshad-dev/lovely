const express = require('express');
const { authenticate } = require('../../utils/authMiddleware');
const controller = require('./beneficiaryRequests.controller');

const router = express.Router();

router.post('/', authenticate, controller.createRequest);
router.get('/my', authenticate, controller.myRequests);
router.patch('/:id/status', authenticate, controller.updateStatus);

module.exports = router;
