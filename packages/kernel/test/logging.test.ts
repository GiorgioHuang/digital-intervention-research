import { describe, expect, it } from 'vitest';
import { REDACTED, isSensitiveKey, redact } from '../src/logging.js';

describe('sensitive key detection (Doc 14 §61)', () => {
  it.each([
    'messageBody',
    'message_body',
    'messageContent',
    'lifeStoryText',
    'life_story_narrative',
    'assessmentResponse',
    'matchPreference',
    'reporterIdentity',
    'reporter_id',
    'safetyNarrative',
    'consentDocument',
    'prompt',
    'prompts',
    'modelOutput',
    'password',
    'clientSecret',
    'accessToken',
    'refresh_token',
    'authorization',
    'apiKey',
    'linkageKey',
    'preciseLocation',
    'latitude',
  ])('redacts %s', (key) => {
    expect(isSensitiveKey(key)).toBe(true);
  });

  it.each(['messageId', 'threadId', 'lifecycleState', 'deliveryState', 'reportedAt'])(
    'keeps non-sensitive key %s',
    (key) => {
      expect(isSensitiveKey(key)).toBe(false);
    },
  );
});

describe('redact()', () => {
  it('deep-redacts nested structures and arrays', () => {
    const input = {
      thread: {
        id: 'ct_1',
        messages: [{ id: 'msg_1', messageBody: 'private words', deliveryState: 'Queued' }],
      },
      auth: { accessToken: 'abc', user: 'u1' },
    };
    const out = redact(input) as any;
    expect(out.thread.messages[0].messageBody).toBe(REDACTED);
    expect(out.thread.messages[0].deliveryState).toBe('Queued');
    expect(out.auth.accessToken).toBe(REDACTED);
    expect(out.auth.user).toBe('u1');
    // original untouched
    expect(input.thread.messages[0]!.messageBody).toBe('private words');
  });

  it('survives cycles', () => {
    const a: any = { name: 'a' };
    a.self = a;
    const out = redact(a) as any;
    expect(out.self).toBe('[CYCLE]');
  });

  it('preserves primitives and dates', () => {
    const d = new Date('2026-01-01T00:00:00Z');
    const out = redact({ n: 1, s: 'x', d }) as any;
    expect(out.n).toBe(1);
    expect(out.d.toISOString()).toBe(d.toISOString());
  });
});
