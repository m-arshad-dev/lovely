const db = require('../../config/db');

async function getPermissionsForRole(client, roleId) {
  const res = await client.query(
    `SELECT p.* FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1`,
    [roleId]
  );

  return res.rows;
}

async function getPermissionsForRoles(client, roleIds) {
  if (!roleIds || roleIds.length === 0) return [];
  const res = await client.query(
    `SELECT DISTINCT p.* FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = ANY($1::int[])`,
    [roleIds]
  );
  return res.rows;
}

module.exports = {
  getPermissionsForRole,
  getPermissionsForRoles,
};
