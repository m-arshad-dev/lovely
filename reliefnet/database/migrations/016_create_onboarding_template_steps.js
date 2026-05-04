export const up = (pgm) => {
  pgm.createTable('onboarding_template_steps', {
    id: {
      type: 'serial',
      primaryKey: true,
    },

    template_id: {
      type: 'integer',
      notNull: true,
      references: 'onboarding_templates(id)',
      onDelete: 'CASCADE',
    },

    step_key: {
      type: 'varchar(100)',
      notNull: true,
    },

    step_order: {
      type: 'integer',
      notNull: true,
    },

    is_required: {
      type: 'boolean',
      default: true,
    },

    input_schema: {
      type: 'jsonb',
      default: '{}',
    },

    config: {
      type: 'jsonb',
      default: '{}',
    },

    created_at: {
      type: 'timestamp',
      default: pgm.func('now()'),
    },
  });

  // Only one step per order per template
  pgm.addConstraint('onboarding_template_steps', 'unique_template_step_order', {
    unique: ['template_id', 'step_order'],
  });

  // Optional: prevent duplicate step keys within same template
  pgm.addConstraint('onboarding_template_steps', 'unique_template_step_key', {
    unique: ['template_id', 'step_key'],
  });
};

export const down = (pgm) => {
  pgm.dropTable('onboarding_template_steps');
};