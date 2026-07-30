-- Up Migration
-- M09 Safety (SafetySignal != SafetyEvent, ADR-039) + M11 AI records.

CREATE SCHEMA IF NOT EXISTS safety;

CREATE TABLE safety.safety_signals (
  id            text PRIMARY KEY,
  source_type   text NOT NULL CHECK (source_type IN
                  ('Participant', 'Supporter', 'Staff', 'Assessment', 'AI', 'Rule', 'Integration')),
  raised_by_actor_id text NOT NULL,
  category      text NOT NULL,
  severity      text NOT NULL CHECK (severity IN ('Low', 'Moderate', 'High', 'Critical')),
  description   text NOT NULL,
  signal_state  text NOT NULL DEFAULT 'Recorded' CHECK (signal_state IN
                  ('Recorded', 'Awaiting Triage', 'In Review', 'Escalated',
                   'Converted to Safety Event', 'Closed as Not a Safety Event')),
  triage_reason text,
  triaged_by_actor_id text,
  record_version integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- SafetyEvent exists ONLY after human-confirmed conversion (ADR-039).
CREATE TABLE safety.safety_events (
  id                  text PRIMARY KEY,
  safety_signal_id    text NOT NULL UNIQUE REFERENCES safety.safety_signals (id),
  event_state         text NOT NULL DEFAULT 'Open' CHECK (event_state IN
                        ('Open', 'In Review', 'Action Required', 'Monitoring', 'Resolved', 'Closed', 'Reopened')),
  confirmed_by_actor_id text NOT NULL,
  record_version      integer NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE SCHEMA IF NOT EXISTS ai_companion;

CREATE TABLE ai_companion.ai_tool_invocations (
  id             text PRIMARY KEY,
  tool_id        text NOT NULL,
  action_level   integer NOT NULL CHECK (action_level BETWEEN 0 AND 4),
  invoked_for_actor_id text NOT NULL,
  outcome        text NOT NULL CHECK (outcome IN ('Executed', 'Refused', 'Failed')),
  refusal_reason text,
  model_alias    text,
  invoked_at     timestamptz NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE ai_companion.ai_tool_invocations;
DROP SCHEMA ai_companion;
DROP TABLE safety.safety_events;
DROP TABLE safety.safety_signals;
DROP SCHEMA safety;
