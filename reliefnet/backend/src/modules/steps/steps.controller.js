const { success } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const db = require('../../config/db');
const stepRepo = require('../onboarding/onboarding_step.repository');

const getStepById = asyncHandler(async (req, res) => {
  const stepId = Number(req.params.id);

  if (Number.isNaN(stepId)) {
    throw new Error('Invalid step id');
  }

  const step = await stepRepo.getStepById(db, stepId);

  if (!step) {
    throw new Error('Step not found');
  }

  res.json(success('stepFetched', step));
});

module.exports = {
  getStepById,
};
