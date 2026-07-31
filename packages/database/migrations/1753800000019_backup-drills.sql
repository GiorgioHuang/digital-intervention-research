-- Up Migration
-- Backup/restore drill records (Doc 14 backup & recovery; Doc 18 §193
-- readiness gate). Every automated drill leaves an append-only record of
-- what was dumped, what was restored, what was verified and how long it
-- took. Drill evidence is environment-specific — it never becomes a
-- production RPO/RTO claim by itself (ADR-121 values Pending External
-- Approval).

CREATE TABLE governance_audit.backup_restore_drills (
  id               text PRIMARY KEY,
  started_at       timestamptz NOT NULL,
  finished_at      timestamptz NOT NULL,
  dump_bytes       bigint NOT NULL,
  tables_compared  integer NOT NULL,
  rows_source      bigint NOT NULL,
  rows_restored    bigint NOT NULL,
  invariant_checks jsonb NOT NULL,
  dump_ms          integer NOT NULL,
  restore_ms       integer NOT NULL,
  verify_ms        integer NOT NULL,
  outcome          text NOT NULL CHECK (outcome IN ('Succeeded', 'Failed')),
  failure_detail   text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK ((outcome = 'Failed') = (failure_detail IS NOT NULL))
);

CREATE OR REPLACE FUNCTION governance_audit.reject_drill_mutation()
RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'backup_restore_drills is append-only: % not permitted', TG_OP; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER backup_restore_drills_append_only
  BEFORE UPDATE OR DELETE ON governance_audit.backup_restore_drills
  FOR EACH ROW EXECUTE FUNCTION governance_audit.reject_drill_mutation();

-- Down Migration
DROP TRIGGER backup_restore_drills_append_only ON governance_audit.backup_restore_drills;
DROP TABLE governance_audit.backup_restore_drills;
DROP FUNCTION governance_audit.reject_drill_mutation();
