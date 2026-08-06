-- Up Migration
-- What happened after a safety event was confirmed.
--
-- A SafetyEvent was created with event_state defaulting to 'Open' and no
-- code path could ever change it, no query listed one, and no screen
-- showed one. The most serious record this platform holds - a human being
-- has confirmed that someone may be at risk - went into a table nobody
-- could read and nobody could act on. The triage screen told the reviewer
-- they had "converted this to a safety event", which reads as an
-- escalation to something that will be worked, and nothing worked it.
--
-- This table is the account of what people did about it. It is
-- append-only, as the design requires: a record written here cannot be
-- edited or deleted, and a correction is a further entry with the
-- original left standing. That is the same rule moderation decisions
-- already carry, and for the same reason - a safety record that can be
-- tidied up afterwards is not a record.
--
-- Both kinds of entry live here so the timeline is one thing rather than
-- two half-histories: an action somebody took, and a change to where the
-- event itself stands.

CREATE TABLE safety.safety_event_timeline (
  id                  text PRIMARY KEY,
  safety_event_id     text NOT NULL REFERENCES safety.safety_events (id),
  entry_type          text NOT NULL CHECK (entry_type IN ('Action', 'State')),
  -- For an Action: what was done, in the reviewer's words. For a State
  -- entry: the state the event moved to.
  label               text NOT NULL,
  -- Where that action stands. 'No Action Taken' is a real answer and is
  -- deliberately available: the design requires that an event with nothing
  -- recorded against it can be closed only by writing down that no action
  -- was needed and why, because a blank is not a judgement.
  action_state        text CHECK (action_state IN ('Not Started', 'In Progress', 'Completed', 'No Action Taken')),
  note                text NOT NULL,
  recorded_by_actor_id text NOT NULL,
  recorded_at         timestamptz NOT NULL DEFAULT now(),
  -- An Action entry says where it stands; a State entry does not.
  CHECK ((entry_type = 'Action') = (action_state IS NOT NULL))
);

CREATE INDEX safety_event_timeline_event
  ON safety.safety_event_timeline (safety_event_id, recorded_at);

CREATE OR REPLACE FUNCTION safety.reject_timeline_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'safety_event_timeline is append-only: % not permitted', TG_OP; END;
$$;
CREATE TRIGGER safety_event_timeline_append_only
  BEFORE UPDATE OR DELETE ON safety.safety_event_timeline
  FOR EACH ROW EXECUTE FUNCTION safety.reject_timeline_mutation();

-- Down Migration
DROP TRIGGER safety_event_timeline_append_only ON safety.safety_event_timeline;
DROP FUNCTION safety.reject_timeline_mutation();
DROP TABLE safety.safety_event_timeline;
