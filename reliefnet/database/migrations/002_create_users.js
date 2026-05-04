exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'serial',
      primaryKey: true,
    },

    name: {
      type: 'varchar(150)',
      notNull: true,
    },

    email: {
      type: 'varchar(150)',
      notNull: true,
      unique: true,
    },

    password_hash: {
      type: 'text',
      notNull: true,
    },

    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'ACTIVE',
    },

    email_verified: {
      type: 'boolean',
      default: false,
    },

    failed_login_attempts: {
      type: 'integer',
      default: 0,
    },

    is_blocked: {
      type: 'boolean',
      default: false,
    },

    locked_until: {
      type: 'timestamp',
    },

    last_login: {
      type: 'timestamp',
    },

    deleted_at: {
      type: 'timestamp',
    },

    created_at: {
      type: 'timestamp',
      default: pgm.func('now()'),
    },

    updated_at: {
      type: 'timestamp',
      default: pgm.func('now()'),
    },
  });

  // CHECK constraint (exact match of your SQL)
pgm.addConstraint('users', 'users_status_check', {
  check: "status IN ('ACTIVE','SUSPENDED')",
});
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};