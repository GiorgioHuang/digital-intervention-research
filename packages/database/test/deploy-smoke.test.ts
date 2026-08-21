import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const DEPLOY_YML = join(fileURLToPath(new URL('../../../', import.meta.url)), '.github/workflows/deploy.yml');

/**
 * The workflow with its comments removed.
 *
 * Every assertion about deploy.yml reads this rather than the file as
 * written, and the first version of the concurrency check is why. It read
 * the file as written and passed with `cancel-in-progress` flipped to
 * `true` — because the comment above the setting contains the words
 * "`cancel-in-progress: false` is deliberate", and a sentence explaining a
 * setting satisfied the assertion about the setting. That is D-84 exactly:
 * a guard its own comment can satisfy has commented itself into
 * uselessness. The same trap is waiting for anything else asserted here,
 * because the reason for a control is always written next to it.
 */
const workflowWithoutComments = (): string =>
  readFileSync(DEPLOY_YML, 'utf8')
    .split('\n')
    .map((line) => (/^\s*#/.test(line) ? '' : line.replace(/\s#.*$/, '')))
    .join('\n');


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
 * **The repository is public** (since 2026-08-20). This was written when it
 * was about to be, as a hole that publication would open; it is open now,
 * and anyone can fork this repository today. The guard is not prophylactic
 * any more and must not be weakened on the reasoning that nobody has tried
 * — the whole point is that the first attempt would succeed silently.
 *
 * The guard is one `if:` expression,
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

/**
 * Only one deploy at a time.
 *
 * Two pushes a couple of minutes apart produce two CI runs, each firing its
 * own deploy — and on 2026-08-16 the two overlapped, after which a later
 * run died with `Another migration is already running`. node-pg-migrate's
 * lock was doing exactly its job; what was wrong was that two deploys were
 * asking.
 *
 * The migration failure is the visible half and the lesser one. The silent
 * half is worse: two `gcloud run deploy` calls carrying different commits
 * race, and whichever finishes last is the revision serving traffic, so the
 * deployed code can quietly be older than main with nothing red to say so.
 *
 * A `concurrency:` block is a few lines with no visible effect when it is
 * working, which makes it exactly the kind of thing a refactor drops
 * without anything going red — the same argument D-88 makes about the
 * `if:` guard above, and the reason both are asserted rather than trusted.
 */
describe('the deploy workflow runs one deploy at a time', () => {
  const workflow = workflowWithoutComments();

  it('declares a concurrency group at the workflow level', () => {
    // Workflow level, not job level: a job-level group would still let two
    // runs start and race, because the guard has to cover the whole
    // migrate-then-deploy sequence rather than one step of it.
    const beforeJobs = workflow.slice(0, workflow.indexOf('\njobs:'));
    expect(beforeJobs, 'no workflow-level concurrency group — two deploys can race').toMatch(
      /^concurrency:\s*$/m,
    );
    expect(beforeJobs).toMatch(/^\s+group:\s*\S+/m);
  });

  it('queues a superseded run rather than cancelling it', () => {
    /* Cancelling the run that holds the migration lock is how a lock gets
       left behind, and a half-applied migration is worse than a deploy that
       waits. The default for `cancel-in-progress` is false, but it is
       written out because the reason is not obvious from its absence — and
       somebody optimising CI time would otherwise set it to true and think
       it harmless. */
    expect(workflow.replace(/\s+/g, ' ')).toContain('cancel-in-progress: false');
  });
});

/**
 * The two values in this workflow that must never reach a log.
 *
 * `::add-mask::` is what keeps the Neon connection string and the Cloud Run
 * service URL out of the run's logs and its step summary. Nothing turned
 * red if either line were deleted — the deploy would still succeed, the
 * logs would simply start containing the secret, and a green tick would
 * report it as fine. That is the same shape as D-88's `if:`: a control
 * whose removal changes no behaviour and no appearance.
 *
 * The comment-stripped copy is used deliberately. The comments above both
 * lines explain the masking and contain the word `add-mask`, so asserting
 * against the raw file would pass with the masking gone (D-84).
 */
describe('the deploy workflow keeps secrets out of its own logs', () => {
  const stripped = workflowWithoutComments();

  it('masks the database connection string before it is used', () => {
    // Order matters: masking after the value has been echoed is too late,
    // so the mask must come before anything that could print it.
    const dburl = stripped.indexOf('DBURL=$(gcloud secrets versions access');
    expect(dburl, 'the migration step no longer reads the connection string this way').toBeGreaterThan(-1);
    const mask = stripped.indexOf('::add-mask::$DBURL', dburl);
    expect(mask, 'DATABASE_URL is read from Secret Manager but never masked').toBeGreaterThan(-1);
  });

  it('masks the service URL, and keeps it out of the step summary', () => {
    const url = stripped.indexOf('URL=$(gcloud run services describe');
    expect(url, 'the smoke step no longer resolves the service URL this way').toBeGreaterThan(-1);
    const mask = stripped.indexOf('::add-mask::$URL', url);
    expect(mask, 'the service URL is resolved but never masked — a public log would carry the deployment address').toBeGreaterThan(-1);

    // The summary is rendered on the run's page, so it is read more widely
    // than the logs are. It may say that the revision answered; it may not
    // say where.
    const summary = stripped
      .split('\n')
      .filter((line) => line.includes('GITHUB_STEP_SUMMARY'))
      .join('\n');
    expect(summary, 'nothing is written to the step summary any more').not.toBe('');
    expect(summary, 'the step summary would publish the deployment address').not.toMatch(/\$URL|\$\{\{\s*vars\./);
  });
});
