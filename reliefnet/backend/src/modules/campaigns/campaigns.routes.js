const express = require('express');
const router = express.Router();

const controller = require('./campaigns.controller');
const { authenticate } = require('../../utils/authMiddleware');
const { requirePermission } = require('../../utils/permissionMiddleware');

router.post(
  '/',
  authenticate,
  requirePermission('campaign:create'),
  controller.createCampaign
);

router.patch(
  '/:id/activate',
  authenticate,
  requirePermission('campaign:activate'),
  controller.activateCampaign
);

module.exports = router;