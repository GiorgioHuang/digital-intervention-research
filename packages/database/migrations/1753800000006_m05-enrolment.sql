-- Up Migration
-- M05 Recruitment, Screening and Enrolment (Doc 8 §2.7, Doc 16 enrolment).

CREATE SCHEMA IF NOT EXISTS enrolment;

CREATE TABLE enrolment.enrolments (
  id                   text PRIMARY KEY,
  participant_id       text NOT NULL,
  research_project_id  text NOT NULL,
  -- Enrolment binds to the exact evaluated ProtocolVersion (no silent migration).
  protocol_version_id  text NOT NULL,
  enrolment_state      text NOT NULL DEFAULT 'Invited' CHECK (enrolment_state IN
                         ('Invited', 'Screening', 'Eligible', 'Consenting', 'Enrolled',
                          'Active', 'Paused', 'Completed', 'Withdrawn', 'Discontinued')),
  invited_by_actor_id  text NOT NULL,
  withdrawn_at         timestamptz,
  record_version       integer NOT NULL DEFAULT 1,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- One live enrolment per (participant, project).
CREATE UNIQUE INDEX enrolments_live_unique
  ON enrolment.enrolments (participant_id, research_project_id)
  WHERE enrolment_state NOT IN ('Withdrawn', 'Discontinued', 'Completed');

-- Human EligibilityDecision (AI cannot decide; enforced in the command and
-- recorded here with the deciding human).
CREATE TABLE enrolment.eligibility_decisions (
  id                  text PRIMARY KEY,
  enrolment_id        text NOT NULL REFERENCES enrolment.enrolments (id),
  protocol_version_id text NOT NULL,
  decision            text NOT NULL CHECK (decision IN ('Eligible', 'Ineligible')),
  reason              text NOT NULL,
  decided_by_actor_id text NOT NULL,
  decided_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX eligibility_decisions_enrolment_idx ON enrolment.eligibility_decisions (enrolment_id);

CREATE TABLE enrolment.withdrawal_records (
  id                  text PRIMARY KEY,
  enrolment_id        text NOT NULL REFERENCES enrolment.enrolments (id),
  requested_by_actor_id text NOT NULL,
  reason_category     text,
  recorded_at         timestamptz NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE enrolment.withdrawal_records;
DROP TABLE enrolment.eligibility_decisions;
DROP TABLE enrolment.enrolments;
DROP SCHEMA enrolment;
