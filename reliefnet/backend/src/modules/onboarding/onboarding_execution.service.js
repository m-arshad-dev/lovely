const { withTransaction } = require("../../config/transaction");
const { validate } = require("../../utils/schemaValidator");

const flowRepo = require("./onboarding_flow.repository");
const stepRepo = require("./onboarding_step.repository");
const templateRepo = require("./onboarding.repository");
const userRoleRepo = require("../user_roles/userRole.repository");

async function submitStep(flowId, stepId, data, userId) {
  flowId = Number(flowId);
  stepId = Number(stepId);

  if (isNaN(flowId) || isNaN(stepId)) {
    throw new Error("Invalid flowId or stepId");
  }

  return withTransaction(async (client) => {
    const flow = await flowRepo.getFlow(client, flowId);
    if (!flow) throw new Error("Flow not found");

    const userRole = await userRoleRepo.getUserRoleById(
      client,
      flow.user_role_id
    );

    if (!userRole || userRole.user_id !== userId) {
      throw new Error("Forbidden");
    }

    const currentStep = await stepRepo.getCurrentStep(client, flowId);
    if (!currentStep) throw new Error("Step not found");

    if (currentStep.id !== stepId) {
      throw new Error("Invalid step");
    }

    const errors = validate(currentStep.input_schema || {}, data);
    if (errors) {
      return {
        type: "validationFailed",
        errors,
      };
    }

    await stepRepo.upsertStepData(client, flowId, stepId, data);

    const nextStep = await stepRepo.getNextStep(
      client,
      flow.template_id,
      currentStep.step_order
    );

    if (nextStep) {
      await flowRepo.updateCurrentStep(client, flowId, nextStep.id);

      return {
        type: "nextStep",
        nextStep,
        schema: nextStep.input_schema || {},
      };
    }

    const template = await templateRepo.getTemplateWithSteps(client, flow.template_id);
    if (!template) throw new Error("Template not found");

    if (template.requires_approval) {
      await flowRepo.updateStatus(client, flowId, "PENDING_APPROVAL");
      return {
        type: "pendingApproval",
        message: "Waiting for admin approval",
      };
    }

    await flowRepo.updateStatus(client, flowId, "COMPLETED");
    await userRoleRepo.activateRole(client, flow.user_role_id);

    return {
      type: "completed",
      message: "Flow completed",
    };
  });
}

async function getStepData(flowId, stepId, userId) {
  flowId = Number(flowId);
  stepId = Number(stepId);

  if (isNaN(flowId) || isNaN(stepId)) {
    throw new Error("Invalid flowId or stepId");
  }

  return withTransaction(async (client) => {
    const flow = await flowRepo.getFlow(client, flowId);
    if (!flow) throw new Error("Flow not found");

    const userRole = await userRoleRepo.getUserRoleById(
      client,
      flow.user_role_id
    );

    if (!userRole || userRole.user_id !== userId) {
      throw new Error("Forbidden");
    }

    const stepData = await stepRepo.getStepData(client, flowId, stepId);

    if (!stepData) {
      return {
        data: {},
        status: "NOT_STARTED",
      };
    }

    return {
      data: stepData.data,
      status: stepData.status,
    };
  });
}

module.exports = {
  submitStep,
  getStepData,
};