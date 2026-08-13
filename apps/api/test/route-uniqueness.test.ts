import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * No two handlers on the same method and path.
 *
 * `GET participants/:participantId/objects` was declared twice in one
 * controller — same path, same parameters, same validation, same call,
 * each with its own docstring explaining the same gap, forty lines apart.
 * Express matches the first, so the second had never run since the day it
 * was added.
 *
 * Harmless right up until somebody edits one of them. Then it is a change
 * to the live handler that appears to do nothing because the dead one was
 * edited, or a tidy-up that deletes whichever looked like the copy — and
 * only one of those two is safe to delete. Neither failure announces
 * itself: the route keeps answering, with the other body.
 *
 * Scanned from source rather than from Nest's metadata because the point
 * is to fail while somebody is writing the second one, not once the app
 * boots.
 */
const CONTROLLERS = ['controllers.ts', 'staff-controllers.ts', 'health.controller.ts', 'auth/auth.controller.ts'];

function routesIn(file: string): string[] {
  const source = readFileSync(join(process.cwd(), 'src', file), 'utf8');
  const prefix = /@Controller\(['"]([^'"]*)['"]\)/.exec(source)?.[1] ?? '';
  const found: string[] = [];
  const decorator = /@(Get|Post|Put|Patch|Delete)\(\s*(?:['"]([^'"]*)['"])?\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = decorator.exec(source)) !== null) {
    found.push(`${match[1]!.toUpperCase()} ${prefix}/${match[2] ?? ''}`.replace(/\/+$/, ''));
  }
  return found;
}

describe('every route is declared once', () => {
  it.each(CONTROLLERS)('%s has no duplicate method and path', (file) => {
    const routes = routesIn(file);
    const seen = new Set<string>();
    const duplicated = routes.filter((r) => (seen.has(r) ? true : (seen.add(r), false)));
    expect(duplicated, `declared more than once — only the first one ever runs`).toEqual([]);
  });

  /** The scan is worthless if it finds nothing to scan. */
  it('actually found routes to check', () => {
    expect(routesIn('controllers.ts').length).toBeGreaterThan(20);
  });
});
