import type { Request } from 'express';

export const SESSION_COOKIE = 'platform_session';

/**
 * Reads one cookie. Express does not parse cookies without middleware and
 * the platform needs exactly one, so this is that rather than a dependency.
 *
 * Cookie values are percent-encoded on the way out by `res.cookie`, so they
 * are decoded on the way in; a session token that survived a round trip
 * only when it happened to contain no encodable characters would be a
 * sign-in that worked most of the time.
 */
export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (typeof header !== 'string') return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const value = part.slice(eq + 1).trim();
    if (value === '') return undefined;
    try {
      return decodeURIComponent(value);
    } catch {
      // A malformed escape is a malformed cookie, not a session.
      return undefined;
    }
  }
  return undefined;
}
