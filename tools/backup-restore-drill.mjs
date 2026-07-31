#!/usr/bin/env node
/**
 * Automated backup/restore drill (Doc 14 backup & recovery; Doc 18 §193).
 *
 *   1. pg_dump the source database (custom format).
 *   2. Restore into a FRESH drill database.
 *   3. Verify: per-table row counts across every application schema,
 *      plus structural invariants (constraint and trigger counts) and a
 *      behavioural probe — the audit append-only trigger must still fire
 *      in the RESTORED database.
 *   4. Append the drill record (append-only) to the SOURCE database.
 *
 * Honesty note: timings are evidence for THIS environment's drill only.
 * They never become production RPO/RTO claims — those values are
 * configuration pending approval (ADR-121).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';

const SOURCE_URL =
  process.env.DATABASE_URL ?? 'postgres://platform:platform_dev_only@localhost:5432/research_platform';
const DRILL_DB = process.env.DRILL_DATABASE_NAME ?? 'research_platform_drill';

const drillUrl = new URL(SOURCE_URL);
drillUrl.pathname = `/${DRILL_DB}`;
const adminUrl = new URL(SOURCE_URL);
adminUrl.pathname = '/postgres';

const APP_SCHEMAS_SQL = `
  SELECT table_schema, table_name
    FROM information_schema.tables
   WHERE table_type = 'BASE TABLE'
     AND table_schema NOT IN ('pg_catalog', 'information_schema')
   ORDER BY table_schema, table_name`;

async function tableCounts(client) {
  const tables = (await client.query(APP_SCHEMAS_SQL)).rows;
  const counts = new Map();
  for (const t of tables) {
    const res = await client.query(`SELECT count(*)::bigint AS n FROM "${t.table_schema}"."${t.table_name}"`);
    counts.set(`${t.table_schema}.${t.table_name}`, BigInt(res.rows[0].n));
  }
  return counts;
}

async function structuralCounts(client) {
  const constraints = await client.query(
    `SELECT count(*)::int AS n FROM pg_constraint c
       JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')`,
  );
  const triggers = await client.query(
    `SELECT count(*)::int AS n FROM pg_trigger t
       JOIN pg_class r ON r.oid = t.tgrelid
       JOIN pg_namespace n ON n.oid = r.relnamespace
      WHERE NOT t.tgisinternal AND n.nspname NOT IN ('pg_catalog', 'information_schema')`,
  );
  return { constraints: constraints.rows[0].n, triggers: triggers.rows[0].n };
}

async function main() {
  const startedAt = new Date();
  const workDir = mkdtempSync(join(tmpdir(), 'backup-drill-'));
  const dumpFile = join(workDir, 'drill.dump');
  const checks = [];
  let failure = null;
  let dumpMs = 0;
  let restoreMs = 0;
  let verifyMs = 0;
  let dumpBytes = 0;
  let tablesCompared = 0;
  let rowsSource = 0n;
  let rowsRestored = 0n;

  const source = new pg.Client({ connectionString: SOURCE_URL });
  await source.connect();
  try {
    // 1. Dump.
    let t = Date.now();
    execFileSync('pg_dump', ['--format=custom', '--no-owner', `--file=${dumpFile}`, SOURCE_URL], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    dumpMs = Date.now() - t;
    dumpBytes = statSync(dumpFile).size;

    // 2. Fresh drill database + restore.
    t = Date.now();
    const admin = new pg.Client({ connectionString: adminUrl.href });
    await admin.connect();
    await admin.query(`DROP DATABASE IF EXISTS ${DRILL_DB} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${DRILL_DB}`);
    await admin.end();
    execFileSync('pg_restore', ['--no-owner', `--dbname=${drillUrl.href}`, dumpFile], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    restoreMs = Date.now() - t;

    // 3. Verify.
    t = Date.now();
    const drill = new pg.Client({ connectionString: drillUrl.href });
    await drill.connect();

    const src = await tableCounts(source);
    const dst = await tableCounts(drill);
    tablesCompared = src.size;
    for (const [table, n] of src) {
      rowsSource += n;
      const restored = dst.get(table);
      rowsRestored += restored ?? 0n;
      if (restored === undefined) {
        failure = `table missing after restore: ${table}`;
      } else if (restored !== n) {
        failure = `row count mismatch in ${table}: source=${n} restored=${restored}`;
      }
    }
    checks.push({ check: 'per-table row counts equal', pass: failure === null, tables: tablesCompared });

    const srcStruct = await structuralCounts(source);
    const dstStruct = await structuralCounts(drill);
    const structOk = srcStruct.constraints === dstStruct.constraints && srcStruct.triggers === dstStruct.triggers;
    checks.push({ check: 'constraint and trigger counts equal', pass: structOk, source: srcStruct, restored: dstStruct });
    if (!structOk && failure === null) {
      failure = `structural mismatch: source=${JSON.stringify(srcStruct)} restored=${JSON.stringify(dstStruct)}`;
    }

    // Behavioural probe: append-only audit must still be enforced in the
    // RESTORED database — a backup that restores data but loses guarantees
    // is a failed backup.
    let appendOnlyHolds = false;
    try {
      await drill.query(`UPDATE governance_audit.audit_events SET action = 'tampered'`);
    } catch (err) {
      appendOnlyHolds = /append-only/.test(String(err));
    }
    checks.push({ check: 'audit append-only trigger fires in restored db', pass: appendOnlyHolds });
    if (!appendOnlyHolds && failure === null) failure = 'audit append-only trigger did not fire in restored db';

    await drill.end();
    verifyMs = Date.now() - t;
  } catch (err) {
    failure = failure ?? String(err);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }

  // 4. Append the drill record to the SOURCE database (append-only).
  const finishedAt = new Date();
  const outcome = failure === null ? 'Succeeded' : 'Failed';
  await source.query(
    `INSERT INTO governance_audit.backup_restore_drills
       (id, started_at, finished_at, dump_bytes, tables_compared, rows_source, rows_restored,
        invariant_checks, dump_ms, restore_ms, verify_ms, outcome, failure_detail)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      `bdr_${startedAt.getTime()}`,
      startedAt,
      finishedAt,
      dumpBytes,
      tablesCompared,
      rowsSource.toString(),
      rowsRestored.toString(),
      JSON.stringify(checks),
      dumpMs,
      restoreMs,
      verifyMs,
      outcome,
      failure,
    ],
  );
  await source.end();

  console.log(
    JSON.stringify(
      {
        outcome,
        tablesCompared,
        rowsSource: rowsSource.toString(),
        rowsRestored: rowsRestored.toString(),
        dumpBytes,
        dumpMs,
        restoreMs,
        verifyMs,
        checks,
        note: 'Drill-environment evidence only; production RPO/RTO values remain Pending External Approval (ADR-121).',
        ...(failure === null ? {} : { failure }),
      },
      null,
      2,
    ),
  );
  if (failure !== null) process.exit(1);
}

main().catch((err) => {
  console.error('Backup/restore drill failed to run:', err);
  process.exit(1);
});
