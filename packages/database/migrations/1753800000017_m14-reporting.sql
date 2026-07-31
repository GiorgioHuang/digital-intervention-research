-- Up Migration
-- M14 Reporting and External Submission (MVP-limited slice, Doc 16 §37):
-- reports with immutable approved versions, export requests carrying
-- purpose/recipient/exact sources/restrictions/de-identification, and
-- distinct generated/delivered/received delivery states. External
-- submissions are deliberately NOT in the MVP slice.

CREATE SCHEMA IF NOT EXISTS reporting_submission;

CREATE TABLE reporting_submission.reports (
  id                  text PRIMARY KEY,
  research_project_id text NOT NULL,
  title               text NOT NULL,
  report_type         text NOT NULL CHECK (report_type IN
                        ('ParticipantSummary', 'ResearchReport', 'FindingPackage')),
  created_by_actor_id text NOT NULL,
  record_version      integer NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reporting_submission.report_versions (
  id                   text PRIMARY KEY,
  report_id            text NOT NULL REFERENCES reporting_submission.reports (id),
  version_number       integer NOT NULL,
  content              jsonb NOT NULL,
  version_state        text NOT NULL DEFAULT 'Draft' CHECK (version_state IN
                         ('Draft', 'Approved', 'Superseded')),
  created_by_actor_id  text NOT NULL,
  approved_by_actor_id text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, version_number),
  CHECK ((version_state IN ('Approved', 'Superseded')) = (approved_by_actor_id IS NOT NULL)),
  -- Separation of duties (ADR-051).
  CHECK (approved_by_actor_id IS NULL OR approved_by_actor_id <> created_by_actor_id)
);

-- Approved report version content is immutable (Doc 16 §37.1): after
-- approval only the Approved -> Superseded transition may touch the row.
CREATE OR REPLACE FUNCTION reporting_submission.reject_approved_mutation()
RETURNS trigger AS $$
BEGIN
  IF OLD.version_state = 'Approved' AND (
       NEW.content IS DISTINCT FROM OLD.content
       OR NEW.version_state NOT IN ('Approved', 'Superseded')
     ) THEN
    RAISE EXCEPTION 'approved report versions are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER report_versions_immutable
  BEFORE UPDATE ON reporting_submission.report_versions
  FOR EACH ROW EXECUTE FUNCTION reporting_submission.reject_approved_mutation();

CREATE TABLE reporting_submission.export_requests (
  id                    text PRIMARY KEY,
  export_type           text NOT NULL CHECK (export_type IN
                          ('ResearchExport', 'ParticipantPortability')),
  purpose               text NOT NULL,
  recipient             text NOT NULL,
  -- Exact sources (Doc 16 §37.2) as explicit references.
  sources               jsonb NOT NULL,
  restrictions          text NOT NULL DEFAULT '',
  de_identification     text NOT NULL CHECK (de_identification IN
                          ('None', 'Pseudonymised', 'Anonymised')),
  participant_id        text,
  requested_by_actor_id text NOT NULL,
  approved_by_actor_id  text,
  request_state         text NOT NULL DEFAULT 'Requested' CHECK (request_state IN
                          ('Requested', 'Approved', 'Rejected', 'Generated', 'Delivered', 'Received')),
  record_version        integer NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- Portability names its participant; research exports never leave
  -- identifiable (Doc 16 §37.2/§37.5).
  CHECK ((export_type = 'ParticipantPortability') = (participant_id IS NOT NULL)),
  CHECK (export_type = 'ParticipantPortability' OR de_identification <> 'None'),
  -- Approval/decision states always name a decider who is not the requester.
  CHECK ((request_state IN ('Approved', 'Rejected', 'Generated', 'Delivered', 'Received'))
           = (approved_by_actor_id IS NOT NULL)),
  CHECK (approved_by_actor_id IS NULL OR approved_by_actor_id <> requested_by_actor_id)
);

CREATE TABLE reporting_submission.export_packages (
  id                text PRIMARY KEY,
  export_request_id text NOT NULL UNIQUE REFERENCES reporting_submission.export_requests (id),
  manifest          jsonb NOT NULL,
  manifest_hash     text NOT NULL,
  generated_at      timestamptz NOT NULL
);

-- Down Migration
DROP TABLE reporting_submission.export_packages;
DROP TABLE reporting_submission.export_requests;
DROP TRIGGER report_versions_immutable ON reporting_submission.report_versions;
DROP TABLE reporting_submission.report_versions;
DROP FUNCTION reporting_submission.reject_approved_mutation();
DROP TABLE reporting_submission.reports;
DROP SCHEMA reporting_submission;
