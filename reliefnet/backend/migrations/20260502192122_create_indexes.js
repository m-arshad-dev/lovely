exports.up = (pgm) => {

  pgm.createIndex('user_roles', 'user_id', {
    name: 'idx_user_roles_user_id'
  });

  pgm.createIndex('onboarding_flows', 'user_role_id', {
    name: 'idx_flows_user_role_id'
  });

  pgm.createIndex('onboarding_flows', 'status', {
    name: 'idx_flows_status'
  });

  // pgm.sql(`
  //   CREATE UNIQUE INDEX unique_active_flow
  //   ON onboarding_flows(user_role_id)
  //   WHERE status = 'IN_PROGRESS';
  // `);

  pgm.createIndex('onboarding_step_data', 'flow_id', {
    name: 'idx_step_data_flow_id'
  });




  pgm.sql(`
    CREATE INDEX idx_pending_approvals
    ON approvals(entity_type)
    WHERE status = 'PENDING';
  `);

  // 🔥 HIGH VALUE improvement
  pgm.sql(`
    CREATE INDEX idx_flow_user_status
    ON onboarding_flows(user_role_id, status);
  `);
};

exports.down = (pgm) => {

  pgm.dropIndex('user_roles', [], {
    name: 'idx_user_roles_user_id'
  });

  pgm.dropIndex('onboarding_flows', [], {
    name: 'idx_flows_user_role_id'
  });

  pgm.dropIndex('onboarding_flows', [], {
    name: 'idx_flows_status'
  });

  // pgm.sql(`DROP INDEX IF EXISTS unique_active_flow;`);

  pgm.dropIndex('onboarding_step_data', [], {
    name: 'idx_step_data_flow_id'
  });

  pgm.sql(`DROP INDEX IF EXISTS idx_pending_approvals;`);

  pgm.sql(`DROP INDEX IF EXISTS idx_flow_user_status;`);
};