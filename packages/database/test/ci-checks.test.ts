import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The repository-level checks must actually be wired into CI.
 *
 * Each of these is a script that exits non-zero on a real problem, and
 * each is worth exactly as much as its presence in the workflow. Deleting
 * a `run:` line removes the check and turns nothing red — the build goes
 * green faster, which is what makes it an attractive thing to delete. It
 * is the same shape as the deploy workflow's fork `if:` (D-88): a control
 * whose removal changes no visible behaviour.
 *
 * This is deliberately about wiring, not about behaviour. Whether
 * `docs:check` finds anything is its own business; whether CI ever asks
 * it is this test's.
 */
const ROOT = join(fileURLToPath(new URL('../../../', import.meta.url)));

/** Comments stripped first: every one of these strings appears in a comment
 *  explaining the step it guards, so asserting against the file as written
 *  would pass with the step deleted (D-84). */
const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8')
  .split('\n')
  .map((line) => (/^\s*#/.test(line) ? '' : line.replace(/\s#.*$/, '')))
  .join('\n');

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

describe('CI runs the repository-level checks', () => {
  const CHECKS = [
    ['traceability:check', 'an entry marked implemented could point at files that do not exist'],
    ['traceability:research', 'the research matrix could drift from the code without anything saying so'],
    ['docs:check', 'a document could point at a file that was never written'],
  ] as const;

  for (const [script, consequence] of CHECKS) {
    it(`runs pnpm ${script}`, () => {
      expect(pkg.scripts[script], `package.json has no ${script} script`).toBeTruthy();
      expect(ci, `CI does not run ${script} — ${consequence}`).toContain(`pnpm ${script}`);
    });
  }

  it('runs them in the job that gates the deploy', () => {
    // deploy.yml triggers on this workflow completing successfully, so a
    // check that runs in some other workflow would not hold the door.
    const buildAndTest = ci.slice(ci.indexOf('build-and-test:'));
    expect(buildAndTest, 'the build-and-test job is gone or renamed').not.toBe('');
    for (const [script] of CHECKS) {
      expect(buildAndTest, `${script} runs outside build-and-test`).toContain(`pnpm ${script}`);
    }
  });
});
