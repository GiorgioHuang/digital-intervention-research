-- Up Migration
-- M06 Intervention Portfolio and Configuration (Doc 8 §2.8).

CREATE SCHEMA IF NOT EXISTS intervention_portfolio;

CREATE TABLE intervention_portfolio.interventions (
  id              text PRIMARY KEY,
  -- Stable INT-NNN identity; never encodes version or status (Doc 3).
  intervention_code text NOT NULL UNIQUE,
  name            text NOT NULL,
  lifecycle_maturity text NOT NULL DEFAULT 'Concept' CHECK (lifecycle_maturity IN
                    ('Idea', 'Concept', 'Evidence Review', 'Co-Design', 'Prototype', 'Feasibility',
                     'Pilot', 'Evaluated', 'Controlled Deployment', 'Ongoing Monitoring', 'Suspended', 'Retired')),
  evidence_status text NOT NULL DEFAULT 'E0' CHECK (evidence_status IN ('E0', 'E1', 'E2', 'E3', 'E4', 'E5')),
  evidence_direction text NOT NULL DEFAULT 'Not Evaluated' CHECK (evidence_direction IN
                    ('Not Evaluated', 'Beneficial', 'Beneficial with Conditions', 'Null', 'Mixed',
                     'Harmful', 'Conflicting', 'Uncertain')),
  record_version  integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE intervention_portfolio.intervention_versions (
  id              text PRIMARY KEY,
  intervention_id text NOT NULL REFERENCES intervention_portfolio.interventions (id),
  version_number  integer NOT NULL,
  version_state   text NOT NULL DEFAULT 'Draft' CHECK (version_state IN
                    ('Draft', 'In Review', 'Approved', 'Active', 'Suspended', 'Superseded', 'Retired', 'Archived', 'Rejected')),
  content         jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash    text NOT NULL,
  submitted_by_actor_id text,
  approved_by_actor_id  text,
  approved_at     timestamptz,
  record_version  integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (intervention_id, version_number),
  CHECK (approved_by_actor_id IS NULL OR approved_by_actor_id <> submitted_by_actor_id)
);

CREATE UNIQUE INDEX intervention_versions_single_active
  ON intervention_portfolio.intervention_versions (intervention_id) WHERE version_state = 'Active';

CREATE OR REPLACE FUNCTION intervention_portfolio.protect_approved_intervention_version()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.version_state IN ('Approved', 'Active', 'Suspended', 'Superseded', 'Retired', 'Archived')
     AND (NEW.content_hash <> OLD.content_hash OR NEW.content <> OLD.content) THEN
    RAISE EXCEPTION 'intervention_versions: content of an approved version is immutable (ATR-004)';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER intervention_versions_immutable
  BEFORE UPDATE ON intervention_portfolio.intervention_versions
  FOR EACH ROW EXECUTE FUNCTION intervention_portfolio.protect_approved_intervention_version();

-- Configuration references exact versions (lineage contract).
CREATE TABLE intervention_portfolio.intervention_configurations (
  id                      text PRIMARY KEY,
  research_project_id     text NOT NULL,
  protocol_version_id     text NOT NULL,
  intervention_version_id text NOT NULL REFERENCES intervention_portfolio.intervention_versions (id),
  configuration_state     text NOT NULL DEFAULT 'Draft'
                          CHECK (configuration_state IN ('Draft', 'In Review', 'Approved', 'Active', 'Superseded', 'Archived')),
  settings                jsonb NOT NULL DEFAULT '{}'::jsonb,
  record_version          integer NOT NULL DEFAULT 1,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE intervention_portfolio.intervention_configurations;
DROP TRIGGER intervention_versions_immutable ON intervention_portfolio.intervention_versions;
DROP FUNCTION intervention_portfolio.protect_approved_intervention_version();
DROP TABLE intervention_portfolio.intervention_versions;
DROP TABLE intervention_portfolio.interventions;
DROP SCHEMA intervention_portfolio;
