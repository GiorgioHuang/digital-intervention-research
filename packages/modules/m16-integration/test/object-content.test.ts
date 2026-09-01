import { describe, expect, it } from 'vitest';
import { sniffImageType } from '../src/index.js';

/**
 * What a file actually is, as opposed to what it said it was.
 *
 * This is the whole of the defence between a participant's uploaded file
 * and this platform's own origin, so it is tested on its own, without a
 * database, and mostly from the failing side.
 */
describe('reading an image type off the bytes', () => {
  const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

  it('knows the two it serves', () => {
    expect(sniffImageType(PNG)).toBe('image/png');
    expect(sniffImageType(JPEG)).toBe('image/jpeg');
  });

  /**
   * The attack this exists for. An upload declares image/png, the bytes
   * are a page of markup, and a browser told "image/png" that decided to
   * sniff for itself would run it on this platform's origin — stored
   * cross-site scripting carried by somebody's own photograph. Answering
   * null is what makes the route serve it as an opaque download.
   */
  it('is not fooled by a file that only claims to be a picture', () => {
    for (const pretender of [
      '<html><script>alert(1)</script></html>',
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      '<?php echo 1; ?>',
      'GIF89a',
    ]) {
      expect(sniffImageType(Buffer.from(pretender)), `"${pretender.slice(0, 20)}…" passed as an image`).toBeNull();
    }
  });

  /**
   * A prefix of a signature is not a signature. Reading past the end of a
   * short buffer gives undefined, and `undefined === 0x89` is false, so
   * this cannot pass by accident — but a two-byte file is exactly the
   * kind of input that turns a sloppy comparison into a crash or a true.
   */
  it('refuses truncated and empty files', () => {
    expect(sniffImageType(Buffer.from([]))).toBeNull();
    expect(sniffImageType(Buffer.from([0x89, 0x50]))).toBeNull();
    expect(sniffImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
  });

  /**
   * The signature has to be at the start. A file that carries the bytes
   * somewhere inside it is not a PNG, and a check written with `includes`
   * would say it was.
   */
  it('will not accept a signature buried in the middle of a file', () => {
    expect(sniffImageType(Buffer.concat([Buffer.from('nonsense'), PNG]))).toBeNull();
  });
});
