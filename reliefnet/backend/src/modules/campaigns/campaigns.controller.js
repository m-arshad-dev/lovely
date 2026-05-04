const service = require('./campaigns.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');

const createCampaign = asyncHandler(async (req, res) => {
  const result = await service.createCampaign(req.body, req.user);
  res.status(201).json(success('campaignCreated', result));
});

const activateCampaign = asyncHandler(async (req, res) => {
  const result = await service.activateCampaign(req.params.id);
  res.json(success('campaignActivated', result));
});

module.exports = {
  createCampaign,
  activateCampaign
};

