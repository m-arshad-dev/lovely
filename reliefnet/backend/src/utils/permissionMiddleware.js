const db = require('../config/db');

function requirePermission(permissionName) {
  return async (req, res, next) => {
    if (!req.user || !req.user.roles) return res.status(401).json({ error: 'Unauthorized' });

    const roleIds = (req.user.roles || [])
      .filter(r => r.is_active)
      .map(r => r.id);

    if (roleIds.length === 0) return res.status(403).json({ error: 'Forbidden' });

    const q = `SELECT 1 FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ANY($1::int[]) AND p.name = $2 LIMIT 1`;
    const result = await db.query(q, [roleIds, permissionName]);
    if (result.rows.length > 0) return next();

    return res.status(403).json({ error: 'Forbidden' });
  };
}

module.exports = { requirePermission };
