import { describe, expect, it } from 'vitest';
import { DELIVERY_STATE_LABELS } from '../src/api.js';
import {
  DELIVERY_STATUS,
  LIFECYCLE_STATUS,
  SAFETY_EVENT_STATUS,
  SAFETY_SIGNAL_STATUS,
  deliveryStatus,
  safetyEventStatus,
} from '../src/status.js';

/**
 * The owner's status rules, written down as assertions.
 *
 * They were a paragraph in a design brief, which is where rules go to be
 * followed for a while. Each one below is a claim about what a person is
 * being told, and every one of them is a claim that can be broken by a
 * one-word edit six months from now with nobody noticing — because the
 * screen still looks fine when it is wrong. That is the whole reason they
 * are here rather than in a document.
 */
describe('delivery statuses tell the truth about what happened', () => {
  it('never gives Provider Accepted and Delivered the same tone', () => {
    /* The two most confusable states, and the confusion runs the dangerous
       way: one means a machine took the message, the other means a person
       received it. Somebody who reads "accepted" as "delivered" stops
       worrying about a message that may never arrive. */
    expect(DELIVERY_STATUS['Provider Accepted']!.tone).not.toBe(
      DELIVERY_STATUS['Delivered']!.tone,
    );
    expect(DELIVERY_STATUS['Provider Accepted']!.tone).not.toBe('success');
  });

  it('keeps success for the one state where somebody actually received something', () => {
    const successes = Object.entries(DELIVERY_STATUS)
      .filter(([, v]) => v.tone === 'success')
      .map(([k]) => k);
    expect(successes).toEqual(['Delivered']);
  });

  it('never shows Delivery Unknown as a failure', () => {
    /* "We do not know" and "it failed" are different facts. Showing the
       first as the second tells somebody their message definitely did not
       arrive, when the truth is that nobody can say — and on this platform
       the message may be an older person reaching out to somebody. */
    expect(DELIVERY_STATUS['Delivery Unknown']!.tone).not.toBe('danger');
    expect(['warning', 'neutral']).toContain(DELIVERY_STATUS['Delivery Unknown']!.tone);
    /* And it must not read as success either, in the other direction. */
    expect(DELIVERY_STATUS['Delivery Unknown']!.tone).not.toBe('success');
  });

  it('keeps the agreed wording rather than restating it', () => {
    /* One place decides what a status says; this table only decides how it
       looks. A second copy of the words is a second thing to keep true. */
    for (const [state, presentation] of Object.entries(DELIVERY_STATUS)) {
      expect(presentation.words, `${state} has drifted from the agreed wording`).toBe(
        DELIVERY_STATE_LABELS[state],
      );
    }
  });

  it('covers every delivery state the platform can produce', () => {
    /* An unmapped state falls back to neutral and its raw value, which is
       honest but unhelpful; the point of this test is that nobody has to
       rely on the fallback. */
    for (const state of Object.keys(DELIVERY_STATE_LABELS)) {
      expect(DELIVERY_STATUS[state], `${state} has no presentation`).toBeDefined();
    }
  });

  it('shows an unmapped state rather than swallowing it', () => {
    const unknown = deliveryStatus('Some Future State');
    expect(unknown.words).toBe('Some Future State');
    expect(unknown.tone).toBe('neutral');
  });

  it('gives every status a mark, so none of them depends on colour', () => {
    for (const [state, presentation] of Object.entries({
      ...DELIVERY_STATUS,
      ...LIFECYCLE_STATUS,
    })) {
      expect(presentation.mark.length, `${state} has no mark`).toBeGreaterThan(0);
      expect(presentation.words.length, `${state} has no words`).toBeGreaterThan(0);
    }
  });
});

describe('not-finished-yet is not the same as something-went-wrong', () => {
  it('keeps Draft, Pending and Expired in the quiet tone', () => {
    /* Nothing has gone wrong in any of them. A red or amber draft makes a
       person think they have done something they have not. */
    for (const state of ['Draft', 'Pending', 'Expired']) {
      expect(LIFECYCLE_STATUS[state]!.tone, `${state} should be quiet`).toBe('draft');
    }
  });

  it('marks Blocked as a boundary rather than an alarm', () => {
    /* Danger is the right family — it is a stop — but the system's danger
       colour is a low-saturation red by design, and Blocked is rendered as
       a line rather than a filled panel. Somebody blocked another person
       on purpose; the screen should not shout it back at them. */
    expect(LIFECYCLE_STATUS['Blocked']!.tone).toBe('danger');
  });
});

describe('safety is graded inside its own family, never escalated into red', () => {
  it('never paints a safety state in the danger family', () => {
    /* The owner's brief asked for a confirmed SafetyEvent to use Error and
       then ruled for blue when the conflict was put to them. The reason is
       worth keeping next to the assertion: red in this system means a
       destructive action or a blocked operation, and a person being unwell
       is neither. A screen where "someone may be at risk" looks identical
       to "that upload failed" has taught its reader to skim both. */
    for (const [state, presentation] of Object.entries(SAFETY_EVENT_STATUS)) {
      expect(presentation.tone, `${state} must not be in the danger family`).not.toBe('danger');
    }
    expect(SAFETY_SIGNAL_STATUS.tone).not.toBe('danger');
    expect(safetyEventStatus('Some Future State').tone).not.toBe('danger');
  });

  it('separates a report nobody has reviewed from a confirmed event', () => {
    /* An unreviewed signal is somebody saying something might be wrong; a
       confirmed event is a reviewer saying it is. Rendering them the same
       overstates what is known about a person, which on a safety screen is
       the error that costs most. */
    expect(SAFETY_SIGNAL_STATUS.tone).toBe('warning');
    expect(SAFETY_EVENT_STATUS['Open']!.tone).toBe('safety');
    expect(SAFETY_SIGNAL_STATUS.tone).not.toBe(SAFETY_EVENT_STATUS['Open']!.tone);
  });

  it('lets finished business go quiet, without ever calling it a success', () => {
    /* A list where a case closed months ago looks like an open one is a
       list a reviewer stops reading. But "resolved" must not read as an
       achievement either: resolving a record does not resolve a risk, and
       the screen says so in words beside this. */
    for (const state of ['Resolved', 'Closed']) {
      expect(SAFETY_EVENT_STATUS[state]!.tone, `${state} should be quiet`).toBe('draft');
      expect(SAFETY_EVENT_STATUS[state]!.tone).not.toBe('success');
    }
    for (const state of ['Open', 'Action Required', 'Reopened']) {
      expect(SAFETY_EVENT_STATUS[state]!.tone, `${state} still needs somebody`).toBe('safety');
    }
  });

  it('shows an unmapped safety state rather than hiding it', () => {
    /* Falling back to quiet would be the dangerous direction here: an
       unrecognised safety state must not disappear into grey. */
    const unknown = safetyEventStatus('Escalated To Clinician');
    expect(unknown.words).toBe('Escalated To Clinician');
    expect(unknown.tone).toBe('safety');
  });
});
