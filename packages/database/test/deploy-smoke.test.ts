import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The deployment smoke test's access-token gate check.
 *
 * A deploy failed reporting that the gate was not enforcing — expected
 * 401, got 500 — on a commit that had changed only a frontend file and
 * documentation. The gate code was byte-identical to the previous deploy
 * that had passed the same check, the secret was attached, the revision
 * was serving all traffic, liveness and the web shell both answered 200,
 * and a re-run passed. The 500 came from an instance still starting,
 * where the middleware that answers 401 does not exist yet; the service
 * runs with no minimum instances, so that is reachable on any deploy.
 *
 * The defect was not that failure but that the check had no retry while
 * the liveness check above it retries six times. A check that fails for
 * a reason other than the thing it tests is worse than no check: it
 * teaches whoever is watching to press re-run, and that is how a genuine
 * gate failure gets waved through one day.
 *
 * What must not happen is the retry swallowing a real failure. A gate
 * that had failed open answers 200, 403 or 404 — stable, and not a 5xx —
 * and that has to fail at once rather than being given six more chances
 * to look transient.
 *
 * The loop is read out of the workflow rather than copied here, so this
 * cannot pass while the thing that actually deploys says something else.
 */
const WORKFLOW = fileURLToPath(new URL('../../../.github/workflows/deploy.yml', import.meta.url));

/** The gate loop exactly as the workflow will run it, with curl stubbed. */
function gateScript(): string {
  const yaml = readFileSync(WORKFLOW, 'utf8');
  const start = yaml.indexOf('          for i in 1 2 3 4 5 6; do\n            GATED=$(curl');
  expect(start, 'the gate retry loop is no longer in deploy.yml in the expected shape').toBeGreaterThan(-1);
  const end = yaml.indexOf('echo "ungated /v1: HTTP $GATED"', start);
  const loop = yaml
    .slice(start, end)
    .split('\n')
    .map((l) => l.replace(/^ {10}/, ''))
    .join('\n');
  // The assertion the workflow makes straight afterwards.
  return `${loop}\n[ "$GATED" = "401" ] || { echo "NOT_ENFORCING:$GATED"; exit 1; }\necho "ENFORCING"\n`;
}

/**
 * Runs the real loop against a scripted sequence of HTTP codes. `curl`
 * is shadowed by a stub earlier on PATH, so the loop itself is unmodified
 * — including its `--max-time` and header arguments.
 */
function runGate(codes: string[]): { ok: boolean; output: string; attempts: number } {
  const dir = mkdtempSync(join(tmpdir(), 'gate-'));
  writeFileSync(
    join(dir, 'curl'),
    `#!/bin/sh\nn=$(cat ${dir}/n 2>/dev/null || echo 0); n=$((n+1)); echo $n > ${dir}/n\n` +
      `echo "${codes.join(' ')}" | cut -d' ' -f$n\n`,
    { mode: 0o755 },
  );
  // sleep is stubbed to keep the suite fast; the loop's own timing is not
  // what is under test.
  writeFileSync(join(dir, 'sleep'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  const script = join(dir, 'run.sh');
  writeFileSync(script, gateScript());
  try {
    const out = execFileSync('bash', [script], {
      env: { ...process.env, PATH: `${dir}:${process.env['PATH'] ?? ''}`, URL: 'http://stub' },
      encoding: 'utf8',
    });
    return { ok: true, output: out, attempts: (out.match(/gate attempt/g) ?? []).length };
  } catch (e) {
    const err = e as { stdout?: string };
    const out = err.stdout ?? '';
    return { ok: false, output: out, attempts: (out.match(/gate attempt/g) ?? []).length };
  }
}

describe('the deploy smoke test’s access-token gate check', () => {
  it('passes when a cold instance answers 500 and then the gate answers 401', () => {
    const r = runGate(['500', '500', '401']);
    expect(r.ok, r.output).toBe(true);
    expect(r.output).toContain('ENFORCING');
    expect(r.attempts).toBe(2);
  });

  it('passes when the instance is unreachable and then the gate answers 401', () => {
    const r = runGate(['000', '401']);
    expect(r.ok, r.output).toBe(true);
    expect(r.attempts).toBe(1);
  });

  /**
   * The one that matters. A gate letting an ungated request through is
   * the failure this check exists for, and no amount of retrying may
   * turn it into a pass or even delay it.
   */
  it('fails immediately, without retrying, when the gate lets a request through', () => {
    for (const code of ['200', '403', '404']) {
      const r = runGate([code, '401', '401', '401', '401', '401']);
      expect(r.ok, `${code} should fail: ${r.output}`).toBe(false);
      expect(r.output).toContain(`NOT_ENFORCING:${code}`);
      expect(r.attempts, `${code} must not be retried`).toBe(0);
    }
  });

  it('still fails when the service answers 500 to every attempt', () => {
    const r = runGate(['500', '500', '500', '500', '500', '500']);
    expect(r.ok).toBe(false);
    expect(r.output).toContain('NOT_ENFORCING:500');
    expect(r.attempts).toBe(6);
  });
});

/**
 * The guard that keeps a fork from deploying to production.
 *
 * `deploy` is triggered by `workflow_run` after CI, which means it runs in
 * THIS repository's context — its secrets, its Workload Identity, its Cloud
 * Run service — while being started by a CI run anybody can cause. The
 * `branches: [main]` filter on the trigger reads as if it restricts that,
 * and does not: it matches the branch of the triggering run, and for a pull
 * request from a fork that is the fork's own branch name. Fork the repo,
 * push to a branch called `main`, open a pull request, let CI pass, and
 * this job would check out `workflow_run.head_sha` — the fork's commit —
 * and deploy it, holding the production database secret while it did.
 *
 * The repository is about to become public, which is what turns this from
 * a theoretical hole into an open door. The guard is one `if:` expression,
 * and an `if:` expression is the easiest thing in a workflow to lose in a
 * refactor: nothing fails, nothing looks different, and the door is open
 * again. Hence a test, and hence one that names each condition separately
 * rather than matching the whole line — so that dropping any single one of
 * them is a failure with the reason attached.
 */
describe('the deploy workflow only deploys this repository', () => {
  const workflow = readFileSync(
    join(fileURLToPath(new URL('../../../', import.meta.url)), '.github/workflows/deploy.yml'),
    'utf8',
  );

  it('requires the triggering run to have come from this repository, not a fork', () => {
    expect(
      workflow.replace(/\s+/g, ' '),
      'a fork could deploy to production without this',
    ).toContain('github.event.workflow_run.head_repository.full_name == github.repository');
  });

  it('requires a push rather than a pull request', () => {
    expect(workflow.replace(/\s+/g, ' ')).toContain("github.event.workflow_run.event == 'push'");
  });

  it('still requires main, and still requires CI to have passed', () => {
    const flat = workflow.replace(/\s+/g, ' ');
    expect(flat).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(flat).toContain("github.event.workflow_run.conclusion == 'success'");
  });

  it('deploys the commit CI verified, which is why the guard has to hold', () => {
    /* If this ever stops being head_sha the guard matters less — and if the
       guard is ever dropped, this is the line that makes it exploitable.
       They belong in one test so that neither is changed alone. */
    expect(workflow).toContain('ref: ${{ github.event.workflow_run.head_sha || github.sha }}');
  });
});
