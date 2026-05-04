const { withTransaction } = require("../../config/transaction");

const flowRepo = require("./onboarding_flow.repository");
const templateRepo = require("./onboarding.repository");

// CREATE FLOW
const userRoleRepo = require('../user_roles/userRole.repository');

async function startFlow(userId, userRoleId, templateId) {
    return withTransaction(async client => {
        const userRole = await userRoleRepo.getUserRoleById(client, userRoleId);
        if (!userRole) throw new Error('User role not found');
        if (userRole.user_id !== userId) throw new Error('Forbidden');
        if (userRole.is_active) throw new Error('Role is already active');

        const template = templateId
            ? await templateRepo.getTemplateWithSteps(client, templateId)
            : await templateRepo.getDefaultTemplateByRole(client, userRole.role_id || userRole.roleId);

        if (!template) throw new Error("Template not found");

        const firstStep = template.steps?.[0];
        if (!firstStep) {
            throw new Error("Template has no steps");
        }

        const flow = await flowRepo.createFlow(client, userRoleId, template.id);
        const updatedFlow = await flowRepo.updateCurrentStep(client, flow.id, firstStep.id);

        return {
            flow: {
                ...updatedFlow,
                requires_approval: template.requires_approval || false,
            },
            currentStep: firstStep,
        };
    });
}

// GET FLOW DETAIL
async function getFlow(userId, flowId) {
    return await withTransaction(async client => {
        const flow = await flowRepo.getFlow(client, flowId);
        if (!flow) throw new Error('Flow not found');

        const userRole = await userRoleRepo.getUserRoleById(client, flow.user_role_id);
        if (!userRole || userRole.user_id !== userId) {
            throw new Error('Forbidden');
        }

        return flow;
    });
}
module.exports = {
    startFlow,
    getFlow
};