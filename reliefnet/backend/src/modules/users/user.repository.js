const db = require("../../config/db");

async function createUser(client, name, email, passwordHash) {
    const res = await client.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, email, passwordHash]
    );

    return res.rows[0];
}

async function getUserById(client, id) {
    const res = await client.query(
        `SELECT * FROM users WHERE id = $1`,
        [id]
    );

    return res.rows[0];
}

// OUTSIDE TRANSACTION SAFE READ
async function getUserByIdSafe(id) {
    const res = await db.query(
        `SELECT * FROM users WHERE id = $1`,
        [id]
    );

    return res.rows[0];
}

async function getUserByEmail(client, email) {
    const res = await client.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );

    return res.rows[0];
}

module.exports = {
    createUser,
    getUserById,
    getUserByEmail,
    getUserByIdSafe
};