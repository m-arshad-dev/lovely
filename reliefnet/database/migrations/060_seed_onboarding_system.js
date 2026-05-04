export const up = (pgm) => {

  // =========================
  // 1. ONBOARDING TEMPLATES
  // =========================
  pgm.sql(`
    INSERT INTO onboarding_templates
      (role_id, name, slug, version, is_default, requires_approval, is_active)
    VALUES
      ((SELECT id FROM roles WHERE name = 'donor'),
       'Donor Onboarding', 'donor_onboarding', 1, true, false, true),

      ((SELECT id FROM roles WHERE name = 'volunteer'),
       'Volunteer Onboarding', 'volunteer_onboarding', 1, true, false, true),

      ((SELECT id FROM roles WHERE name = 'beneficiary'),
       'Beneficiary Onboarding', 'beneficiary_onboarding', 1, true, false, true),

      ((SELECT id FROM roles WHERE name = 'ngo_admin'),
       'NGO Onboarding', 'ngo_onboarding', 1, true, true, true)

    ON CONFLICT (slug) DO NOTHING;
  `);

  // =========================
  // 2. DONOR STEPS
  // =========================
  pgm.sql(`
    INSERT INTO onboarding_template_steps
      (template_id, step_key, step_order, is_required, input_schema, config)
    VALUES
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'donor_onboarding'),
      'basic_info',
      1,
      true,
      '{
        "fields": [
          {"name":"full_name","type":"text","required":true},
          {"name":"email","type":"email","required":true},
          {"name":"phone","type":"text"}
        ]
      }',
      '{}'
    ),
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'donor_onboarding'),
      'preferences',
      2,
      true,
      '{
        "fields": [
          {"name":"donation_type","type":"select","options":["money","goods"]},
          {"name":"frequency","type":"select","options":["one_time","monthly"]}
        ]
      }',
      '{}'
    )
    ON CONFLICT DO NOTHING;
  `);

  // =========================
  // 3. VOLUNTEER STEPS
  // =========================
  pgm.sql(`
    INSERT INTO onboarding_template_steps
      (template_id, step_key, step_order, is_required, input_schema, config)
    VALUES
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'volunteer_onboarding'),
      'basic_info',
      1,
      true,
      '{
        "fields": [
          {"name":"full_name","type":"text"},
          {"name":"email","type":"email"},
          {"name":"phone","type":"text"}
        ]
      }',
      '{}'
    ),
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'volunteer_onboarding'),
      'skills',
      2,
      true,
      '{
        "fields": [
          {"name":"skills","type":"multi_select"},
          {"name":"experience_years","type":"number"}
        ]
      }',
      '{}'
    ),
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'volunteer_onboarding'),
      'availability',
      3,
      true,
      '{
        "fields": [
          {"name":"days_available","type":"multi_select"},
          {"name":"hours_per_week","type":"number"}
        ]
      }',
      '{}'
    )
    ON CONFLICT DO NOTHING;
  `);

  // =========================
  // 4. BENEFICIARY STEPS
  // =========================
  pgm.sql(`
    INSERT INTO onboarding_template_steps
      (template_id, step_key, step_order, is_required, input_schema, config)
    VALUES
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'beneficiary_onboarding'),
      'identity',
      1,
      true,
      '{
        "fields": [
          {"name":"full_name","type":"text"},
          {"name":"national_id","type":"text"},
          {"name":"phone","type":"text"}
        ]
      }',
      '{}'
    ),
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'beneficiary_onboarding'),
      'needs',
      2,
      true,
      '{
        "fields": [
          {"name":"need_type","type":"select","options":["food","medical","education"]},
          {"name":"description","type":"textarea"}
        ]
      }',
      '{}'
    ),
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'beneficiary_onboarding'),
      'location',
      3,
      true,
      '{
        "fields": [
          {"name":"city","type":"text"},
          {"name":"address","type":"text"}
        ]
      }',
      '{}'
    )
    ON CONFLICT DO NOTHING;
  `);

  // =========================
  // 5. NGO STEPS
  // =========================
  pgm.sql(`
    INSERT INTO onboarding_template_steps
      (template_id, step_key, step_order, is_required, input_schema, config)
    VALUES
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'ngo_onboarding'),
      'org_info',
      1,
      true,
      '{
        "fields": [
          {"name":"org_name","type":"text"},
          {"name":"registration_number","type":"text"}
        ]
      }',
      '{}'
    ),
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'ngo_onboarding'),
      'documents',
      2,
      true,
      '{
        "fields": [
          {"name":"license_doc","type":"file"},
          {"name":"tax_doc","type":"file"}
        ]
      }',
      '{}'
    ),
    (
      (SELECT id FROM onboarding_templates WHERE slug = 'ngo_onboarding'),
      'verification',
      3,
      true,
      '{
        "fields": [
          {"name":"website","type":"text"},
          {"name":"description","type":"textarea"}
        ]
      }',
      '{}'
    )
    ON CONFLICT DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM onboarding_template_steps;

    DELETE FROM onboarding_templates
    WHERE slug IN (
      'donor_onboarding',
      'volunteer_onboarding',
      'beneficiary_onboarding',
      'ngo_onboarding'
    );
  `);
};