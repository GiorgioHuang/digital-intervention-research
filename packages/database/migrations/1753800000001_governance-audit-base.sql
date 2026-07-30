-- Up Migration
-- Append-only governance audit store (Doc 14 §61, ADR-051, owned by M15).
-- Audit rows are references + safe metadata only: reporter identity, message
-- text, private Life Story content and full AI prompts are referenced, never
-- copied (application layer must pass references).

CREATE SCHEMA IF NOT EXISTS governance_audit;

CREATE TABLE governance_audit.audit_events (
  id                       uuid PRIMARY KEY,
  actor_type               text NOT NULL CHECK (actor_type IN ('user', 'service-account', 'system')),
  actor_id                 text NOT NULL,
  active_role              text,
  auth_strength            text,
  action                   text NOT NULL,
  target_type              text NOT NULL,
  target_id                text NOT NULL,
  resource_version         bigint,
  purpose_code             text,
  organisation_id          text,
  research_project_id      text,
  participant_id           text,
  occurred_at              timestamptz NOT NULL,
  result                   text NOT NULL CHECK (result IN ('Allowed', 'Denied', 'Succeeded', 'Failed')),
  policy_decision          text,
  policy_decision_reason   text,
  policy_version           text,
  source                   text NOT NULL,
  correlation_id           text,
  causation_id             text,
  trace_id                 text,
  data_classification      text,
  recorded_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_target_idx
  ON governance_audit.audit_events (target_type, target_id, occurred_at);
CREATE INDEX audit_events_actor_idx
  ON governance_audit.audit_events (actor_id, occurred_at);
CREATE INDEX audit_events_occurred_idx
  ON governance_audit.audit_events (occurred_at);

-- Append-only enforcement: UPDATE and DELETE are rejected at the database
-- layer regardless of role (defence in depth on top of role grants).
CREATE OR REPLACE FUNCTION governance_audit.reject_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only (ADR-051): % not permitted', TG_OP
    USING ERRCODE = 'raise_exception';
END;
$$;

CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON governance_audit.audit_events
  FOR EACH ROW EXECUTE FUNCTION governance_audit.reject_audit_mutation();

-- Down Migration
DROP TRIGGER audit_events_append_only ON governance_audit.audit_events;
DROP FUNCTION governance_audit.reject_audit_mutation();
DROP TABLE governance_audit.audit_events;
DROP SCHEMA governance_audit;
