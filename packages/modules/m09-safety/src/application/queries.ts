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
