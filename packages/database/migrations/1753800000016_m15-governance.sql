-- Up Migration
-- M15 Governance: ApprovalRecord bound to one exact artefact version with
-- separation of duties (Doc 16 §38, ADR-051), GovernanceHold, and
-- break-glass records that always carry reason/scope/expiry and a
-- mandatory retrospective review (Doc 16 §38.5).

CREATE TABLE governance_audit.approval_records (
  id                    text PRIMARY KEY,
  -- One exact artefact type, ID and version (Doc 16 §38.1).
  artefact_type         text NOT NULL,
  artefact_id           text NOT NULL,
  artefact_version      integer NOT NULL,
  requested_by_actor_id text NOT NULL,
  decided_by_actor_id   text,
  approval_state        text NOT NULL DEFAULT 'Requested' CHECK (approval_state IN
                          ('Requested', 'Approved', 'Rejected', 'Withdrawn')),
  decision_reason       text,
  -- Reviewer authority evidence (Doc 16 §38.2).
  decision_auth_strength text CHECK (decision_auth_strength IS NULL OR decision_auth_strength IN
                          ('password', 'step-up', 'mfa')),
  record_version        integer NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- A decision always names its decider; separation of duties (ADR-051).
  CHECK ((approval_state IN ('Approved', 'Rejected')) = (decided_by_actor_id IS NOT NULL)),
  CHECK (decided_by_actor_id IS NULL OR decided_by_actor_id <> requested_by_actor_id)
);
CREATE INDEX approval_records_artefact
  ON governance_audit.approval_records (artefact_type, artefact_id, artefact_version);

-- Append-only state history.
CREATE TABLE governance_audit.approval_state_history (
  id                 text PRIMARY KEY,
  approval_record_id text NOT NULL REFERENCES governance_audit.approval_records (id),
  from_state         text NOT NULL,
  to_state           text NOT NULL,
  actor_id           text NOT NULL,
  occurred_at        timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION governance_audit.reject_history_mutation()
RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'approval_state_history is append-only: % not permitted', TG_OP; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER approval_state_history_append_only
  BEFORE UPDATE OR DELETE ON governance_audit.approval_state_history
  FOR EACH ROW EXECUTE FUNCTION governance_audit.reject_history_mutation();

CREATE TABLE governance_audit.governance_holds (
  id                 text PRIMARY KEY,
  artefact_type      text NOT NULL,
  artefact_id        text NOT NULL,
  reason             text NOT NULL,
  hold_state         text NOT NULL DEFAULT 'Active' CHECK (hold_state IN ('Active', 'Lifted')),
  placed_by_actor_id text NOT NULL,
  lifted_by_actor_id text,
  lift_reason        text,
  record_version     integer NOT NULL DEFAULT 1,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK ((hold_state = 'Lifted') = (lifted_by_actor_id IS NOT NULL))
);
CREATE INDEX governance_holds_artefact
  ON governance_audit.governance_holds (artefact_type, artefact_id) WHERE hold_state = 'Active';

CREATE TABLE governance_audit.break_glass_records (
  id                   text PRIMARY KEY,
  executed_by_actor_id text NOT NULL,
  reason               text NOT NULL,
  scope                text NOT NULL,
  expires_at           timestamptz NOT NULL,
  review_state         text NOT NULL DEFAULT 'Pending Review' CHECK (review_state IN
                         ('Pending Review', 'Reviewed')),
  reviewed_by_actor_id text,
  review_outcome       text CHECK (review_outcome IS NULL OR review_outcome IN
                         ('Justified', 'Not Justified', 'Needs Follow-Up')),
  reviewed_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  -- Review is mandatory and never by the executor (Doc 16 §38.5).
  CHECK ((review_state = 'Reviewed') = (reviewed_by_actor_id IS NOT NULL)),
  CHECK ((review_state = 'Reviewed') = (review_outcome IS NOT NULL)),
  CHECK (reviewed_by_actor_id IS NULL OR reviewed_by_actor_id <> executed_by_actor_id)
);

-- Down Migration
DROP TABLE governance_audit.break_glass_records;
DROP TABLE governance_audit.governance_holds;
DROP TRIGGER approval_state_history_append_only ON governance_audit.approval_state_history;
DROP TABLE governance_audit.approval_state_history;
DROP FUNCTION governance_audit.reject_history_mutation();
DROP TABLE governance_audit.approval_records;
