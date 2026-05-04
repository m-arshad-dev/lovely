const { withTransaction } = require("../../config/transaction");
const repo = require("./onboarding.repository");
const roleRepo = require("../roles/role.repository");

async function createTemplate(data) {
    return withTransaction(async (client) => {

        const { roleId, role_id, name, slug } = data;
        const normalizedRoleId = roleId || role_id;

        if (!normalizedRoleId || !name || !slug) {
            throw new Error("roleId, name, slug are required");
        }

        const role = await roleRepo.getRoleById(client, normalizedRoleId);
        if (!role) throw new Error("Role does not exist");

        return repo.createTemplate(client, {
            ...data,
            roleId: normalizedRoleId,
        });
    });
}

async function addStep(data) {
    return withTransaction(async (client) => {

        const {
            templateId,
            template_id,
            stepKey,
            step_key,
            stepOrder,
            step_order,
        } = data;
        const normalizedTemplateId = templateId || template_id;
        const normalizedStepKey = stepKey || step_key;
        const normalizedStepOrder = stepOrder !== undefined ? stepOrder : step_order;

        if (!normalizedTemplateId || !normalizedStepKey || normalizedStepOrder === undefined) {
            throw new Error("templateId, stepKey, stepOrder are required");
        }
        const existing = await client.query(
        `SELECT 1 FROM onboarding_template_steps
        WHERE template_id = $1 AND step_order = $2`,
        [normalizedTemplateId, normalizedStepOrder]
        );

        if (existing.rows.length > 0) {
            throw new Error("stepOrder already exists for this template");
        }

        return repo.addStep(client, {
            ...data,
            templateId: normalizedTemplateId,
            stepKey: normalizedStepKey,
            stepOrder: normalizedStepOrder,
        });
    });
}

async function getTemplate(templateId) {
    return withTransaction(async (client) =>{
    const result = await repo.getTemplateWithSteps(client ,templateId);

    // 🔒 ensure safe response shape
    if (!result) return null;

    return {
        ...result,
        steps: result.steps || []
    };
    })
}

async function getDefaultTemplate(roleId) {
    return withTransaction(async (client) => {
        const result = await repo.getDefaultTemplateByRole(client, roleId);
        if (!result) return null;

        return {
            ...result,
            steps: result.steps || []
        };
    });
}

module.exports = {
    createTemplate,
    addStep,
    getTemplate,
    getDefaultTemplate
};