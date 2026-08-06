import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M09Deps } from './commands.js';

export interface TriageQueueItem {
  signalId: string;
  sourceType: string;
  category: string;
  severity: string;
  description: string;
  signalState: string;
  createdAt: string;
}

/** Work queue for safety reviewers: signals still open for triage. */
export async function listSignalsAwaitingTriage(deps: M09Deps, ctx: RequestContext): Promise<TriageQueueItem[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'triage-queue.view',
    resource: { type: 'TriageQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, source_type, category, severity, description, signal_state, created_at
       FROM safety.safety_signals
      WHERE signal_state IN ('Recorded', 'Awaiting Triage', 'In Review', 'Escalated')
      ORDER BY created_at ASC`,
  );
  return res.rows.map((r) => ({
    signalId: r.id as string,
    sourceType: r.source_type as string,
    category: r.category as string,
    severity: r.severity as string,
    description: r.description as string,
    signalState: r.signal_state as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export interface SafetyTimelineEntry {
  entryId: string;
  entryType: 'Action' | 'State';
  label: string;
  actionState: string | null;
  note: string;
  recordedByActorId: string;
  recordedAt: string;
}

export interface SafetyEventItem {
  safetyEventId: string;
  safetySignalId: string;
  eventState: string;
  confirmedByActorId: string;
  confirmedAt: string;
  /**
   * What was confirmed, taken from the signal this event was made from.
   * Severity and category are the signal's own; how related this is to the
   * intervention is in the design and is recorded nowhere, so no screen
   * claims to know it.
   */
  category: string;
  severity: string;
  description: string;
  timeline: SafetyTimelineEntry[];
}

/**
 * Confirmed safety events, and what has been done about each.
 *
 * Nothing listed a safety event before this. One could be created — the
 * strongest thing a safety reviewer can do — and then no query returned
 * it and no screen showed it, so the most serious record this platform
 * holds went somewhere nobody could look. `safety-event.review` existed in
 * the permission catalogue all along with nothing to read.
 *
 * The whole timeline travels with the event rather than behind a second
 * request: what has been done is not a detail of a safety event, it is the
 * thing a reviewer opened it to find out.
 */
export async function listSafetyEvents(deps: M09Deps, ctx: RequestContext): Promise<SafetyEventItem[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'safety-event.review',
    resource: { type: 'SafetyEvent', id: 'all', state: 'Any', protectedExistence: true },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT e.id, e.safety_signal_id, e.event_state, e.confirmed_by_actor_id, e.created_at,
            s.category, s.severity, s.description
       FROM safety.safety_events e
       JOIN safety.safety_signals s ON s.id = e.safety_signal_id
      ORDER BY e.created_at DESC`,
  );
  if (res.rowCount === 0) return [];
  const entries = await deps.pool.query(
    `SELECT id, safety_event_id, entry_type, label, action_state, note, recorded_by_actor_id, recorded_at
       FROM safety.safety_event_timeline
      WHERE safety_event_id = ANY($1::text[])
      ORDER BY recorded_at ASC`,
    [res.rows.map((r) => r.id as string)],
  );
  const byEvent = new Map<string, SafetyTimelineEntry[]>();
  for (const e of entries.rows) {
    const list = byEvent.get(e.safety_event_id as string) ?? [];
    list.push({
      entryId: e.id as string,
      entryType: e.entry_type as 'Action' | 'State',
      label: e.label as string,
      actionState: (e.action_state as string | null) ?? null,
      note: e.note as string,
      recordedByActorId: e.recorded_by_actor_id as string,
      recordedAt: (e.recorded_at as Date).toISOString(),
    });
    byEvent.set(e.safety_event_id as string, list);
  }
  return res.rows.map((r) => ({
    safetyEventId: r.id as string,
    safetySignalId: r.safety_signal_id as string,
    eventState: r.event_state as string,
    confirmedByActorId: r.confirmed_by_actor_id as string,
    confirmedAt: (r.created_at as Date).toISOString(),
    category: r.category as string,
    severity: r.severity as string,
    description: r.description as string,
    timeline: byEvent.get(r.id as string) ?? [],
  }));
}
