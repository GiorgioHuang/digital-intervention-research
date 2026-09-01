import express from 'express';
import { DEFAULT_STORAGE_CONFIG } from '@platform/m16-integration';

/**
 * How large a request body this API accepts, and where.
 *
 * There was no answer to that question, which meant the answer was
 * `express.json`'s default of 100kB — while `initiateUpload` accepts a
 * declared size of up to ten megabytes and the screen invites somebody to
 * add a photograph. So every photograph anyone has ever chosen failed:
 * the first call succeeded, the bytes went up as base64 in the second,
 * body-parser refused before the handler ran, and the participant was
 * shown "We could not determine the cause, and we do not know whether it
 * took effect" (owner, 2026-09-01).
 *
 * Nothing caught it because the tests upload the string "a family photo"
 * — fourteen bytes, a thousandth of the smallest real photograph.
 */

/** The one route that carries a file. */
export const UPLOAD_CONTENT_PATH = /^\/v1\/objects\/[^/]+\/content$/;

/**
 * Derived from the storage config, so the two cannot drift apart again.
 *
 * Base64 spends four bytes on every three, and the JSON envelope adds the
 * field name, the quotes and the braces. The margin is generous on
 * purpose: the platform's job is to refuse an oversized file with a
 * sentence somebody can read, and it cannot do that if the transport
 * refuses a file that is *within* the limit first, with a 500.
 */
export function uploadBodyLimitBytes(maxSizeBytes: number = DEFAULT_STORAGE_CONFIG.maxSizeBytes): number {
  return Math.ceil((maxSizeBytes * 4) / 3) + 64 * 1024;
}

/**
 * Everything else, and deliberately small.
 *
 * Raising the ceiling everywhere would have been one line, and it would
 * have handed every other route on this platform — all of them
 * unauthenticated until the guard runs — a several-megabyte buffer to
 * fill. Only the route that has a reason to carry a photograph gets one.
 */
export const DEFAULT_BODY_LIMIT_BYTES = 256 * 1024;

/**
 * One parser for files, one for everything else, chosen per request.
 *
 * Two `app.use(express.json(...))` calls in sequence would not work: the
 * first parses the body, and the second sees `req.body` already set and
 * does nothing — so whichever was registered first would silently govern
 * every route.
 */
export function bodyParsers(maxSizeBytes?: number): express.RequestHandler {
  const forFiles = express.json({ limit: uploadBodyLimitBytes(maxSizeBytes) });
  const forEverythingElse = express.json({ limit: DEFAULT_BODY_LIMIT_BYTES });
  return (req, res, next) => {
    const parse = req.method === 'POST' && UPLOAD_CONTENT_PATH.test(req.path) ? forFiles : forEverythingElse;
    parse(req, res, next);
  };
}
