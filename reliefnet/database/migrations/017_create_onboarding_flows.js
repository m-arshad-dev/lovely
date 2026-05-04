export const up = (pgm) => {
  pgm.createTable('onboarding_flows', {
    id: {
      type: 'serial',
      primaryKey: true,
    },

    user_role_id: {
      type: 'integer',
      notNull: true,
      references: 'user_roles(id)',
      onDelete: 'CASCADE',
    },

    template_id: {
      type: 'integer',
      notNull: true,
      references: 'onboarding_templates(id)',
    },

    status: {
      type: 'varchar(30)',
      notNull: true,
      default: 'IN_PROGRESS',
    },

    current_step_id: {
      type: 'integer',
      references: 'onboarding_template_steps(id)',
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
  pgm.addConstraint('onboarding_flows', 'flows_status_check', {
    check: "status IN ('IN_PROGRESS','COMPLETED','FAILED')",
  });

  // Only one active flow per user role
  pgm.sql(`
    CREATE UNIQUE INDEX unique_active_flow
    ON onboarding_flows(user_role_id)
    WHERE status = 'IN_PROGRESS';
  `);
};

export const down = (pgm) => {
  pgm.dropTable('onboarding_flows');
};