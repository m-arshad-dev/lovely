--
-- PostgreSQL database dump
--

\restrict N0FmbdOk1vciSC9hDjMT8UOyT9UEcbKqiFt6RZslMCwnxSrGDPhbethWBZXxueS

-- Dumped from database version 17.9 (Debian 17.9-0+deb13u1)
-- Dumped by pg_dump version 17.9 (Debian 17.9-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: approval_entity; Type: TYPE; Schema: public; Owner: arshad_dev
--

CREATE TYPE public.approval_entity AS ENUM (
    'onboarding_flow',
    'ngo',
    'campaign'
);


ALTER TYPE public.approval_entity OWNER TO arshad_dev;

--
-- Name: validate_approval_entity(); Type: FUNCTION; Schema: public; Owner: arshad_dev
--

CREATE FUNCTION public.validate_approval_entity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
    $$;


ALTER FUNCTION public.validate_approval_entity() OWNER TO arshad_dev;

--
-- Name: validate_flow_status_transition(); Type: FUNCTION; Schema: public; Owner: arshad_dev
--

CREATE FUNCTION public.validate_flow_status_transition() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN

        IF OLD.status = 'COMPLETED' THEN
            RAISE EXCEPTION 'Completed flows cannot change';
        END IF;

        IF OLD.status = 'FAILED' AND NEW.status = 'COMPLETED' THEN
            RAISE EXCEPTION 'Failed flow cannot become completed';
        END IF;

        RETURN NEW;
    END;
    $$;


ALTER FUNCTION public.validate_flow_status_transition() OWNER TO arshad_dev;

--
-- Name: validate_step_data(); Type: FUNCTION; Schema: public; Owner: arshad_dev
--

CREATE FUNCTION public.validate_step_data() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
    $$;


ALTER FUNCTION public.validate_step_data() OWNER TO arshad_dev;

--
-- Name: validate_step_template_match(); Type: FUNCTION; Schema: public; Owner: arshad_dev
--

CREATE FUNCTION public.validate_step_template_match() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
    $$;


ALTER FUNCTION public.validate_step_template_match() OWNER TO arshad_dev;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: approvals; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.approvals (
    id integer NOT NULL,
    entity_type public.approval_entity NOT NULL,
    entity_id integer NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    reviewed_by integer,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT approvals_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.approvals OWNER TO arshad_dev;

--
-- Name: approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: arshad_dev
--

CREATE SEQUENCE public.approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approvals_id_seq OWNER TO arshad_dev;

--
-- Name: approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arshad_dev
--

ALTER SEQUENCE public.approvals_id_seq OWNED BY public.approvals.id;


--
-- Name: onboarding_flows; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.onboarding_flows (
    id integer NOT NULL,
    user_role_id integer NOT NULL,
    template_id integer NOT NULL,
    status character varying(30) DEFAULT 'IN_PROGRESS'::character varying NOT NULL,
    current_step_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT flows_status_check CHECK (((status)::text = ANY ((ARRAY['IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying])::text[])))
);


ALTER TABLE public.onboarding_flows OWNER TO arshad_dev;

--
-- Name: onboarding_flows_id_seq; Type: SEQUENCE; Schema: public; Owner: arshad_dev
--

CREATE SEQUENCE public.onboarding_flows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onboarding_flows_id_seq OWNER TO arshad_dev;

--
-- Name: onboarding_flows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arshad_dev
--

ALTER SEQUENCE public.onboarding_flows_id_seq OWNED BY public.onboarding_flows.id;


--
-- Name: onboarding_step_data; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.onboarding_step_data (
    id integer NOT NULL,
    flow_id integer NOT NULL,
    step_id integer NOT NULL,
    data jsonb NOT NULL,
    status character varying(20) DEFAULT 'NOT_STARTED'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT step_data_status_check CHECK (((status)::text = ANY ((ARRAY['NOT_STARTED'::character varying, 'IN_PROGRESS'::character varying, 'SUBMITTED'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.onboarding_step_data OWNER TO arshad_dev;

--
-- Name: onboarding_step_data_id_seq; Type: SEQUENCE; Schema: public; Owner: arshad_dev
--

CREATE SEQUENCE public.onboarding_step_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onboarding_step_data_id_seq OWNER TO arshad_dev;

--
-- Name: onboarding_step_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arshad_dev
--

ALTER SEQUENCE public.onboarding_step_data_id_seq OWNED BY public.onboarding_step_data.id;


--
-- Name: onboarding_template_steps; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.onboarding_template_steps (
    id integer NOT NULL,
    template_id integer NOT NULL,
    step_key character varying(100) NOT NULL,
    step_order integer NOT NULL,
    is_required boolean DEFAULT true,
    input_schema jsonb DEFAULT '{}'::jsonb,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.onboarding_template_steps OWNER TO arshad_dev;

--
-- Name: onboarding_template_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: arshad_dev
--

CREATE SEQUENCE public.onboarding_template_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onboarding_template_steps_id_seq OWNER TO arshad_dev;

--
-- Name: onboarding_template_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arshad_dev
--

ALTER SEQUENCE public.onboarding_template_steps_id_seq OWNED BY public.onboarding_template_steps.id;


--
-- Name: onboarding_templates; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.onboarding_templates (
    id integer NOT NULL,
    role_id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    version integer DEFAULT 1,
    is_default boolean DEFAULT true,
    requires_approval boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.onboarding_templates OWNER TO arshad_dev;

--
-- Name: onboarding_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: arshad_dev
--

CREATE SEQUENCE public.onboarding_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onboarding_templates_id_seq OWNER TO arshad_dev;

--
-- Name: onboarding_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arshad_dev
--

ALTER SEQUENCE public.onboarding_templates_id_seq OWNED BY public.onboarding_templates.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.permissions OWNER TO arshad_dev;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: arshad_dev
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO arshad_dev;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arshad_dev
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: pgmigrations; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.pgmigrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    run_on timestamp without time zone NOT NULL
);


ALTER TABLE public.pgmigrations OWNER TO arshad_dev;

--
-- Name: pgmigrations_id_seq; Type: SEQUENCE; Schema: public; Owner: arshad_dev
--

CREATE SEQUENCE public.pgmigrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pgmigrations_id_seq OWNER TO arshad_dev;

--
-- Name: pgmigrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arshad_dev
--

ALTER SEQUENCE public.pgmigrations_id_seq OWNED BY public.pgmigrations.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO arshad_dev;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO arshad_dev;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: arshad_dev
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO arshad_dev;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arshad_dev
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    is_active boolean DEFAULT false,
    activated_at timestamp without time zone,
    activated_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_roles OWNER TO arshad_dev;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: arshad_dev
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO arshad_dev;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arshad_dev
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: arshad_dev
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    email_verified boolean DEFAULT false,
    failed_login_attempts integer DEFAULT 0,
    is_blocked boolean DEFAULT false,
    locked_until timestamp without time zone,
    last_login timestamp without time zone,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'SUSPENDED'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO arshad_dev;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: arshad_dev
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO arshad_dev;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arshad_dev
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: approvals id; Type: DEFAULT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.approvals ALTER COLUMN id SET DEFAULT nextval('public.approvals_id_seq'::regclass);


--
-- Name: onboarding_flows id; Type: DEFAULT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_flows ALTER COLUMN id SET DEFAULT nextval('public.onboarding_flows_id_seq'::regclass);


--
-- Name: onboarding_step_data id; Type: DEFAULT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_step_data ALTER COLUMN id SET DEFAULT nextval('public.onboarding_step_data_id_seq'::regclass);


--
-- Name: onboarding_template_steps id; Type: DEFAULT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_template_steps ALTER COLUMN id SET DEFAULT nextval('public.onboarding_template_steps_id_seq'::regclass);


--
-- Name: onboarding_templates id; Type: DEFAULT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_templates ALTER COLUMN id SET DEFAULT nextval('public.onboarding_templates_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: pgmigrations id; Type: DEFAULT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.pgmigrations ALTER COLUMN id SET DEFAULT nextval('public.pgmigrations_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: approvals approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_pkey PRIMARY KEY (id);


--
-- Name: onboarding_flows onboarding_flows_pkey; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_flows
    ADD CONSTRAINT onboarding_flows_pkey PRIMARY KEY (id);


--
-- Name: onboarding_step_data onboarding_step_data_pkey; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_step_data
    ADD CONSTRAINT onboarding_step_data_pkey PRIMARY KEY (id);


--
-- Name: onboarding_template_steps onboarding_template_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_template_steps
    ADD CONSTRAINT onboarding_template_steps_pkey PRIMARY KEY (id);


--
-- Name: onboarding_templates onboarding_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_templates
    ADD CONSTRAINT onboarding_templates_pkey PRIMARY KEY (id);


--
-- Name: onboarding_templates onboarding_templates_slug_key; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_templates
    ADD CONSTRAINT onboarding_templates_slug_key UNIQUE (slug);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: pgmigrations pgmigrations_pkey; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.pgmigrations
    ADD CONSTRAINT pgmigrations_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_perm_unique; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_perm_unique UNIQUE (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: onboarding_step_data unique_flow_step; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_step_data
    ADD CONSTRAINT unique_flow_step UNIQUE (flow_id, step_id);


--
-- Name: onboarding_templates unique_role_name_version; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_templates
    ADD CONSTRAINT unique_role_name_version UNIQUE (role_id, name, version);


--
-- Name: onboarding_template_steps unique_template_step_key; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_template_steps
    ADD CONSTRAINT unique_template_step_key UNIQUE (template_id, step_key);


--
-- Name: onboarding_template_steps unique_template_step_order; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_template_steps
    ADD CONSTRAINT unique_template_step_order UNIQUE (template_id, step_order);


--
-- Name: user_roles unique_user_role; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT unique_user_role UNIQUE (user_id, role_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_approvals_entity; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE INDEX idx_approvals_entity ON public.approvals USING btree (entity_type, entity_id);


--
-- Name: idx_approvals_status; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE INDEX idx_approvals_status ON public.approvals USING btree (status);


--
-- Name: idx_flow_user_status; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE INDEX idx_flow_user_status ON public.onboarding_flows USING btree (user_role_id, status);


--
-- Name: idx_flows_status; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE INDEX idx_flows_status ON public.onboarding_flows USING btree (status);


--
-- Name: idx_flows_user_role_id; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE INDEX idx_flows_user_role_id ON public.onboarding_flows USING btree (user_role_id);


--
-- Name: idx_pending_approvals; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE INDEX idx_pending_approvals ON public.approvals USING btree (entity_type) WHERE ((status)::text = 'PENDING'::text);


--
-- Name: idx_step_data_flow_id; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE INDEX idx_step_data_flow_id ON public.onboarding_step_data USING btree (flow_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: one_default_template_per_role; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE UNIQUE INDEX one_default_template_per_role ON public.onboarding_templates USING btree (role_id) WHERE (is_default = true);


--
-- Name: unique_active_flow; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE UNIQUE INDEX unique_active_flow ON public.onboarding_flows USING btree (user_role_id) WHERE ((status)::text = 'IN_PROGRESS'::text);


--
-- Name: unique_approval_per_entity; Type: INDEX; Schema: public; Owner: arshad_dev
--

CREATE UNIQUE INDEX unique_approval_per_entity ON public.approvals USING btree (entity_type, entity_id);


--
-- Name: approvals trg_validate_approval_entity; Type: TRIGGER; Schema: public; Owner: arshad_dev
--

CREATE TRIGGER trg_validate_approval_entity BEFORE INSERT OR UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.validate_approval_entity();


--
-- Name: onboarding_flows trg_validate_flow_status; Type: TRIGGER; Schema: public; Owner: arshad_dev
--

CREATE TRIGGER trg_validate_flow_status BEFORE UPDATE OF status ON public.onboarding_flows FOR EACH ROW EXECUTE FUNCTION public.validate_flow_status_transition();


--
-- Name: onboarding_flows trg_validate_step; Type: TRIGGER; Schema: public; Owner: arshad_dev
--

CREATE TRIGGER trg_validate_step BEFORE UPDATE OF current_step_id ON public.onboarding_flows FOR EACH ROW EXECUTE FUNCTION public.validate_step_template_match();


--
-- Name: onboarding_step_data trg_validate_step_data; Type: TRIGGER; Schema: public; Owner: arshad_dev
--

CREATE TRIGGER trg_validate_step_data BEFORE INSERT OR UPDATE ON public.onboarding_step_data FOR EACH ROW EXECUTE FUNCTION public.validate_step_data();


--
-- Name: approvals approvals_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: onboarding_flows onboarding_flows_current_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_flows
    ADD CONSTRAINT onboarding_flows_current_step_id_fkey FOREIGN KEY (current_step_id) REFERENCES public.onboarding_template_steps(id) ON DELETE SET NULL;


--
-- Name: onboarding_flows onboarding_flows_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_flows
    ADD CONSTRAINT onboarding_flows_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.onboarding_templates(id) ON DELETE CASCADE;


--
-- Name: onboarding_flows onboarding_flows_user_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_flows
    ADD CONSTRAINT onboarding_flows_user_role_id_fkey FOREIGN KEY (user_role_id) REFERENCES public.user_roles(id) ON DELETE CASCADE;


--
-- Name: onboarding_step_data onboarding_step_data_flow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_step_data
    ADD CONSTRAINT onboarding_step_data_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.onboarding_flows(id) ON DELETE CASCADE;


--
-- Name: onboarding_step_data onboarding_step_data_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_step_data
    ADD CONSTRAINT onboarding_step_data_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.onboarding_template_steps(id) ON DELETE RESTRICT;


--
-- Name: onboarding_template_steps onboarding_template_steps_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_template_steps
    ADD CONSTRAINT onboarding_template_steps_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.onboarding_templates(id) ON DELETE CASCADE;


--
-- Name: onboarding_templates onboarding_templates_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.onboarding_templates
    ADD CONSTRAINT onboarding_templates_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_activated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_activated_by_fkey FOREIGN KEY (activated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arshad_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict N0FmbdOk1vciSC9hDjMT8UOyT9UEcbKqiFt6RZslMCwnxSrGDPhbethWBZXxueS

