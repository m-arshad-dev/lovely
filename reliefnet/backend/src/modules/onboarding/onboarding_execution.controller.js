const { success } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const service = require("./onboarding_execution.service");

// 🟢 Submit onboarding step (runtime execution)
const submitStep = asyncHandler(async (req, res) => {
  const flowId = req.body.flowId || req.params.flowId;
  const stepId = req.body.stepId || req.params.stepId;
  const data = req.body.data || {};

  const userId = req.user?.id;

  if (!flowId || !stepId) {
    throw new Error("flowId and stepId are required");
  }

  if (!userId) {
    throw new Error("Unauthorized user");
  }

  const result = await service.submitStep(
    flowId,
    stepId,
    data,
    userId
  );

  if (result.type === "validationFailed") {
    return res.status(400).json(success("stepValidationFailed", result));
  }

  res.json(success("stepSubmitted", result));
});

const getStepData = asyncHandler(async (req, res) => {
  const flowId = req.params.flowId;
  const stepId = req.params.stepId;
  const userId = req.user?.id;

  if (!flowId || !stepId) {
    throw new Error("flowId and stepId are required");
  }

  if (!userId) {
    throw new Error("Unauthorized user");
  }

  const result = await service.getStepData(flowId, stepId, userId);
  res.json(success("stepDataFetched", result));
});

module.exports = {
  submitStep,
  getStepData,
};