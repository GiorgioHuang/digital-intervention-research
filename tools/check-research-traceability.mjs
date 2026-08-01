#!/usr/bin/env node
/**
 * Validates research-traceability.yaml (RESEARCH_TRACEABILITY_MATRIX rules,
 * Master Prompt v1.2 + Doc 19 v1.3 §38):
 * - parseable, unique research_item ids, legal finding_status vocabulary;
 * - every entry has a question, >=1 trace_id and >=1 adr_id;
 * - referenced code paths must exist;
 * - `supported` is not a legal status at all in the conceptual phase —
 *   findings use the Doc 19 §38 types; anything labelled supported fails.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATUSES = new Set([
  'not_started',
  'in_analysis',
  'coherent',
  'conditionally_coherent',
  'underdetermined',
  'contradicted',
  'incomplete',
  'implementation_dependent',
  'source_dependent',
  'reserved_for_empirical_testing',
]);

const entries = parse(readFileSync(resolve(root, 'research-traceability.yaml'), 'utf8'));
const errors = [];
const seen = new Set();

if (!Array.isArray(entries)) {
  console.error('research-traceability.yaml must be a YAML list');
  process.exit(1);
}

for (const e of entries) {
  const id = e?.research_item ?? '<missing id>';
  if (seen.has(id)) errors.push(`${id}: duplicate research_item`);
  seen.add(id);

  if (!e.question) errors.push(`${id}: missing question`);
  if (e.finding_status === 'supported') {
    errors.push(`${id}: 'supported' is not a legal conceptual-phase status (Doc 19 §38)`);
  } else if (!STATUSES.has(e.finding_status)) {
    errors.push(`${id}: illegal finding_status '${e.finding_status}'`);
  }
  if (!Array.isArray(e.trace_ids) || e.trace_ids.length === 0) errors.push(`${id}: needs >=1 trace_id`);
  if (!Array.isArray(e.adr_ids) || e.adr_ids.length === 0) errors.push(`${id}: needs >=1 adr_id`);
  for (const p of e.code ?? []) {
    if (!existsSync(resolve(root, p))) errors.push(`${id}: code path missing: ${p}`);
  }
  for (const p of e.tests ?? []) {
    if (!existsSync(resolve(root, p))) errors.push(`${id}: test path missing: ${p}`);
  }
}

if (errors.length > 0) {
  console.error(`Research traceability check FAILED (${errors.length}):`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}
console.log(`Research traceability check passed: ${entries.length} entries.`);
