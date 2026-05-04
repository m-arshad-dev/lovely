exports.up = (pgm) => {
  pgm.createTable('roles', {
    id: {
      type: 'serial',
      primaryKey: true,
    },

    name: {
      type: 'varchar(50)',
      notNull: true,
      unique: true,
    },
  });
  pgm.sql(`
    INSERT INTO roles (name)
    VALUES
    ('donor'),
    ('volunteer'),
    ('beneficiary'),
    ('ngo_admin'),
    ('admin'),
    ('super_admin')
    ON CONFLICT DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('roles');
};