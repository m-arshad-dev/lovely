exports.up = (pgm) => {
  pgm.dropConstraint('onboarding_flows', 'flows_status_check');
  pgm.addConstraint('onboarding_flows', 'flows_status_check', {
    check: "status IN ('IN_PROGRESS','COMPLETED','FAILED','PENDING_APPROVAL')",
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('onboarding_flows', 'flows_status_check');
  pgm.addConstraint('onboarding_flows', 'flows_status_check', {
    check: "status IN ('IN_PROGRESS','COMPLETED','FAILED')",
  });
};
