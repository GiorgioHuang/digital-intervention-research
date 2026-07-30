-- Up Migration
-- M03 Relationship, Consent and Permission (Doc 8 §2.3, Doc 16 consent_permission).
-- Consent decision history is append-only; the current-state row is a
-- projection maintained in the same transaction (authoritative result is
-- always derivable from the history).

CREATE SCHEMA IF NOT EXISTS consent_permission;

CREATE TABLE consent_permission.relationships (
  id                    text PRIMARY KEY,
  participant_id        text NOT NULL,
  related_actor_id      text NOT NULL,
  relationship_type     text NOT NULL CHECK (relationship_type IN (
                          'FamilyMember', 'Friend', 'InformalCaregiver', 'ProfessionalCaregiver',
                          'CommunityVolunteer', 'ResearchStaff', 'SubstituteDecisionMaker',
                          'SupportedDecisionMakingAssistant', 'OrganisationMember', 'OtherApproved')),
  relationship_state    text NOT NULL DEFAULT 'Proposed' CHECK (relationship_state IN (
                          'Proposed', 'PendingVerification', 'Active', 'Restricted',
                          'Suspended', 'Expired', 'Revoked', 'Rejected')),
  -- Dotted actions this relationship's permission scope covers (Doc 4 §relationship model).
  permitted_actions     text[] NOT NULL DEFAULT '{}',
  expires_at            timestamptz,
  proposed_by_actor_id  text NOT NULL,
  revoked_at            timestamptz,
  record_version        integer NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (participant_id <> related_actor_id)
);

CREATE INDEX relationships_participant_idx
  ON consent_permission.relationships (participant_id) WHERE relationship_state = 'Active';
CREATE INDEX relationships_actor_idx
  ON consent_permission.relationships (related_actor_id) WHERE relationship_state = 'Active';

-- Append-only consent decision history (Doc 16: append-only decision history;
-- withdrawal rows non-removable via application access).
CREATE TABLE consent_permission.consent_decisions (
  id                       text PRIMARY KEY,
  participant_id           text NOT NULL,
  research_project_id      text,
  consent_scope            text NOT NULL,
  consent_template_version text NOT NULL,
  decision                 text NOT NULL CHECK (decision IN (
                             'Granted', 'Declined', 'Restricted', 'Deferred',
                             'Withdrawn', 'Expired', 'Superseded', 'ReConsentRequired')),
  restrictions             text[] NOT NULL DEFAULT '{}',
  decided_by_actor_id      text NOT NULL,
  assistance_recorded      boolean NOT NULL DEFAULT false,
  effective_from           timestamptz NOT NULL,
  expires_at               timestamptz,
  recorded_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX consent_decisions_participant_scope_idx
  ON consent_permission.consent_decisions (participant_id, consent_scope, recorded_at);

CREATE OR REPLACE FUNCTION consent_permission.reject_consent_decision_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'consent_decisions is append-only: % not permitted', TG_OP;
END;
$$;
CREATE TRIGGER consent_decisions_append_only
  BEFORE UPDATE OR DELETE ON consent_permission.consent_decisions
  FOR EACH ROW EXECUTE FUNCTION consent_permission.reject_consent_decision_mutation();

-- Current consent state per (participant, project, scope): projection kept
-- in the same transaction as the history append.
CREATE TABLE consent_permission.consent_current (
  participant_id           text NOT NULL,
  research_project_id      text NOT NULL DEFAULT '',
  consent_scope            text NOT NULL,
  decision                 text NOT NULL,
  consent_template_version text NOT NULL,
  restrictions             text[] NOT NULL DEFAULT '{}',
  expires_at               timestamptz,
  last_decision_id         text NOT NULL REFERENCES consent_permission.consent_decisions (id),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (participant_id, research_project_id, consent_scope)
);

-- Every permission evaluation is recorded (Doc 4 §audit; step 12).
CREATE TABLE consent_permission.policy_decisions (
  id               text PRIMARY KEY,
  actor_id         text NOT NULL,
  action           text NOT NULL,
  resource_type    text NOT NULL,
  resource_id      text NOT NULL,
  outcome          text NOT NULL,
  reason           text NOT NULL,
  policy_version   text NOT NULL,
  purpose_code     text,
  organisation_id  text,
  research_project_id text,
  correlation_id   text,
  trace_id         text,
  evaluated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX policy_decisions_actor_idx ON consent_permission.policy_decisions (actor_id, evaluated_at);
CREATE INDEX policy_decisions_resource_idx
  ON consent_permission.policy_decisions (resource_type, resource_id, evaluated_at);

-- Down Migration
DROP TABLE consent_permission.policy_decisions;
DROP TABLE consent_permission.consent_current;
DROP TRIGGER consent_decisions_append_only ON consent_permission.consent_decisions;
DROP FUNCTION consent_permission.reject_consent_decision_mutation();
DROP TABLE consent_permission.consent_decisions;
DROP TABLE consent_permission.relationships;
DROP SCHEMA consent_permission;
