// campaigns.repository.js

const db = require('../../config/db');

async function createCampaign(client, data) {
  const {
    title,
    description,
    slug,
    created_by,
    user_role_id,
    donation_type,
    goal_amount,
    goal_quantity
  } = data;

  const res = await client.query(
    `INSERT INTO campaigns (
      title, description, slug,
      created_by, user_role_id,
      donation_type, goal_amount, goal_quantity
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      title,
      description,
      slug,
      created_by,
      user_role_id,
      donation_type,
      goal_amount,
      goal_quantity
    ]
  );

  return res.rows[0];
}

async function getCampaignById(client, id) {
  const res = await client.query(
    `SELECT * FROM campaigns WHERE id=$1 AND deleted_at IS NULL`,
    [id]
  );

  return res.rows[0];
}

async function updateStatus(client, id, status) {
  const res = await client.query(
    `UPDATE campaigns
     SET status=$1, updated_at=now()
     WHERE id=$2
     RETURNING *`,
    [status, id]
  );

  return res.rows[0];
}

module.exports = {
  createCampaign,
  getCampaignById,
  updateStatus
};

