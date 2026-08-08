import { describe, expect, it } from 'vitest';
import { surfaceFor } from '../src/surface.js';

const STAFF = ['admin.example.org', 'staff.example.org'];

/**
 * Which surface an address serves — and what that separation is not.
 *
 * The workspaces were chosen by a button on the sign-in screen, so a
 * participant opening the platform was shown two doors that were not
 * theirs. They granted nothing, because the permission engine decides
 * every data path on the server, but offering somebody else's workspace
 * to an older adult is not neutral.
 *
 * These pin the matching rule. What they deliberately do not pin is any
 * notion of protection: both hostnames are one deployment behind one
 * shared token, and identity is still whatever `x-actor-id` says
 * (ADR-104). A test asserting that staff work is unreachable from the
 * participant address would be asserting something untrue.
 */
describe('which surface an address serves', () => {
  it('serves the staff workspace only on a configured staff address', () => {
    expect(surfaceFor('admin.example.org', STAFF)).toBe('staff');
    expect(surfaceFor('staff.example.org', STAFF)).toBe('staff');
  });

  it('serves the participant workspace everywhere else', () => {
    expect(surfaceFor('example.org', STAFF)).toBe('participant');
    expect(surfaceFor('www.example.org', STAFF)).toBe('participant');
  });

  /**
   * Whole hostname, never a prefix or a suffix. A loose match would put
   * the staff entrance on an address nobody configured — including one
   * an outsider controls.
   */
  it('matches the whole hostname and nothing that merely contains it', () => {
    for (const near of [
      'admin.example.org.attacker.test',
      'notadmin.example.org',
      'admin.example.org.evil',
      'admin.example.orgx',
    ]) {
      expect(surfaceFor(near, STAFF), near).toBe('participant');
    }
  });

  it('ignores case and stray spacing, which a host header can carry', () => {
    expect(surfaceFor('ADMIN.Example.ORG', STAFF)).toBe('staff');
    expect(surfaceFor('  admin.example.org ', STAFF)).toBe('staff');
  });

  /**
   * With nothing configured the app is one address with both doors,
   * which is what local development and this suite run. Failing closed
   * to "participant" would make the staff workspace unreachable in
   * development; failing open to "staff" would be worse. Saying which
   * mode it is in lets the shell decide honestly.
   */
  it('says it is a single address when no staff address is configured', () => {
    expect(surfaceFor('localhost', [])).toBe('single-host');
    expect(surfaceFor('anything.at.all', [])).toBe('single-host');
  });

  /**
   * The deploy is what actually sets this, and it writes Vite's env file
   * rather than passing a build argument, because `gcloud run deploy
   * --source .` hands Cloud Build the source and takes no --build-arg.
   * Read out of the workflow so this cannot pass while the thing that
   * deploys does something else.
   */
  it('the deploy writes the addresses where the build will read them', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const yaml = readFileSync(join(process.cwd(), '..', '..', '.github', 'workflows', 'deploy.yml'), 'utf8');
    expect(yaml).toContain('apps/web/.env.production');
    expect(yaml).toContain('VITE_STAFF_HOSTS=');
    // Unset must clear a file a previous run may have left behind, or a
    // deployment would keep serving a split nobody asked for any more.
    expect(yaml).toContain('rm -f apps/web/.env.production');
  });
});
