import { describe, expect, it } from 'vitest';
import { DEFAULT_STORAGE_CONFIG } from '@platform/m16-integration';
import {
  DEFAULT_BODY_LIMIT_BYTES,
  UPLOAD_CONTENT_PATH,
  uploadBodyLimitBytes,
} from '../src/body-limits.js';

/**
 * How large a body the API accepts.
 *
 * There was no answer, so the answer was express.json's default of 100kB,
 * while the platform tells participants it accepts a ten-megabyte file
 * and the life story invites them to add a photograph. Every photograph
 * anybody chose failed: the declaration went through, the bytes went up
 * as base64, body-parser refused before any handler ran, and the screen
 * said "We could not determine the cause, and we do not know whether it
 * took effect".
 */
describe('the body a photograph arrives in', () => {
  /**
   * The arithmetic that was missing. Base64 spends four bytes on every
   * three, so a file at the declared maximum is already a third larger
   * on the wire than the number the platform quotes — and it must still
   * fit, or the transport refuses a file the platform said it would take.
   */
  it('leaves room for the largest file the platform says it accepts', () => {
    const max = DEFAULT_STORAGE_CONFIG.maxSizeBytes;
    const asBase64 = Math.ceil((max * 4) / 3);
    expect(uploadBodyLimitBytes()).toBeGreaterThan(asBase64);
    // Derived from the storage config, not written down twice: change the
    // maximum and this follows it.
    expect(uploadBodyLimitBytes(1024)).toBeLessThan(uploadBodyLimitBytes(10 * 1024 * 1024));
  });

  /**
   * And nowhere else. Raising the ceiling everywhere would have been one
   * line and would have handed every other route a multi-megabyte buffer
   * to fill — including the unauthenticated ones.
   */
  it('does not raise the ceiling for anything but the upload', () => {
    expect(DEFAULT_BODY_LIMIT_BYTES).toBeLessThan(uploadBodyLimitBytes() / 10);
  });

  it('recognises the upload route and nothing adjacent to it', () => {
    expect(UPLOAD_CONTENT_PATH.test('/v1/objects/obj_01J/content')).toBe(true);
    for (const other of [
      '/v1/objects',
      '/v1/objects/obj_1',
      '/v1/objects/obj_1/release',
      '/v1/objects/obj_1/delete',
      '/v1/participants/pt_1/objects',
      '/contact',
      // Not a prefix match: a path that merely begins with the route.
      '/v1/objects/obj_1/content/extra',
    ]) {
      expect(UPLOAD_CONTENT_PATH.test(other), `${other} was given the upload's body allowance`).toBe(false);
    }
  });

  /**
   * The browser holds the same number, because it refuses an oversized
   * file before spending somebody's bandwidth on it. Two copies of a
   * limit drift; this is what stops them.
   */
  it('agrees with the number the browser refuses at', async () => {
    const web = await import('../../web/src/api.js');
    expect(web.MAX_FILE_BYTES).toBe(DEFAULT_STORAGE_CONFIG.maxSizeBytes);
  });

  /**
   * The screen now names the formats it takes, so those names have to be
   * ones the gate really accepts. A screen that promises a format the
   * server refuses is worse than one that promises nothing: somebody
   * follows the instruction, converts their photograph, and is refused
   * anyway.
   *
   * A subset, not the whole list — the control is labelled "Add a
   * photograph" and the platform also takes MP3, PDF and plain text.
   */
  it('never names a format the gate would refuse', async () => {
    const web = await import('../../web/src/api.js');
    expect(web.PHOTOGRAPH_TYPES.length).toBeGreaterThan(0);
    for (const type of web.PHOTOGRAPH_TYPES) {
      expect(
        DEFAULT_STORAGE_CONFIG.allowedContentTypes,
        `the screen offers ${type} and the server refuses it`,
      ).toContain(type);
    }
    // And the words match the list, so the sentence cannot drift from
    // what the control actually accepts.
    for (const type of web.PHOTOGRAPH_TYPES) {
      const name = type.replace('image/', '').toUpperCase();
      expect(web.PHOTOGRAPH_TYPE_WORDS.toUpperCase(), `${type} is accepted but not named`).toContain(name);
    }
  });
});
