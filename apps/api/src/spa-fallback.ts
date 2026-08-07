/**
 * Which requests get the web app's shell instead of an answer.
 *
 * The single-service deployment serves the built web app from the API
 * process, and unknown GETs fall back to the SPA shell so that a
 * client-side route survives a refresh. The list of paths that must NOT
 * fall back was written by hand as `/v1` and `/health` — and `/ready`
 * was not on it.
 *
 * So in every deployment that serves the web app, `GET /ready` has
 * returned 200 with an HTML page. A readiness endpoint that answers 200
 * whatever the state of the database is worse than none: it reports a
 * readiness nobody checked, and anything watching it — a probe, a load
 * balancer, a person — is told the platform is fine because a static
 * file exists. The API's own end-to-end test never caught it, because it
 * runs without a web directory configured and therefore without the
 * fallback at all: the test exercised a shape the deployment does not
 * have.
 *
 * The list is exported and tested against the routes the health
 * controller actually declares, rather than maintained by memory, so
 * adding a route cannot quietly hand it to the SPA.
 */
export const NON_SPA_PREFIXES = ['/v1', '/health', '/ready'] as const;

export function servesSpaShell(method: string, path: string): boolean {
  if (method !== 'GET') return false;
  return !NON_SPA_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}
