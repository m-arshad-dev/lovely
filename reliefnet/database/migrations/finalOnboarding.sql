-- We have created this so know the approval is for what
-- purpose we use this iin the approvals table
CREATE TYPE approval_entity AS ENUM (
    'onboarding_flow',
    'ngo',
    'campaign'
)

-- this table is generic one for all in order to find 
-- its role or permission we will use the id of the user
-- and query the relevent tables 
-- answers
-- Who is this person in the system?
-- Can they log in?
-- What is their account state?
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','SUSPENDED')),

    email_verified BOOLEAN DEFAULT FALSE,

    failed_login_attempts INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMP,

    last_login TIMESTAMP,
    deleted_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- this table just tells which roles our system currently
-- supports that is mostly static that's why we seed the 
-- the roles we have in our system
-- What types of actors exist?
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (name)
VALUES 
('donor'),
('volunteer'),
('beneficiary'),
('ngo_admin'),
('admin'),
('super_admin');


-- this table combines the user and the roles tables 
-- so that we can know which user have which roles
-- for now on user one role 
-- “This user is trying to become (or is) this role”

-- “A user can have multiple roles, but each role only once”
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,

    is_active BOOLEAN DEFAULT FALSE,
    activated_at TIMESTAMP,

    activated_by INTEGER REFERENCES users(id),

    created_at TIMESTAMP DEFAULT now(),
-- “A user can have multiple roles, but each role only once”
    UNIQUE (user_id, role_id)
);

-- If later We want:

-- “only ONE active role at a time”

-- Wee will need:
-- CREATE UNIQUE INDEX one_active_role_per_user
-- ON user_roles(user_id)
-- WHERE is_active = true;


-- this table tells whether onboarding exists or not 
-- approval is required or not for the activation 
-- which version or template to use
CREATE TABLE onboarding_templates (
    id SERIAL PRIMARY KEY,

    role_id INTEGER NOT NULL REFERENCES roles(id),

    name VARCHAR(100) NOT NULL,
    version INTEGER DEFAULT 1,              -- 🔥 NEW
    is_default BOOLEAN DEFAULT TRUE,       -- 🔥 NEW

    
    requires_approval BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT now(),

    -- 🔥 FIXED (no longer blocks scaling)
    UNIQUE (role_id, name, version)
);





--  step identity (step_key)
--  order (step_order)
--  whether required
--  what inputs are expected (input_schema)
--  optional behavior/config (config)

-- this table has many instances each have the above mentioned
-- stuff and tell what to do and in what order 
-- this tells what user should fill this does not contain the 
-- data that user enters keep in mind
CREATE TABLE onboarding_template_steps (
    id SERIAL PRIMARY KEY,

    template_id INTEGER NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,

    step_key VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,

    is_required BOOLEAN DEFAULT TRUE,

    input_schema JSONB DEFAULT '{}'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT now(),

    UNIQUE (template_id, step_order)
);

CREATE TABLE onboarding_flows (
    id SERIAL PRIMARY KEY,

    user_role_id INTEGER NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES onboarding_templates(id),

    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS'
    CHECK (status IN ('IN_PROGRESS','COMPLETED','FAILED')),

    current_step_id INTEGER REFERENCES onboarding_template_steps(id),

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);



CREATE TABLE onboarding_step_data (
    id SERIAL PRIMARY KEY,

    flow_id INTEGER NOT NULL REFERENCES onboarding_flows(id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL REFERENCES onboarding_template_steps(id),

    data JSONB NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED'
        CHECK (status IN ('NOT_STARTED','IN_PROGRESS','SUBMITTED','APPROVED','REJECTED')),

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),

    UNIQUE (flow_id, step_id)
);

CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,

    entity_type approval_entity NOT NULL,
    entity_id INTEGER NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','APPROVED','REJECTED')),

    reviewed_by INTEGER REFERENCES users(id),
    notes TEXT,

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
-- Only ONE active onboarding flow per role
CREATE UNIQUE INDEX unique_active_flow
ON onboarding_flows(user_role_id)
WHERE status = 'IN_PROGRESS';

-- 🔥 Prevent duplicate approvals per entity
CREATE UNIQUE INDEX unique_approval_per_entity
ON approvals(entity_type, entity_id);

-- Performance indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_flows_status ON onboarding_flows(status);
CREATE INDEX idx_step_data_flow ON onboarding_step_data(flow_id);
CREATE INDEX idx_approvals_entity ON approvals(entity_type, entity_id);
CREATE INDEX idx_step_data_status ON onboarding_step_data(status);
CREATE INDEX idx_approvals_status ON approvals(status);



CREATE UNIQUE INDEX one_default_template_per_role
ON onboarding_templates(role_id)
WHERE is_default = TRUE;


CREATE OR REPLACE FUNCTION validate_step_template_match()
RETURNS trigger AS $$
DECLARE
    step_template_id INTEGER;
BEGIN
    SELECT template_id
    INTO STRICT step_template_id
    FROM onboarding_template_steps
    WHERE id = NEW.current_step_id;

    if step_template_id IS NULL THEN
        RAISE EXCEPTION 'Invalid step_id'

    IF step_template_id <> NEW.template_id THEN
        RAISE EXCEPTION 'Step does not belong to flow template';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;




CREATE TRIGGER trg_validate_step
BEFORE UPDATE OF current_step_id ON onboarding_flows
FOR EACH ROW
EXECUTE FUNCTION validate_step_template_match();


CREATE OR REPLACE FUNCTION validate_approval_entity()
RETURNS trigger AS $$
BEGIN

    -- onboarding_flow validation
    IF NEW.entity_type = 'onboarding_flow' THEN
        IF NOT EXISTS (
            SELECT 1 FROM onboarding_flows WHERE id = NEW.entity_id
        ) THEN
            RAISE EXCEPTION 'Invalid onboarding_flow id';
        END IF;
    END IF;

    -- ngo validation (assuming table exists)
    IF NEW.entity_type = 'ngo' THEN
        IF NOT EXISTS (
            SELECT 1 FROM ngos WHERE id = NEW.entity_id
        ) THEN
            RAISE EXCEPTION 'Invalid ngo id';
        END IF;
    END IF;

    -- campaign validation (assuming table exists)
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


CREATE TRIGGER trg_validate_approval_entity
BEFORE INSERT OR UPDATE ON approvals
FOR EACH ROW
EXECUTE FUNCTION validate_approval_entity();



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

CREATE TRIGGER trg_validate_flow_status
BEFORE UPDATE OF status ON onboarding_flows
FOR EACH ROW
EXECUTE FUNCTION validate_flow_status_transition();


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

CREATE TRIGGER trg_validate_step_data
BEFORE INSERT OR UPDATE ON onboarding_step_data
FOR EACH ROW
EXECUTE FUNCTION validate_step_data();