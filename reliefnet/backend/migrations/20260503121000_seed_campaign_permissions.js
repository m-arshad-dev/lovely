exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO permissions (name) VALUES
      ('campaign:create'),
      ('campaign:activate')
    ON CONFLICT DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    JOIN permissions p ON p.name = 'campaign:create'
    WHERE r.name = 'ngo_admin'
    ON CONFLICT DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    JOIN permissions p ON p.name = 'campaign:activate'
    WHERE r.name = 'admin'
    ON CONFLICT DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM role_permissions
    WHERE permission_id IN (
      SELECT id FROM permissions WHERE name IN ('campaign:create', 'campaign:activate')
    );
  `);

  pgm.sql(`
    DELETE FROM permissions
    WHERE name IN ('campaign:create', 'campaign:activate');
  `);
};
