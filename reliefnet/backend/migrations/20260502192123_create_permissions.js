exports.up = (pgm) => {
  pgm.createTable('permissions', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(100)', notNull: true, unique: true }
  });

  pgm.createTable('role_permissions', {
    role_id: { type: 'integer', notNull: true, references: 'roles', onDelete: 'cascade' },
    permission_id: { type: 'integer', notNull: true, references: 'permissions', onDelete: 'cascade' }
  });

  pgm.addConstraint('role_permissions', 'role_perm_unique', {
    unique: ['role_id', 'permission_id']
  });

  pgm.sql(`
    INSERT INTO permissions (name) VALUES
      ('onboarding:read'),
      ('onboarding:manage'),
      ('users:manage'),
      ('roles:manage')
    ON CONFLICT DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('role_permissions');
  pgm.dropTable('permissions');
};
