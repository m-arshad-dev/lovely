export const up = (pgm) => {

  // =========================
  // USER ROLES
  // =========================
  pgm.createIndex('user_roles', 'user_id');

  // =========================
  // ONBOARDING FLOWS
  // =========================
  pgm.createIndex('onboarding_flows', 'user_role_id');
  pgm.createIndex('onboarding_flows', 'status');

  // Only ONE active flow per user role
  pgm.sql(`
    CREATE UNIQUE INDEX unique_active_flow
    ON onboarding_flows(user_role_id)
    WHERE status = 'IN_PROGRESS';
  `);

  // =========================
  // STEP DATA
  // =========================
  pgm.createIndex('onboarding_step_data', 'flow_id');

  // =========================
  // APPROVALS
  // =========================
  pgm.createIndex('approvals', 'status');

  pgm.sql(`
    CREATE UNIQUE INDEX unique_approval_per_entity
    ON approvals(entity_type, entity_id);
  `);

  // 🔥 HIGH VALUE PARTIAL INDEX (important)
  pgm.sql(`
    CREATE INDEX idx_pending_approvals
    ON approvals(entity_type)
    WHERE status = 'PENDING';
  `);
};

export const down = (pgm) => {

  pgm.dropIndex('user_roles', ['user_id']);

  pgm.dropIndex('onboarding_flows', ['user_role_id']);
  pgm.dropIndex('onboarding_flows', ['status']);

  pgm.sql(`DROP INDEX IF EXISTS unique_active_flow;`);

  pgm.dropIndex('onboarding_step_data', ['flow_id']);

  pgm.dropIndex('approvals', ['status']);

  pgm.sql(`DROP INDEX IF EXISTS unique_approval_per_entity;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_pending_approvals;`);
};