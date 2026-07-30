-- Up Migration
-- M12 Dataset lifecycle with immutable DatasetLock (ADR-045) and
-- M13 analysis chain (Output != Interpretation != Finding, ADR-046).

CREATE SCHEMA IF NOT EXISTS dataset_quality;

CREATE TABLE dataset_quality.dataset_definitions (
  id                  text PRIMARY KEY,
  research_project_id text NOT NULL,
  name                text NOT NULL,
  -- Variable dictionary; message body exclusion is the default (ADR-034).
  variables           jsonb NOT NULL,
  definition_state    text NOT NULL DEFAULT 'Draft'
                      CHECK (definition_state IN ('Draft', 'In Review', 'Approved', 'Superseded', 'Archived')),
  created_by_actor_id text NOT NULL,
  approved_by_actor_id text,
  record_version      integer NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (approved_by_actor_id IS NULL OR approved_by_actor_id <> created_by_actor_id)
);

CREATE TABLE dataset_quality.dataset_versions (
  id                    text PRIMARY KEY,
  dataset_definition_id text NOT NULL REFERENCES dataset_quality.dataset_definitions (id),
  version_number        integer NOT NULL,
  version_state         text NOT NULL DEFAULT 'Generated' CHECK (version_state IN
                          ('Draft', 'Generated', 'Quality Review', 'Quality Reviewed', 'Locked', 'Analysed', 'Superseded', 'Archived')),
  manifest              jsonb NOT NULL,
  manifest_hash         text NOT NULL,
  row_count             integer NOT NULL,
  record_version        integer NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dataset_definition_id, version_number)
);

CREATE TABLE dataset_quality.dataset_locks (
  id                  text PRIMARY KEY,
  dataset_version_id  text NOT NULL UNIQUE REFERENCES dataset_quality.dataset_versions (id),
  locked_by_actor_id  text NOT NULL,
  manifest_hash       text NOT NULL,
  locked_at           timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION dataset_quality.protect_locked_version()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.version_state IN ('Locked', 'Analysed')
     AND (NEW.manifest <> OLD.manifest OR NEW.manifest_hash <> OLD.manifest_hash OR NEW.row_count <> OLD.row_count) THEN
    RAISE EXCEPTION 'dataset_versions: a locked version is immutable (ADR-045)';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER dataset_versions_locked_immutable
  BEFORE UPDATE ON dataset_quality.dataset_versions
  FOR EACH ROW EXECUTE FUNCTION dataset_quality.protect_locked_version();

CREATE SCHEMA IF NOT EXISTS analysis_finding;

CREATE TABLE analysis_finding.analysis_plans (
  id                  text PRIMARY KEY,
  research_project_id text NOT NULL,
  title               text NOT NULL,
  plan_state          text NOT NULL DEFAULT 'Draft'
                      CHECK (plan_state IN ('Draft', 'In Review', 'Approved', 'Active', 'Superseded', 'Archived', 'Rejected')),
  drafted_by_actor_id text NOT NULL,
  approved_by_actor_id text,
  record_version      integer NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (approved_by_actor_id IS NULL OR approved_by_actor_id <> drafted_by_actor_id)
);

CREATE TABLE analysis_finding.analysis_runs (
  id                  text PRIMARY KEY,
  analysis_plan_id    text NOT NULL REFERENCES analysis_finding.analysis_plans (id),
  dataset_version_id  text NOT NULL REFERENCES dataset_quality.dataset_versions (id),
  run_state           text NOT NULL DEFAULT 'Queued'
                      CHECK (run_state IN ('Queued', 'Running', 'Completed', 'Completed with Warnings', 'Failed', 'Cancelled', 'Superseded')),
  outputs             jsonb NOT NULL DEFAULT '{}'::jsonb,
  environment         jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_by_actor_id text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE analysis_finding.interpretation_records (
  id                   text PRIMARY KEY,
  analysis_run_id      text NOT NULL REFERENCES analysis_finding.analysis_runs (id),
  interpretation_text  text NOT NULL,
  interpretation_state text NOT NULL DEFAULT 'Draft'
                       CHECK (interpretation_state IN ('Draft', 'In Review', 'Approved', 'Superseded')),
  drafted_by_actor_id  text NOT NULL,
  approved_by_actor_id text,
  record_version       integer NOT NULL DEFAULT 1,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CHECK (approved_by_actor_id IS NULL OR approved_by_actor_id <> drafted_by_actor_id)
);

CREATE TABLE analysis_finding.research_findings (
  id                       text PRIMARY KEY,
  interpretation_record_id text NOT NULL REFERENCES analysis_finding.interpretation_records (id),
  finding_text             text NOT NULL,
  finding_state            text NOT NULL DEFAULT 'Draft' CHECK (finding_state IN
                             ('Draft', 'In Review', 'Approved', 'Approved with Limitations', 'Rejected', 'Superseded', 'Withdrawn', 'Archived')),
  drafted_by_actor_id      text NOT NULL,
  approved_by_actor_id     text,
  record_version           integer NOT NULL DEFAULT 1,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CHECK (approved_by_actor_id IS NULL OR approved_by_actor_id <> drafted_by_actor_id)
);

-- Down Migration
DROP TABLE analysis_finding.research_findings;
DROP TABLE analysis_finding.interpretation_records;
DROP TABLE analysis_finding.analysis_runs;
DROP TABLE analysis_finding.analysis_plans;
DROP SCHEMA analysis_finding;
DROP TABLE dataset_quality.dataset_locks;
DROP TRIGGER dataset_versions_locked_immutable ON dataset_quality.dataset_versions;
DROP FUNCTION dataset_quality.protect_locked_version();
DROP TABLE dataset_quality.dataset_versions;
DROP TABLE dataset_quality.dataset_definitions;
DROP SCHEMA dataset_quality;
