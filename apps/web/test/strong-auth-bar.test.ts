import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const POLICY = join(process.cwd(), '..', '..', 'packages', 'policy', 'src', 'catalogue.ts');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') || p.endsWith('.ts') ? [p] : [];
  });
}

/** The action keys the catalogue puts in the strong-authentication tier. */
function mfaActionsFromCatalogue(): Set<string> {
  const src = readFileSync(POLICY, 'utf8');
  const keys = new Set<string>();
  for (const m of src.matchAll(/'([a-z0-9.-]+)':\s*\{/g)) {
    // Read the entry's braces so a nested object cannot end it early.
    let depth = 0;
    const start = m.index! + m[0].length - 1;
    for (let i = start; i < src.length; i += 1) {
      if (src[i] === '{') depth += 1;
      else if (src[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          if (src.slice(start, i + 1).includes("minimumAuthStrength: 'mfa'")) keys.add(m[1]!);
          break;
        }
      }
    }
  }
  return keys;
}

/** Every key any screen names in a `<StrongAuthBar actions={…}>`. */
function keysClaimedByScreens(): { file: string; key: string }[] {
  const found: { file: string; key: string }[] = [];
  for (const file of walk(SRC)) {
    if (file.endsWith('StrongAuthBar.tsx')) continue;
    const src = readFileSync(file, 'utf8');
    for (const bar of src.matchAll(/<StrongAuthBar[\s\S]*?\/>/g)) {
      for (const k of bar[0].matchAll(/key:\s*'([a-z0-9.-]+)'/g)) found.push({ file, key: k[1]! });
    }
  }
  return found;
}

/**
 * §1.6: what needs strong authentication is said once, at the top of the
 * screen, before anything is attempted — not discovered a section at a
 * time, and least of all after reading a protocol version, forming a
 * judgement and pressing.
 *
 * The bar names actions, so its lists are a claim about the permission
 * catalogue, and a hand-kept claim drifts from the engine exactly as the
 * error wording table did (D-51). These read the catalogue from source
 * rather than restating it.
 */
describe('the strong-authentication bar', () => {
  const mfa = mfaActionsFromCatalogue();

  it('reads a non-empty tier from the catalogue, so the checks below mean something', () => {
    // Guards the guard: a regex that silently matched nothing would make
    // every assertion here vacuously true.
    expect(mfa.size).toBeGreaterThan(0);
    expect(mfa.has('safety-event.create')).toBe(true);
  });

  /**
   * The direction that matters most. Telling somebody an action needs
   * strong authentication when it does not teaches them to re-authenticate
   * reflexively, which is how a step-up prompt stops being a decision.
   */
  it('never claims an action needs strong authentication unless the catalogue says so', () => {
    const claimed = keysClaimedByScreens();
    expect(claimed.length, 'no screen declares a bar — has it been unwired?').toBeGreaterThan(0);
    for (const { file, key } of claimed) {
      expect(mfa.has(key), `${file} claims ${key} is MFA-tier; the catalogue does not`).toBe(true);
    }
  });

  /**
   * The old per-section `AuthStrengthNote` is gone, and this stops it
   * coming back beside the bar: two places saying what needs a step-up is
   * how they drift apart, and it was the scattering that §1.6 objected to.
   */
  it('leaves no per-section strong-authentication note behind', () => {
    for (const file of walk(SRC)) {
      expect(readFileSync(file, 'utf8'), `${file} still uses the old per-section note`).not.toContain(
        'AuthStrengthNote',
      );
    }
  });

  /**
   * A screen with no MFA action must still say so. Silence is read as
   * "nobody checked", and it is the explicit "nothing here needs it" that
   * makes the bar informative on the screens where something does.
   */
  it('is present on a screen with nothing in the tier, saying so', () => {
    const governance = readFileSync(join(SRC, 'components', 'StaffGovernancePanel.tsx'), 'utf8');
    expect(governance).toContain('actions={[]}');
  });
});
