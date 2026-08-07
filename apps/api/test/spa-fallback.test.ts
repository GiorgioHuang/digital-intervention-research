import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NON_SPA_PREFIXES, servesSpaShell } from '../src/spa-fallback.js';

/**
 * The web app's shell must never be the answer to a question the API
 * was asked.
 *
 * `/ready` was missing from the hand-written exclusion list, so every
 * deployment serving the web app answered a readiness check with an HTML
 * page and HTTP 200 — a readiness nobody had checked, which is worse
 * than none. The end-to-end suite did not catch it because it runs with
 * no web directory configured, so the fallback it needed to exercise was
 * not there: the test covered a shape the deployment does not have.
 */
describe('what falls back to the web app shell', () => {
  /**
   * Read out of the controller rather than restated. A route added there
   * and forgotten here is exactly how this happened.
   */
  it('never swallows a route the health controller declares', () => {
    const controller = readFileSync(join(process.cwd(), 'src', 'health.controller.ts'), 'utf8');
    const routes = [...controller.matchAll(/@Get\('([^']*)'\)/g)].map((m) => `/${m[1]!}`);
    expect(routes.length, 'no routes found — the pattern no longer matches').toBeGreaterThan(1);
    for (const route of routes) {
      expect(servesSpaShell('GET', route), `${route} must not fall back to the shell`).toBe(false);
    }
  });

  it('never swallows the API surface', () => {
    for (const p of ['/v1', '/v1/participants/pt_1/consents', '/health', '/ready']) {
      expect(servesSpaShell('GET', p), p).toBe(false);
    }
  });

  /** A prefix must not capture a path that merely starts with the same letters. */
  it('matches whole segments, not string prefixes', () => {
    expect(servesSpaShell('GET', '/readiness-dashboard')).toBe(true);
    expect(servesSpaShell('GET', '/healthy-ageing')).toBe(true);
  });

  it('still serves the shell for client-side routes, and only for GET', () => {
    expect(servesSpaShell('GET', '/')).toBe(true);
    expect(servesSpaShell('GET', '/my-life-story')).toBe(true);
    expect(servesSpaShell('POST', '/anything')).toBe(false);
  });

  it('the prefix list is the one the fallback uses', () => {
    expect([...NON_SPA_PREFIXES]).toContain('/ready');
  });
});
