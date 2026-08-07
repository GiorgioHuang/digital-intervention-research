import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACTIONS_WITH_NO_CHECK, POLICY_V1, RELATIONSHIP_AUTHORISABLE_ACTIONS } from '../src/index.js';

const ROOT = join(process.cwd(), '..', '..');

/**
 * What the catalogue claims a role may do, against what any command will
 * actually check.
 *
 * A permission nothing checks grants nothing, so none of this is a way
 * in. It is a claim: this catalogue is the platform's statement of what
 * a role may do, read by whoever decides which role to give somebody and
 * by anyone auditing what a role could have done. Ten actions described
 * capabilities the platform does not have — a research approver who
 * could not approve a project, a moderator with a triage step nobody
 * built, a participant with an export command that was never written.
 *
 * The set is derived here rather than restated, and the assertion is
 * equality rather than containment, so it fails both ways: a new
 * unchecked action cannot appear quietly, and implementing one of the
 * listed ones fails until it is taken off the list.
 */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    if (e === 'node_modules' || e === 'dist' || e === 'test') return [];
    const p = join(dir, e);
    return statSync(p).isDirectory() ? sources(p) : p.endsWith('.ts') ? [p] : [];
  });
}

/** Comments name actions constantly; only live code counts as a use. */
function code(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

/**
 * Any declared action appearing as a string literal in the command or
 * route layer. Deliberately not "appears next to `action:`" — M18 passes
 * the action out of a helper that decides whether a message is being
 * written by its owner or by a supporter under a relationship, and a
 * narrower rule would have called `message.draft` unchecked.
 */
function actionsNamedInCode(): Set<string> {
  const declared = new Set(Object.keys(POLICY_V1.actionRequirements));
  const named = new Set<string>();
  for (const file of [...sources(join(ROOT, 'packages', 'modules')), ...sources(join(ROOT, 'apps', 'api', 'src'))]) {
    for (const m of code(file).matchAll(/'([a-z0-9][a-z0-9.-]*\.[a-z0-9-]+)'/g)) {
      if (declared.has(m[1]!)) named.add(m[1]!);
    }
  }
  return named;
}

describe('permissions the catalogue declares and nothing checks', () => {
  it('are exactly the ones written down, with a reason each', () => {
    const named = actionsNamedInCode();
    const unchecked = Object.keys(POLICY_V1.actionRequirements)
      .filter((a) => !named.has(a))
      .sort();
    expect(unchecked).toEqual(Object.keys(ACTIONS_WITH_NO_CHECK).sort());
    for (const [action, reason] of Object.entries(ACTIONS_WITH_NO_CHECK)) {
      expect(reason.length, `${action} needs a reason, not a placeholder`).toBeGreaterThan(20);
    }
  });

  /**
   * Every one of them is granted to a role. That is what makes them a
   * claim rather than dead configuration — if one were declared and
   * granted to nobody it would be inert in both directions.
   */
  it('are all granted to some role, which is what makes them a claim', () => {
    const granted = new Set(Object.values(POLICY_V1.rolePermissions).flat());
    for (const action of Object.keys(ACTIONS_WITH_NO_CHECK)) {
      expect(granted.has(action), `${action} is unchecked and granted to nobody — delete it instead`).toBe(true);
    }
  });

  /**
   * The other derived set in this catalogue, checked the same way: the
   * actions a Relationship can authorise are the ones the engine reads a
   * relationship for, and nothing else may be recorded on one (D-55).
   */
  it('the relationship-authorisable set is exactly what the engine consults a relationship for', () => {
    const fromRequirements = Object.entries(POLICY_V1.actionRequirements)
      .filter(([, r]) => r.requiresRelationship === true)
      .map(([a]) => a)
      .sort();
    expect([...RELATIONSHIP_AUTHORISABLE_ACTIONS]).toEqual(fromRequirements);
    expect(fromRequirements.length).toBeGreaterThan(0);
  });
});
