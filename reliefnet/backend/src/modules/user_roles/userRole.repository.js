async function assignRole(client, userId, roleId) {

    const check = await client.query(
        `SELECT 1 FROM user_roles
         WHERE user_id = $1 AND role_id = $2`,
        [userId, roleId]
    );

    if (check.rows.length > 0) {
        throw new Error("Role already assigned");
    }

    const res = await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, roleId]
    );

    return res.rows[0];
}

async function getUserRoles(client, userId) {
    const res = await client.query(
        `SELECT r.*, ur.is_active, ur.id AS user_role_id
         FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = $1`,
        [userId]
    );

    return res.rows;
}

async function getUserRoleById(client, userRoleId) {
    const res = await client.query(
        `SELECT * FROM user_roles WHERE id = $1`,
        [userRoleId]
    );

    return res.rows[0];
}

async function activateRole(client, userRoleId) {
    await client.query(
        `UPDATE user_roles
         SET is_active = true,
             activated_at = now()
         WHERE id = $1`,
        [userRoleId]
    );
}

module.exports = {
    assignRole,
    getUserRoles,
    getUserRoleById,
    activateRole
};