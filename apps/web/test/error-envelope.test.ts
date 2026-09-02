import { describe, expect, it, vi } from 'vitest';
import { api, PlatformApiError, toBase64 } from '../src/api.js';
import { presentError } from '../src/errors.js';

const session = { actorId: 'a', participantId: 'p' };

/**
 * What the screen says when the answer is not this platform's envelope.
 *
 * Reported from the deployed site: a photograph upload showed "The server
 * could not be reached", code NETWORK. The server had been reached and
 * had answered — with something that was not JSON, from a layer between
 * the browser and the application. `res.json()` was called before
 * `res.ok` was checked, so the SyntaxError was not a PlatformApiError and
 * `presentError` fell through to its network wording. The one sentence
 * the screen offered was the one thing that was untrue, and the
 * technical details said "NETWORK", which support cannot act on.
 */
describe('an answer that is not the envelope', () => {
  it('is reported as the status it arrived with, not as a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html><body>502 Bad Gateway</body></html>', { status: 502 })),
    );
    const raised = await api
      .createLifeStoryArchive(session)
      .then(() => null)
      .catch((e: unknown) => e);

    expect(raised, 'a non-JSON answer did not raise a platform error').toBeInstanceOf(PlatformApiError);
    const shown = presentError(raised);
    expect(shown.code, 'the status the server answered with was thrown away').toBe('HTTP_502');
    expect(shown.detail, 'support is given nothing to act on').toMatch(/502/);
    expect(shown.detail).toMatch(/Bad Gateway/);
    // And the participant-facing sentence stays the prepared one.
    expect(shown.title).not.toMatch(/502|html/i);
  });

  it('still says "could not be reached" when the request really did not leave', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const raised = await api.createLifeStoryArchive(session).then(() => null).catch((e: unknown) => e);
    expect(presentError(raised).code, 'a real network failure stopped being reported as one').toBe('NETWORK');
  });

  it('carries the platform’s own message into the details when there is one', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: { code: 'VALIDATION_ERROR', message: 'That file is larger than this platform accepts', requestId: 'r', retryable: false },
            }),
            { status: 413 },
          ),
      ),
    );
    const raised = await api.createLifeStoryArchive(session).then(() => null).catch((e: unknown) => e);
    const shown = presentError(raised);
    expect(shown.code).toBe('VALIDATION_ERROR');
    expect(shown.detail).toMatch(/413 · That file is larger/);
  });
});

/**
 * The base64 conversion was one iteration per byte — four million of them
 * for an ordinary photograph, building the string a character at a time
 * on the main thread of somebody's phone.
 */
describe('turning a photograph into base64', () => {
  it('gives the same answer as the byte-at-a-time version', () => {
    for (const size of [0, 1, 255, 0x8000 - 1, 0x8000, 0x8000 + 1, 200_000]) {
      const bytes = new Uint8Array(size);
      for (let i = 0; i < size; i += 1) bytes[i] = (i * 7) % 256;
      let oneAtATime = '';
      for (const b of bytes) oneAtATime += String.fromCharCode(b);
      expect(toBase64(bytes), `a ${String(size)}-byte file encoded differently`).toBe(btoa(oneAtATime));
    }
  });

  /**
   * The failure the chunk size exists for. `String.fromCharCode(...all)`
   * in one call overflows the argument list on a real photograph and
   * throws — which is why this goes a chunk at a time rather than
   * replacing the loop with a single spread.
   */
  it('copes with a file far larger than one argument list', () => {
    const bytes = new Uint8Array(3_000_000).fill(7);
    expect(() => toBase64(bytes)).not.toThrow();
    expect(toBase64(bytes).length).toBeGreaterThan(3_000_000);
  });
});
