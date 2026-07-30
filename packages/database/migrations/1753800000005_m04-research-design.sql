-- Up Migration
-- M04 Research Project and Protocol (Doc 8 §2.6, Doc 16 research_design).

CREATE SCHEMA IF NOT EXISTS research_design;

CREATE TABLE research_design.research_projects (
  id             text PRIMARY KEY,
  organisation_id text NOT NULL,
  title          text NOT NULL,
  project_state  text NOT NULL DEFAULT 'Draft' CHECK (project_state IN
                   ('Draft', 'In Review', 'Approved', 'Active', 'Suspended', 'Completed', 'Cancelled', 'Archived')),
  project_phase  text NOT NULL DEFAULT 'Design' CHECK (project_phase IN
                   ('Design', 'Setup', 'Recruitment', 'Intervention Delivery', 'Follow-Up',
                    'Data Preparation', 'Analysis', 'Reporting', 'Closure')),
  created_by_actor_id text NOT NULL,
  record_version integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE research_design.research_questions (
  id             text PRIMARY KEY,
  research_project_id text NOT NULL REFERENCES research_design.research_projects (id),
  question_text  text NOT NULL,
  question_state text NOT NULL DEFAULT 'Draft' CHECK (question_state IN
                   ('Draft', 'In Review', 'Approved', 'Closed', 'Superseded', 'Archived')),
  record_version integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE research_design.protocols (
  id             text PRIMARY KEY,
  research_project_id text NOT NULL REFERENCES research_design.research_projects (id),
  title          text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE research_design.protocol_versions (
  id              text PRIMARY KEY,
  protocol_id     text NOT NULL REFERENCES research_design.protocols (id),
  version_number  integer NOT NULL,
  version_state   text NOT NULL DEFAULT 'Draft' CHECK (version_state IN
                    ('Draft', 'In Review', 'Approved', 'Active', 'Suspended', 'Superseded', 'Archived', 'Rejected')),
  content         jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash    text NOT NULL,
  submitted_by_actor_id text,
  approved_by_actor_id  text,
  approved_at     timestamptz,
  record_version  integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (protocol_id, version_number),
  -- Separation of duties at the storage layer too (ADR-051).
  CHECK (approved_by_actor_id IS NULL OR approved_by_actor_id <> submitted_by_actor_id)
);

-- At most one Active version per protocol.
CREATE UNIQUE INDEX protocol_versions_single_active
  ON research_design.protocol_versions (protocol_id) WHERE version_state = 'Active';

-- Approved versions are immutable: content changes are rejected once the
-- version has left Draft/In Review (ATR-004; new content = new version).
CREATE OR REPLACE FUNCTION research_design.protect_approved_protocol_version()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.version_state IN ('Approved', 'Active', 'Suspended', 'Superseded', 'Archived')
     AND (NEW.content_hash <> OLD.content_hash OR NEW.content <> OLD.content) THEN
    RAISE EXCEPTION 'protocol_versions: content of an approved version is immutable (ATR-004)';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protocol_versions_immutable
  BEFORE UPDATE ON research_design.protocol_versions
  FOR EACH ROW EXECUTE FUNCTION research_design.protect_approved_protocol_version();

-- Down Migration
DROP TRIGGER protocol_versions_immutable ON research_design.protocol_versions;
DROP FUNCTION research_design.protect_approved_protocol_version();
DROP TABLE research_design.protocol_versions;
DROP TABLE research_design.protocols;
DROP TABLE research_design.research_questions;
DROP TABLE research_design.research_projects;
DROP SCHEMA research_design;
