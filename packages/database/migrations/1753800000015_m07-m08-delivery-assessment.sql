-- Up Migration
-- M07 Intervention Delivery + M08 Assessment (minimal Pilot slice).

CREATE SCHEMA IF NOT EXISTS intervention_delivery;

CREATE TABLE intervention_delivery.intervention_sessions (
  id                            text PRIMARY KEY,
  enrolment_id                  text NOT NULL,
  intervention_configuration_id text NOT NULL,
  session_state                 text NOT NULL DEFAULT 'Completed'
                                CHECK (session_state IN ('Scheduled', 'Started', 'Completed', 'Interrupted')),
  -- Canonical exposure states (Doc 2/Doc 8): actual, not intended, exposure.
  exposure_state                text NOT NULL CHECK (exposure_state IN
                                  ('Offered', 'Viewed', 'Started', 'Partially Received', 'Completed',
                                   'Skipped', 'Declined', 'Failed', 'Interrupted')),
  delivered_by_actor_id         text NOT NULL,
  occurred_at                   timestamptz NOT NULL,
  created_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE SCHEMA IF NOT EXISTS assessment_outcome;

CREATE TABLE assessment_outcome.assessment_records (
  id                 text PRIMARY KEY,
  enrolment_id       text NOT NULL,
  instrument         text NOT NULL,
  instrument_version text NOT NULL,
  record_state       text NOT NULL CHECK (record_state IN
                       ('Scheduled', 'Available', 'In Progress', 'Completed', 'Partially Completed',
                        'Declined', 'Expired', 'Invalidated', 'Cancelled')),
  responses          jsonb,
  -- Typed missingness (Doc 19 §missingness): never silent.
  missingness_reason text CHECK (missingness_reason IS NULL OR missingness_reason IN
                       ('Not Collected', 'Participant Declined', 'Participant Unable', 'Technical Failure',
                        'Missed Visit', 'Not Applicable', 'Lost to Follow-Up', 'Withdrawn', 'Unknown')),
  recorded_by_actor_id text NOT NULL,
  occurred_at        timestamptz NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  -- Completed implies responses; declined/missing implies a typed reason.
  CHECK (record_state <> 'Completed' OR responses IS NOT NULL),
  CHECK (record_state NOT IN ('Declined', 'Expired', 'Invalidated') OR missingness_reason IS NOT NULL)
);

-- Down Migration
DROP TABLE assessment_outcome.assessment_records;
DROP SCHEMA assessment_outcome;
DROP TABLE intervention_delivery.intervention_sessions;
DROP SCHEMA intervention_delivery;
