const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub };

    // attach roles (outside transaction)
    const rolesRes = await db.query(
      `SELECT r.*, ur.is_active, ur.id AS user_role_id
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [req.user.id]
    );
    req.user.roles = rolesRes.rows || [];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(roleName) {
  return (req, res, next) => {
    const roles = (req.user && req.user.roles) || [];
    if (roles.find(r=>r.name === roleName)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

module.exports = { authenticate, requireRole };
