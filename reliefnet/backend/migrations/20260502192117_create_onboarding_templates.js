exports.up = (pgm) => {
  pgm.createTable('onboarding_templates', {
    id: {
      type: 'serial',
      primaryKey: true,
    },

    role_id: {
      type: 'integer',
      notNull: true,
      references: 'roles(id)',
      onDelete: 'CASCADE',
    },

    name: {
      type: 'varchar(100)',
      notNull: true,
    },

    // ✅ NEW FIELD (important addition)
    slug: {
      type: 'varchar(100)',
      notNull: true,
      unique: true,
    },

    version: {
      type: 'integer',
      default: 1,
    },

    is_default: {
      type: 'boolean',
      default: true,
    },

    requires_approval: {
      type: 'boolean',
      default: false,
    },

    is_active: {
      type: 'boolean',
      default: true,
    },

    created_at: {
      type: 'timestamp',
      default: pgm.func('now()'),
    },
  });

  // Unique per role + name + version
  pgm.addConstraint('onboarding_templates', 'unique_role_name_version', {
    unique: ['role_id', 'name', 'version'],
  });

  // Only one default template per role
  pgm.sql(`
    CREATE UNIQUE INDEX one_default_template_per_role
    ON onboarding_templates(role_id)
    WHERE is_default = TRUE;
  `);

  // =========================
  // SEED TEMPLATES (WITH SLUGS)
  // =========================
  pgm.sql(`
    INSERT INTO onboarding_templates
      (role_id, name, slug, version, is_default, requires_approval)
    VALUES

      ((SELECT id FROM roles WHERE name = 'donor'),
      'Donor Onboarding',
      'donor_onboarding',
      1, true, false),

      ((SELECT id FROM roles WHERE name = 'volunteer'),
      'Volunteer Onboarding',
      'volunteer_onboarding',
      1, true, false),

      ((SELECT id FROM roles WHERE name = 'beneficiary'),
      'Beneficiary Onboarding',
      'beneficiary_onboarding',
      1, true, false),

      ((SELECT id FROM roles WHERE name = 'ngo_admin'),
      'NGO Onboarding',
      'ngo_onboarding',
      1, true, true)

    ON CONFLICT (slug) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  // 1. remove seed data (optional but clean)
  pgm.sql(`
    DELETE FROM onboarding_templates
    WHERE slug IN (
      'donor_onboarding',
      'volunteer_onboarding',
      'beneficiary_onboarding',
      'ngo_onboarding'
    );
  `);

  // 2. drop index
  pgm.sql(`
    DROP INDEX IF EXISTS one_default_template_per_role;
  `);

  // 3. drop constraint
  pgm.dropConstraint(
    'onboarding_templates',
    'unique_role_name_version'
  );

  // 4. drop table
  pgm.dropTable('onboarding_templates');
};