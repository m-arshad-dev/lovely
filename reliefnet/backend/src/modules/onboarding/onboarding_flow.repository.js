const db = require("../../config/db");

// CREATE FLOW
async function createFlow(client, userRoleId, templateId) {
    const res = await client.query(
        `INSERT INTO onboarding_flows (user_role_id, template_id, status)
        VALUES ($1, $2, 'IN_PROGRESS')
         RETURNING *`,
        [userRoleId, templateId]
    );

    return res.rows[0];
}

// GET FLOW
async function getFlow(client ,flowId) {
    const res = await client.query(
        `SELECT f.*, t.requires_approval
         FROM onboarding_flows f
         JOIN onboarding_templates t ON t.id = f.template_id
         WHERE f.id = $1`,
        [flowId]
    );

    return res.rows[0];
}

// UPDATE CURRENT STEP
async function updateCurrentStep(client, flowId, stepId) {
const res = await client.query(
    `UPDATE onboarding_flows
        SET current_step_id = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING *`,
    [flowId, stepId]
);

return res.rows[0];
}

async function updateStatus(client, flowId, status) {
    const res = await client.query(
        `UPDATE onboarding_flows
            SET status = $2,
                updated_at = now()
            WHERE id = $1
            RETURNING *`,
        [flowId, status]
    );

    return res.rows[0];
}

module.exports = {
    createFlow,
    getFlow,
    updateCurrentStep
};