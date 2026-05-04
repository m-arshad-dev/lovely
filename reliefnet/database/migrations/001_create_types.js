exports.up = (pgm) => {
pgm.createType('approval_entity', [
  'onboarding_flow',
  'ngo',
  'campaign',
], { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropType('approval_entity');
};