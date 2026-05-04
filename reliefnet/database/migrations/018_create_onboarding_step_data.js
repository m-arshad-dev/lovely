export const up = (pgm) => {
  pgm.createTable('onboarding_step_data', {
    id: {
      type: 'serial',
      primaryKey: true,
    },

    flow_id: {
      type: 'integer',
      notNull: true,
      references: 'onboarding_flows(id)',
      onDelete: 'CASCADE',
    },

    step_id: {
      type: 'integer',
      notNull: true,
      references: 'onboarding_template_steps(id)',
      onDelete: 'CASCADE',
    },

    data: {
      type: 'jsonb',
      notNull: true,
    },

    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'NOT_STARTED',
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

  // Each step can only have one record per flow
  pgm.addConstraint('onboarding_step_data', 'unique_flow_step', {
    unique: ['flow_id', 'step_id'],
  });

  // Status validation
  pgm.addConstraint('onboarding_step_data', 'step_data_status_check', {
    check: "status IN ('NOT_STARTED','IN_PROGRESS','SUBMITTED','APPROVED','REJECTED')",
  });
};

export const down = (pgm) => {
  pgm.dropTable('onboarding_step_data');
};