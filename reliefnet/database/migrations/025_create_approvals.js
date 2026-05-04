export const up = (pgm) => {
  pgm.createTable('approvals', {
    id: {
      type: 'serial',
      primaryKey: true,
    },

    entity_type: {
      type: 'approval_entity',
      notNull: true,
    },

    entity_id: {
      type: 'integer',
      notNull: true,
    },

    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'PENDING',
    },

    reviewed_by: {
      type: 'integer',
      references: 'users(id)',
      onDelete: 'SET NULL',
    },

    notes: {
      type: 'text',
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

  // Status constraint
  pgm.addConstraint('approvals', 'approvals_status_check', {
    check: "status IN ('PENDING','APPROVED','REJECTED')",
  });

  // Prevent duplicate approvals per entity
  pgm.sql(`
    CREATE UNIQUE INDEX unique_approval_per_entity
    ON approvals(entity_type, entity_id);
  `);

  // Indexes for performance
  pgm.sql(`
    CREATE INDEX idx_approvals_entity
    ON approvals(entity_type, entity_id);

    CREATE INDEX idx_approvals_status
    ON approvals(status);
  `);
};

export const down = (pgm) => {
  pgm.dropTable('approvals');
};