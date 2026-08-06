-- Up Migration
-- Somewhere to put the reason a person gave for reading the audit trail,
-- and what they asked it for.
--
-- Sixty-one call sites write to governance_audit.audit_events and nothing
-- has ever read one. The permission to read it, `audit.view`, has been
-- granted to three roles since the catalogue was written and is checked
-- by no code at all, so the entire accountability record of the platform
-- is write-only: append-only by trigger, unreadable by anyone.
--
-- The specification for the screen that reads it (Doc 15 §21, G7) says
-- two things this migration exists for. Looking at the audit is itself an
-- audited action - an audit trail whose readers leave no trace is the one
-- record a misuser has no reason to avoid. And the reason the reader
-- typed is recorded with the query, which is what makes asking for it
-- more than a formality.
--
-- D-6 ruled the reason field must not be mandatory precisely BECAUSE
-- nothing stored it: a required box whose contents are discarded is a
-- promise of accountability that the platform does not keep. That ruling
-- named its own condition - if the backend ever records the field,
-- re-evaluate. These two columns are that condition being met.
--
-- Both are nullable and both stay null for the sixty-one command writes,
-- which have no reader and no query. They are only ever populated by a
-- read of the audit trail itself.

ALTER TABLE governance_audit.audit_events
  ADD COLUMN access_reason text,
  -- What was asked for, so a later reader can tell a targeted look-up
  -- from a sweep of everything. Stored as given: these are filter values,
  -- not resource contents, and the audit store never holds contents.
  ADD COLUMN query_filters jsonb;

-- Down Migration
ALTER TABLE governance_audit.audit_events
  DROP COLUMN access_reason,
  DROP COLUMN query_filters;
