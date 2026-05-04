export const up = (pgm) => {
  pgm.createTable('user_roles', {
    id: {
      type: 'serial',
      primaryKey: true,
    },

    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },

    role_id: {
      type: 'integer',
      notNull: true,
      references: 'roles(id)',
      onDelete: 'CASCADE',
    },

    is_active: {
      type: 'boolean',
      default: false,
    },

    activated_at: {
      type: 'timestamp',
    },

    activated_by: {
      type: 'integer',
      references: 'users(id)',
      onDelete: 'SET NULL',
    },

    created_at: {
      type: 'timestamp',
      default: pgm.func('now()'),
    },
  });

  // Prevent duplicate role assignment per user
  pgm.addConstraint('user_roles', 'unique_user_role', {
    unique: ['user_id', 'role_id'],
  });
};

export const down = (pgm) => {
  pgm.dropTable('user_roles');
};