-- Up Migration
-- M18 part 1: Block, Report, Moderation, governed Community (Doc 8 §2.5).
-- Build-order constraint (Doc 18 §174): Block + Report + human moderation
-- exist BEFORE any community surface is enabled.

-- Moderator is a platform role (Doc 20 Moderator workspace; Doc 14 MFA list).
ALTER TABLE identity_org.role_assignments DROP CONSTRAINT role_assignments_role_check;
ALTER TABLE identity_org.role_assignments ADD CONSTRAINT role_assignments_role_check CHECK (role IN (
  'Participant', 'Supporter', 'InformalCaregiver', 'ProfessionalCaregiver',
  'ResearchCoordinator', 'Researcher', 'DataAnalyst', 'ResearchApprover',
  'EvidenceReviewer', 'SafetyReviewer', 'PrivacyReviewer',
  'OrganisationAdministrator', 'SystemAdministrator', 'Moderator'));

CREATE SCHEMA IF NOT EXISTS community_social;

-- Directional Block; one active block per (blocker, blocked) pair.
CREATE TABLE community_social.block_records (
  id                text PRIMARY KEY,
  blocker_actor_id  text NOT NULL,
  blocked_actor_id  text NOT NULL,
  block_state       text NOT NULL DEFAULT 'Active' CHECK (block_state IN ('Active', 'Revoked')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at        timestamptz,
  record_version    integer NOT NULL DEFAULT 1,
  CHECK (blocker_actor_id <> blocked_actor_id)
);
CREATE UNIQUE INDEX block_records_active_unique
  ON community_social.block_records (blocker_actor_id, blocked_actor_id) WHERE block_state = 'Active';
CREATE INDEX block_records_blocked_idx
  ON community_social.block_records (blocked_actor_id) WHERE block_state = 'Active';

-- Reports: reporter identity is Moderation-Restricted — stored here, never
-- copied into events, payloads or moderator-visible defaults (Doc 14).
CREATE TABLE community_social.user_reports (
  id                  text PRIMARY KEY,
  reporter_actor_id   text NOT NULL,
  reported_actor_id   text NOT NULL,
  reported_content_id text,
  category            text NOT NULL,
  description         text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE community_social.moderation_cases (
  id             text PRIMARY KEY,
  user_report_id text REFERENCES community_social.user_reports (id),
  subject_actor_id text NOT NULL,
  case_state     text NOT NULL DEFAULT 'Reported' CHECK (case_state IN
                   ('Reported', 'Awaiting Triage', 'In Review', 'Awaiting Information', 'Action Required',
                    'Actioned', 'Dismissed', 'Appealed', 'Resolved', 'Closed', 'Reopened')),
  record_version integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Human, immutable moderation decisions.
CREATE TABLE community_social.moderation_decisions (
  id                 text PRIMARY KEY,
  moderation_case_id text NOT NULL REFERENCES community_social.moderation_cases (id),
  decision           text NOT NULL CHECK (decision IN
                       ('Dismiss', 'Warn', 'Restrict', 'Hide', 'Remove', 'Suspend', 'Disconnect', 'Ban', 'Restore', 'Escalate')),
  reason             text NOT NULL,
  decided_by_actor_id text NOT NULL,
  decided_at         timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION community_social.reject_decision_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'moderation_decisions is immutable: % not permitted', TG_OP; END;
$$;
CREATE TRIGGER moderation_decisions_immutable
  BEFORE UPDATE OR DELETE ON community_social.moderation_decisions
  FOR EACH ROW EXECUTE FUNCTION community_social.reject_decision_mutation();

CREATE TABLE community_social.community_spaces (
  id             text PRIMARY KEY,
  name           text NOT NULL,
  space_state    text NOT NULL DEFAULT 'Draft' CHECK (space_state IN ('Draft', 'Active', 'Suspended', 'Archived')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE community_social.community_rule_versions (
  id             text PRIMARY KEY,
  space_id       text NOT NULL REFERENCES community_social.community_spaces (id),
  version_number integer NOT NULL,
  rules_text     text NOT NULL,
  published_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, version_number)
);

CREATE TABLE community_social.community_memberships (
  id               text PRIMARY KEY,
  space_id         text NOT NULL REFERENCES community_social.community_spaces (id),
  participant_id   text NOT NULL,
  rule_version_id  text NOT NULL REFERENCES community_social.community_rule_versions (id),
  membership_state text NOT NULL DEFAULT 'Active' CHECK (membership_state IN ('Active', 'Suspended', 'Ended')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX community_memberships_active_unique
  ON community_social.community_memberships (space_id, participant_id) WHERE membership_state = 'Active';

CREATE TABLE community_social.social_posts (
  id             text PRIMARY KEY,
  space_id       text NOT NULL REFERENCES community_social.community_spaces (id),
  author_participant_id text NOT NULL,
  content_text   text NOT NULL,
  post_state     text NOT NULL DEFAULT 'Draft' CHECK (post_state IN
                   ('Draft', 'Published', 'Hidden', 'Restricted', 'Removed', 'Deleted', 'Archived', 'Restored', 'Withdrawn')),
  published_at   timestamptz,
  record_version integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE community_social.social_posts;
DROP TABLE community_social.community_memberships;
DROP TABLE community_social.community_rule_versions;
DROP TABLE community_social.community_spaces;
DROP TRIGGER moderation_decisions_immutable ON community_social.moderation_decisions;
DROP FUNCTION community_social.reject_decision_mutation();
DROP TABLE community_social.moderation_decisions;
DROP TABLE community_social.moderation_cases;
DROP TABLE community_social.user_reports;
DROP TABLE community_social.block_records;
DROP SCHEMA community_social;
ALTER TABLE identity_org.role_assignments DROP CONSTRAINT role_assignments_role_check;
ALTER TABLE identity_org.role_assignments ADD CONSTRAINT role_assignments_role_check CHECK (role IN (
  'Participant', 'Supporter', 'InformalCaregiver', 'ProfessionalCaregiver',
  'ResearchCoordinator', 'Researcher', 'DataAnalyst', 'ResearchApprover',
  'EvidenceReviewer', 'SafetyReviewer', 'PrivacyReviewer',
  'OrganisationAdministrator', 'SystemAdministrator'));
