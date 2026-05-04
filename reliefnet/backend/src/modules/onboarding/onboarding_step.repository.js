const db = require("../../config/db");

// CREATE OR UPDATE STEP DATA
async function upsertStepData(client, flowId, stepId, data) {
    const res = await client.query(
        `
        INSERT INTO onboarding_step_data (flow_id, step_id, data, status)
        VALUES ($1, $2, $3, 'SUBMITTED')
        ON CONFLICT (flow_id, step_id)
        DO UPDATE SET 
            data = EXCLUDED.data,
            status = 'SUBMITTED',
            updated_at = now()
        RETURNING *;
        `,
        [flowId, stepId, data]
    );

    return res.rows[0];
}

// GET NEXT STEP
async function getNextStep(client, templateId, currentStepOrder) {
    const res = await client.query(
        `
        SELECT * FROM onboarding_template_steps
        WHERE template_id = $1
        AND step_order > $2
        ORDER BY step_order ASC
        LIMIT 1
        `,
        [templateId, currentStepOrder]
    );

    return res.rows[0];
}

async function getPreviousStep(client, templateId, currentStepOrder) {
    const res = await client.query(
        `
        SELECT *
        FROM onboarding_template_steps
        WHERE template_id = $1
        AND step_order < $2
        ORDER BY step_order DESC
        LIMIT 1
        `,
        [templateId, currentStepOrder]
    );

    return res.rows[0];
}

async function moveToPreviousStep(client, flowId, prevStepId) {
    const res = await client.query(
        `
        UPDATE onboarding_flows
        SET current_step_id = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [flowId, prevStepId]
    );

    return res.rows[0];
}



// GET STEP BY ID
async function getStepById(client, stepId) {
    const res = await client.query(
        `SELECT * FROM onboarding_template_steps WHERE id = $1`,
        [stepId]
    );

    return res.rows[0];
}

async function getCurrentStep(client, flowId) {
    const res = await client.query(
        `
        SELECT s.*
        FROM onboarding_flows f
        JOIN onboarding_template_steps s
            ON s.id = f.current_step_id
        WHERE f.id = $1
        `,
        [flowId]
    );

    return res.rows[0];
}
async function completeFlow(client, flowId) {
    const res = await client.query(
        `
        UPDATE onboarding_flows
        SET status = 'COMPLETED',
            updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [flowId]
    );

    return res.rows[0];
}
// GET STEP DATA
async function getStepData(client, flowId, stepId) {
    const res = await client.query(
        `SELECT * FROM onboarding_step_data
         WHERE flow_id = $1 AND step_id = $2`,
        [flowId, stepId]
    );

    return res.rows[0];
}




module.exports = {
    upsertStepData,
    getNextStep,
    getPreviousStep,
    moveToPreviousStep,
    getStepById,
    getCurrentStep,
    completeFlow,
    getStepData
};