/**
 * Which of the platform's surfaces this address serves.
 *
 * The participant workspace and the staff workspace were chosen by a
 * button on the sign-in screen: a participant — an older adult opening
 * the platform for the first time — was shown two doors that were not
 * theirs, alongside the one that was. Pressing them granted nothing,
 * because every data path is decided by the permission engine on the
 * server, but being offered somebody else's workspace is not a neutral
 * thing to put in front of somebody.
 *
 * The surfaces are now separated by address (owner's ruling, 2026-08-08:
 * two hostnames, one service).
 *
 * WHAT THIS IS NOT. It is not access control, and nothing anywhere may
 * describe it as such. Both hostnames are served by the same deployment
 * behind the same shared access token, and authentication is still the
 * development stub in which identity is whatever `x-actor-id` says
 * (ADR-104). Anybody who can reach one address can reach the other and
 * can claim any actor identifier at either. What the split gives is a
 * participant entrance with nothing on it but their own way in, and per
 * origin token storage in the browser. What protects staff work is the
 * permission engine, exactly as before.
 *
 * Configured at build time, because the bundle is what the browser
 * decides with. With no configuration the app stays as it was — one
 * address, doors on the sign-in screen — which is what local development
 * and the test suite run.
 */
export type Surface = 'participant' | 'staff' | 'single-host';

function configuredStaffHosts(): string[] {
  const raw = (import.meta.env['VITE_STAFF_HOSTS'] as string | undefined) ?? '';
  return raw
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h !== '');
}

/**
 * Matched on the whole hostname, never a prefix: `admin.example.org` must
 * not also claim `admin.example.org.attacker.test`, and a rule that
 * matched loosely would put the staff entrance on an address nobody
 * configured.
 */
export function surfaceFor(hostname: string, staffHosts = configuredStaffHosts()): Surface {
  if (staffHosts.length === 0) return 'single-host';
  return staffHosts.includes(hostname.trim().toLowerCase()) ? 'staff' : 'participant';
}

export function currentSurface(): Surface {
  return surfaceFor(typeof window === 'undefined' ? '' : window.location.hostname);
}
