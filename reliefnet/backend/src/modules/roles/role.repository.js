async function getRoleById(client, id) {
    const res = await client.query(
        `SELECT * FROM roles WHERE id = $1`,
        [id]
    );

    return res.rows[0];
}

async function getAllRoles(client) {
    const res = await client.query(
        `SELECT * FROM roles`,
    );

    return res.rows;
}

module.exports = {
    getAllRoles,
    getRoleById
};