import { describe, expect, it } from 'vitest';
import { relationshipInForce, relationshipStateNow } from '../src/index.js';

const now = new Date('2026-09-02T12:00:00Z');
const at = (iso: string) => new Date(iso);

/**
 * A relationship that ran out, described when somebody asks rather than
 * when a sweep gets to it — and there is no sweep.
 */
describe('the state a relationship is really in', () => {
  it('reads Expired once the expiry has passed', () => {
    expect(relationshipStateNow('Active', at('2026-08-01T00:00:00Z'), now)).toBe('Expired');
    expect(relationshipInForce('Active', at('2026-08-01T00:00:00Z'), now)).toBe(false);
  });

  it('leaves an unexpired one alone', () => {
    expect(relationshipStateNow('Active', at('2027-01-01T00:00:00Z'), now)).toBe('Active');
    expect(relationshipStateNow('Active', null, now)).toBe('Active');
    expect(relationshipInForce('Active', null, now)).toBe(true);
  });

  /**
   * The boundary, matching the sweep's own `<=`: an expiry that has
   * arrived has passed. A relationship that ends at noon does not
   * authorise anything at noon.
   */
  it('treats an expiry that has just arrived as passed', () => {
    expect(relationshipStateNow('Active', at('2026-09-02T12:00:00Z'), now)).toBe('Expired');
    expect(relationshipStateNow('Active', at('2026-09-02T12:00:00.001Z'), now)).toBe('Active');
  });

  /**
   * It only ever narrows. What somebody did deliberately is a better
   * description than what time did afterwards — being told a
   * relationship "expired" when it was in fact revoked would hide the
   * decision behind an accident.
   */
  it('never rewrites a state somebody set on purpose', () => {
    for (const state of ['Proposed', 'PendingVerification', 'Restricted', 'Suspended', 'Revoked', 'Rejected', 'Expired']) {
      expect(relationshipStateNow(state, at('2026-08-01T00:00:00Z'), now), `${state} was rewritten`).toBe(state);
      expect(relationshipInForce(state, null, now), `${state} was treated as in force`).toBe(false);
    }
  });
});

/**
 * The rule has to be applied by everything that describes a relationship,
 * and it is one line to forget.
 *
 * This scans the module's own sources rather than trusting review. The
 * permission repository is exempt and named: it hands raw rows to the
 * policy engine, which compares the expiry against the clock itself —
 * narrowing the state before it got there would hide 'PendingVerification'
 * from the engine, which treats that case differently from a plain
 * refusal.
 */
describe('every reader that describes a relationship applies the rule', () => {
  it('never passes the stored state straight through', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const root = resolve(process.cwd(), 'src');
    const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.ts'));
    expect(files.length, 'no sources found to scan').toBeGreaterThan(2);

    const EXEMPT = ['infrastructure/repository.ts', 'application/sweeps.ts', 'application/in-force.ts'];
    const offenders: string[] = [];
    for (const file of files) {
      if (EXEMPT.some((e) => file.replace(/\\/g, '/').endsWith(e))) continue;
      const text = readFileSync(resolve(root, file), 'utf8');
      // A row's state being read out and handed on without the rule.
      if (/relationship_state\s+as\s+string/.test(text) && !text.includes('relationshipStateNow')) {
        offenders.push(file);
      }
    }
    expect(offenders, 'a reader describes a relationship by its stored state alone').toEqual([]);
  });
});
