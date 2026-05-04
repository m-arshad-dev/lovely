exports.up = (pgm) => {

  // =========================
  // 1. validate_step_template_match
  // =========================
  pgm.sql(`
    CREATE OR REPLACE FUNCTION validate_step_template_match()
    RETURNS trigger AS $$
    DECLARE
        step_template_id INTEGER;
    BEGIN
        SELECT template_id
        INTO step_template_id
        FROM onboarding_template_steps
        WHERE id = NEW.current_step_id;

        IF step_template_id IS NULL THEN
            RAISE EXCEPTION 'Invalid step_id';
        END IF;

        IF step_template_id <> NEW.template_id THEN
            RAISE EXCEPTION 'Step does not belong to flow template';
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_validate_step
    BEFORE UPDATE OF current_step_id ON onboarding_flows
    FOR EACH ROW
    EXECUTE FUNCTION validate_step_template_match();
  `);


  // =========================
  // 2. validate_approval_entity
  // =========================
  pgm.sql(`
    CREATE OR REPLACE FUNCTION validate_approval_entity()
    RETURNS trigger AS $$
    BEGIN

        IF NEW.entity_type = 'onboarding_flow' THEN
            IF NOT EXISTS (
                SELECT 1 FROM onboarding_flows WHERE id = NEW.entity_id
            ) THEN
                RAISE EXCEPTION 'Invalid onboarding_flow id';
            END IF;
        END IF;

        IF NEW.entity_type = 'ngo' THEN
            IF NOT EXISTS (
                SELECT 1 FROM ngos WHERE id = NEW.entity_id
            ) THEN
                RAISE EXCEPTION 'Invalid ngo id';
            END IF;
        END IF;

        IF NEW.entity_type = 'campaign' THEN
            IF NOT EXISTS (
                SELECT 1 FROM campaigns WHERE id = NEW.entity_id
            ) THEN
                RAISE EXCEPTION 'Invalid campaign id';
            END IF;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_validate_approval_entity
    BEFORE INSERT OR UPDATE ON approvals
    FOR EACH ROW
    EXECUTE FUNCTION validate_approval_entity();
  `);


  // =========================
  // 3. validate_flow_status_transition
  // =========================
  pgm.sql(`
    CREATE OR REPLACE FUNCTION validate_flow_status_transition()
    RETURNS trigger AS $$
    BEGIN

        IF OLD.status = 'COMPLETED' THEN
            RAISE EXCEPTION 'Completed flows cannot change';
        END IF;

        IF OLD.status = 'FAILED' AND NEW.status = 'COMPLETED' THEN
            RAISE EXCEPTION 'Failed flow cannot become completed';
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_validate_flow_status
    BEFORE UPDATE OF status ON onboarding_flows
    FOR EACH ROW
    EXECUTE FUNCTION validate_flow_status_transition();
  `);


  // =========================
  // 4. validate_step_data
  // =========================
  pgm.sql(`
    CREATE OR REPLACE FUNCTION validate_step_data()
    RETURNS trigger AS $$
    DECLARE
        valid_step BOOLEAN;
    BEGIN

        SELECT EXISTS (
            SELECT 1
            FROM onboarding_template_steps s
            JOIN onboarding_flows f ON f.template_id = s.template_id
            WHERE s.id = NEW.step_id
            AND f.id = NEW.flow_id
        ) INTO valid_step;

        IF NOT valid_step THEN
            RAISE EXCEPTION 'Step does not belong to this flow';
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_validate_step_data
    BEFORE INSERT OR UPDATE ON onboarding_step_data
    FOR EACH ROW
    EXECUTE FUNCTION validate_step_data();
  `);
};

exports.down = (pgm) => {

  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_validate_step ON onboarding_flows;
    DROP FUNCTION IF EXISTS validate_step_template_match();
  `);

  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_validate_approval_entity ON approvals;
    DROP FUNCTION IF EXISTS validate_approval_entity();
  `);

  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_validate_flow_status ON onboarding_flows;
    DROP FUNCTION IF EXISTS validate_flow_status_transition();
  `);

  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_validate_step_data ON onboarding_step_data;
    DROP FUNCTION IF EXISTS validate_step_data();
  `);
};