import { describe, expect, it } from 'vitest';
import { captionObject, listUncaptionedPhotographs } from '../src/index.js';
import type { StorageDeps } from '../src/index.js';

const ctx = { actor: { id: 'acct_m', type: 'user' as const } } as never;

const deps = (rows: Record<string, unknown>[] = []) => {
  const seen: { sql: string; params: unknown[] }[] = [];
  const checks: { action: string; ownerParticipantId?: string }[] = [];
  return {
    seen,
    checks,
    deps: {
      pool: {
        query: async (sql: string, params: unknown[]) => {
          seen.push({ sql, params });
          return { rows };
        },
        connect: async () => ({
          query: async (sql: string, params: unknown[]) => {
            seen.push({ sql, params });
            return { rows: [] };
          },
          release: () => undefined,
        }),
      },
      clock: { now: () => new Date('2026-08-29T10:00:00Z') },
      checkPermission: async (_c: unknown, r: { action: string; resource: { ownerParticipantId?: string } }) => {
        checks.push({ action: r.action, ownerParticipantId: r.resource.ownerParticipantId });
        return { outcome: 'Allow', reason: 'owner' };
      },
    } as unknown as StorageDeps,
  };
};

/**
 * A photograph in somebody's life story with nothing said about it.
 *
 * The design surfaces this on Home as the one unfinished thing. What is
 * worth testing is not that the query runs — it is the four conditions
 * that decide whether a card appears on somebody's front page, each of
 * which is one line and none of which would announce itself if it went.
 */
describe('photographs with no words', () => {
  it('asks only for images, only in a life story, only released, only uncaptioned', async () => {
    const { deps: d, seen } = deps();
    await listUncaptionedPhotographs(d, ctx, 'pt_m');
    const sql = seen[0]!.sql;
    // Released only. Available is reached only after a clean malware scan,
    // a checksum, a classification and an owning resource — the release
    // gate in the first storage migration. A quarantined upload is not in
    // somebody's story yet, and putting it on Home would say it was.
    expect(sql, 'a quarantined upload can now reach Home').toContain("object_state = 'Available'");
    expect(sql, 'files outside a life story are being counted').toContain("owning_resource_type = 'LifeStoryItem'");
    // Asking somebody who is in their consent form would be nonsense.
    expect(sql, 'documents and audio are being called photographs').toContain("declared_content_type LIKE 'image/%'");
    expect(sql, 'captioned photographs are coming back as unfinished').toContain('caption IS NULL');
    expect(seen[0]!.params[0]).toBe('pt_m');
  });

  it('is bounded however much is asked for', async () => {
    const { deps: d, seen } = deps();
    await listUncaptionedPhotographs(d, ctx, 'pt_m', 10_000);
    expect(seen[0]!.params[1]).toBe(20);
  });
});

describe('saying who is in a photograph', () => {
  const owned = [{ owner_participant_id: 'pt_m', object_state: 'Available' }];

  it('is its own authority, not the upload’s', async () => {
    const { deps: d, checks } = deps(owned);
    await captionObject(d, ctx, { objectId: 'obj_1', caption: 'My sister Anne' });
    // Adding a file and saying who is in it are different acts, and only
    // the second puts a person's name next to a picture.
    expect(checks[0]?.action, 'captioning is riding on the upload permission').toBe('object.caption');
    expect(checks[0]?.ownerParticipantId).toBe('pt_m');
  });

  /**
   * Protected existence (ADR-050): a caller who does not own this must not
   * learn whether it exists. A missing object is judged against an owner
   * that cannot match, so it refuses exactly as somebody else's does.
   */
  it('does not reveal whether an object it cannot reach exists', async () => {
    const { deps: d, checks } = deps([]);
    await expect(captionObject(d, ctx, { objectId: 'obj_gone', caption: 'x' })).rejects.toThrow();
    expect(checks[0]?.ownerParticipantId, 'a missing object is judged with no owner at all').toBe('no-such-owner');
  });

  it('refuses to write about a file that has not been released', async () => {
    const { deps: d } = deps([{ owner_participant_id: 'pt_m', object_state: 'Quarantined' }]);
    await expect(captionObject(d, ctx, { objectId: 'obj_1', caption: 'x' })).rejects.toThrow(/not ready/);
  });

  /**
   * Clearing is not deleting. Somebody who wrote a name and thought better
   * of it must be able to take the words back without taking the
   * photograph back — and an empty string stored instead of null would
   * read as "answered" to every query, which is a silent way of losing the
   * question.
   */
  it('stores null for an empty caption, and never an empty string', async () => {
    const { deps: d, seen } = deps(owned);
    const out = await captionObject(d, ctx, { objectId: 'obj_1', caption: '   ' });
    expect(out.caption).toBeNull();
    const update = seen.find((q) => q.sql.includes('UPDATE storage_ops.stored_objects'))!;
    expect(update.params[1], 'whitespace was stored as a caption').toBeNull();
    expect(update.params[2], 'a caption time was written with no caption').toBeNull();
  });

  it('trims what it stores, and times it', async () => {
    const { deps: d, seen } = deps(owned);
    const out = await captionObject(d, ctx, { objectId: 'obj_1', caption: '  My sister Anne, about 1962.  ' });
    expect(out.caption).toBe('My sister Anne, about 1962.');
    const update = seen.find((q) => q.sql.includes('UPDATE storage_ops.stored_objects'))!;
    expect(update.params[1]).toBe('My sister Anne, about 1962.');
    expect(update.params[2]).toEqual(new Date('2026-08-29T10:00:00Z'));
  });

  /**
   * The words themselves never enter the audit trail. Audit rows carry
   * references and safe metadata only (Doc 14 §61), and a caption is a
   * participant's own writing about their own photograph — the exact kind
   * of content that document is about.
   */
  it('records that words were written, never the words', async () => {
    const { deps: d, seen } = deps(owned);
    await captionObject(d, ctx, { objectId: 'obj_1', caption: 'My sister Anne, about 1962.' });
    const audit = seen.find((q) => q.sql.includes('governance_audit.audit_events'))!;
    expect(audit, 'captioning is not audited at all').toBeTruthy();
    expect(
      JSON.stringify(audit.params),
      'the caption text was copied into the audit trail',
    ).not.toContain('My sister Anne');
    expect(JSON.stringify(audit.params)).toContain('object.caption');
  });
});
