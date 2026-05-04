async function createRequest(client, data) {
  const { userId, requestType, description, urgencyLevel, latitude, longitude, campaignId } = data;
  const result = await client.query(
    `INSERT INTO beneficiary_requests
      (beneficiary_user_id, request_type, description, urgency_level, latitude, longitude, campaign_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [userId, requestType, description, urgencyLevel, latitude, longitude, campaignId || null]
  );
  return result.rows[0];
}

async function addStatusLog(client, data) {
  const { requestId, previousStatus, newStatus, changedByUserId, notes } = data;
  await client.query(
    `INSERT INTO beneficiary_request_status_logs
      (beneficiary_request_id, previous_status, new_status, changed_by_user_id, notes)
     VALUES ($1,$2,$3,$4,$5)`,
    [requestId, previousStatus || null, newStatus, changedByUserId, notes || null]
  );
}

async function listByUser(client, userId) {
  const result = await client.query(
    `SELECT * FROM beneficiary_requests WHERE beneficiary_user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getById(client, id) {
  const result = await client.query(`SELECT * FROM beneficiary_requests WHERE id = $1`, [id]);
  return result.rows[0];
}

async function updateStatus(client, id, status) {
  const result = await client.query(
    `UPDATE beneficiary_requests SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0];
}

module.exports = { createRequest, addStatusLog, listByUser, getById, updateStatus };
