exports.up = (pgm) => {
  pgm.createTable('campaigns', {
    id: {
      type: 'serial',
      primaryKey: true,
    },

    title: { type: 'text', notNull: true },
    description: { type: 'text' },
    slug: { type: 'text', unique: true },

    // RELATIONS
    created_by: {
      type: 'integer',
      references: 'users(id)',
      onDelete: 'SET NULL',
    },

    user_role_id: {
      type: 'integer',
      references: 'user_roles(id)',
      onDelete: 'SET NULL',
    },

    // BUSINESS
    donation_type: { type: 'varchar(20)' },
    goal_amount: { type: 'numeric' },
    goal_quantity: { type: 'numeric' },

    total_amount: { type: 'numeric', default: 0 },
    total_quantity: { type: 'numeric', default: 0 },
    donor_count: { type: 'integer', default: 0 },

    // STATUS
    status: { type: 'varchar(20)', default: 'DRAFT' },

    // SOFT DELETE
    deleted_at: { type: 'timestamp' },

    created_at: { type: 'timestamp', default: pgm.func('now()') },
    updated_at: { type: 'timestamp', default: pgm.func('now()') },
  });

  // Optional but recommended
  pgm.createIndex('campaigns', 'slug');
};

exports.down = (pgm) => {
  pgm.dropTable('campaigns');
};