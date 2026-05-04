const db = require("../../config/db");

// CREATE TEMPLATE (aligned with DB)
async function createTemplate(client, data) {
    const {
        roleId,
        name,
        slug,
        requiresApproval = false,
        isDefault = true
    } = data;

    const res = await client.query(
        `INSERT INTO onboarding_templates
        (role_id, name, slug, requires_approval, is_default)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [roleId, name, slug, requiresApproval, isDefault]
    );

    return res.rows[0];
}


// ADD STEP (aligned with DB)
async function addStep(client, data) {
    const {
        templateId,
        stepKey,
        stepOrder,
        isRequired = true,
        inputSchema = {},
        config = {}
    } = data;

    const res = await client.query(
        `INSERT INTO onboarding_template_steps
        (template_id, step_key, step_order, is_required, input_schema, config)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [templateId, stepKey, stepOrder, isRequired, inputSchema, config]
    );

    return res.rows[0];
}


// GET TEMPLATE WITH STEPS (READ MODEL)
async function getTemplateWithSteps(client ,templateId) {
    const res = await client.query(
        `
        SELECT 
            t.*,
            COALESCE(
                json_agg(s ORDER BY s.step_order)
                FILTER (WHERE s.id IS NOT NULL),
                '[]'
            ) AS steps
        FROM onboarding_templates t
        LEFT JOIN onboarding_template_steps s
        ON t.id = s.template_id
        WHERE t.id = $1
        GROUP BY t.id
        `,
        [templateId]
    );

    return res.rows[0];
}

async function getDefaultTemplateByRole(client, roleId) {
    const res = await client.query(
        `
        SELECT 
            t.*, 
            COALESCE(
                json_agg(s ORDER BY s.step_order)
                FILTER (WHERE s.id IS NOT NULL),
                '[]'
            ) AS steps
        FROM onboarding_templates t
        LEFT JOIN onboarding_template_steps s
            ON t.id = s.template_id
        WHERE t.role_id = $1
          AND t.is_default = true
          AND t.is_active = true
        GROUP BY t.id
        `,
        [roleId]
    );

    return res.rows[0] || null;
}

module.exports = {
    createTemplate,
    addStep,
    getTemplateWithSteps,
    getDefaultTemplateByRole
};