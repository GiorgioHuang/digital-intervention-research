-- Up Migration
-- M10 Evidence Workspace and Knowledge Integration (Doc 9, Doc 8 §2.12).

CREATE SCHEMA IF NOT EXISTS evidence;

-- Local reference to an external Knowledge Platform resource, with provenance.
CREATE TABLE evidence.knowledge_references (
  id                   text PRIMARY KEY,
  external_identifier  text NOT NULL,
  title                text NOT NULL,
  source_system        text NOT NULL,
  external_version     text,
  resolution_state     text NOT NULL DEFAULT 'Unresolved'
                       CHECK (resolution_state IN ('Unresolved', 'Resolved', 'Resolution Failed', 'Source Unavailable')),
  retrieved_at         timestamptz,
  provenance           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evidence.evidence_reviews (
  id                   text PRIMARY KEY,
  research_project_id  text NOT NULL,
  question             text NOT NULL,
  review_state         text NOT NULL DEFAULT 'Draft' CHECK (review_state IN
                         ('Draft', 'In Review', 'Approved', 'Returned for Revision', 'Superseded', 'Archived')),
  submitted_by_actor_id text,
  approved_by_actor_id  text,
  record_version       integer NOT NULL DEFAULT 1,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CHECK (approved_by_actor_id IS NULL OR approved_by_actor_id <> submitted_by_actor_id)
);

CREATE TABLE evidence.evidence_review_references (
  evidence_review_id     text NOT NULL REFERENCES evidence.evidence_reviews (id),
  knowledge_reference_id text NOT NULL REFERENCES evidence.knowledge_references (id),
  PRIMARY KEY (evidence_review_id, knowledge_reference_id)
);

-- EvidenceDecision: canonical outcome vocabulary is a DB constraint —
-- 'Approved'/'Rejected'/'Provisional' are NOT outcomes (Doc 9 §canonical).
CREATE TABLE evidence.evidence_decisions (
  id                   text PRIMARY KEY,
  evidence_review_id   text NOT NULL REFERENCES evidence.evidence_reviews (id),
  outcome              text NOT NULL CHECK (outcome IN
                         ('Support', 'Support with Conditions', 'Insufficient Evidence',
                          'Conflicting Evidence', 'Restrict', 'Do Not Proceed', 'Research Required')),
  rationale            text NOT NULL,
  approval_state       text NOT NULL DEFAULT 'Draft' CHECK (approval_state IN
                         ('Draft', 'In Review', 'Approved', 'Approved with Conditions', 'Rejected', 'Superseded', 'Withdrawn', 'Archived')),
  drafted_by_actor_id  text NOT NULL,
  approved_by_actor_id text,
  approved_at          timestamptz,
  record_version       integer NOT NULL DEFAULT 1,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CHECK (approved_by_actor_id IS NULL OR approved_by_actor_id <> drafted_by_actor_id)
);

-- EvidenceSnapshot: immutable entity (append-only via trigger).
CREATE TABLE evidence.evidence_snapshots (
  id                   text PRIMARY KEY,
  snapshot_type        text NOT NULL CHECK (snapshot_type IN
                         ('Evidence Review', 'Evidence Decision', 'Protocol Approval', 'Intervention Version',
                          'Measurement Selection', 'Safety Review', 'AI Configuration Evidence',
                          'Research Finding Context', 'External Submission Evidence')),
  evidence_review_id   text REFERENCES evidence.evidence_reviews (id),
  evidence_decision_id text REFERENCES evidence.evidence_decisions (id),
  content              jsonb NOT NULL,
  content_hash         text NOT NULL,
  created_by_actor_id  text NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION evidence.reject_snapshot_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'evidence_snapshots is immutable: % not permitted', TG_OP;
END;
$$;
CREATE TRIGGER evidence_snapshots_immutable
  BEFORE UPDATE OR DELETE ON evidence.evidence_snapshots
  FOR EACH ROW EXECUTE FUNCTION evidence.reject_snapshot_mutation();

-- Down Migration
DROP TRIGGER evidence_snapshots_immutable ON evidence.evidence_snapshots;
DROP FUNCTION evidence.reject_snapshot_mutation();
DROP TABLE evidence.evidence_snapshots;
DROP TABLE evidence.evidence_decisions;
DROP TABLE evidence.evidence_review_references;
DROP TABLE evidence.evidence_reviews;
DROP TABLE evidence.knowledge_references;
DROP SCHEMA evidence;
