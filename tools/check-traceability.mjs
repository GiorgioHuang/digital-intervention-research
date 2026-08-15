#!/usr/bin/env node
/**
 * Validates traceability.yaml (TRACEABILITY_IMPLEMENTATION_MATRIX rules):
 * - parseable, unique implementation IDs, legal status vocabulary;
 * - every entry links >=1 trace_id and >=1 adr_id and an owning module;
 * - `scaffolded` requires the referenced code paths to exist;
 * - `implemented`/`verified` require code AND test paths to exist.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATUSES = new Set([
  'not_started',
  'scaffolded',
  'implemented',
  'verified',
  'blocked',
  'deferred',
  'pending_external_approval',
]);

const entries = parse(readFileSync(resolve(root, 'traceability.yaml'), 'utf8'));
const errors = [];
const seen = new Set();

if (!Array.isArray(entries)) {
  console.error('traceability.yaml must be a YAML list');
  process.exit(1);
}

for (const e of entries) {
  const id = e?.implementation_id ?? '<missing id>';
  if (seen.has(id)) errors.push(`${id}: duplicate implementation_id`);
  seen.add(id);

  if (!e.module) errors.push(`${id}: missing module`);
  if (!STATUSES.has(e.status)) errors.push(`${id}: illegal status '${e.status}'`);
  if (!Array.isArray(e.trace_ids) || e.trace_ids.length === 0) errors.push(`${id}: needs >=1 trace_id`);
  if (!Array.isArray(e.adr_ids) || e.adr_ids.length === 0) errors.push(`${id}: needs >=1 adr_id`);

  const requireCode = ['scaffolded', 'implemented', 'verified'].includes(e.status);
  const requireTests = ['implemented', 'verified'].includes(e.status);
  if (requireCode) {
    for (const p of e.code ?? []) {
      if (!existsSync(resolve(root, p))) errors.push(`${id}: code path missing: ${p}`);
    }
    if (!e.code?.length) errors.push(`${id}: status ${e.status} requires code paths`);
  }
  if (requireTests) {
    for (const p of e.tests ?? []) {
      if (!existsSync(resolve(root, p))) errors.push(`${id}: test path missing: ${p}`);
    }
    if (!e.tests?.length) errors.push(`${id}: status ${e.status} requires test evidence`);
  }
}

/*
 * A traceability.yaml anywhere but the repository root.
 *
 * This checker reads exactly one file, resolved from the root, so a stray
 * copy is not merely unchecked — it is invisible. Appending an entry from
 * a subdirectory (`cd packages/database && cat >> traceability.yaml`)
 * creates one, the entry is lost, and the check reports success, because
 * everything it was asked to look at is fine. That happened twice in one
 * day, and both times the green tick is what made it hard to notice.
 *
 * A check that cannot see the thing that went wrong should at least say
 * that the thing exists.
 */
function straySearch(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) straySearch(full, found);
    else if (entry.name === 'traceability.yaml' && full !== resolve(root, 'traceability.yaml')) {
      found.push(full.slice(root.length + 1));
    }
  }
  return found;
}
for (const stray of straySearch(root)) {
  errors.push(`traceability.yaml outside the repository root, so its entries are never checked: ${stray}`);
}

if (errors.length > 0) {
  console.error(`Traceability check FAILED (${errors.length} problem(s)):`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}
console.log(`Traceability check passed: ${entries.length} entries.`);
