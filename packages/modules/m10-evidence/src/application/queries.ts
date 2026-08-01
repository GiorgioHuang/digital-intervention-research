import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { KnowledgePlatformPort, KnowledgeResource } from '../contracts/index.js';
import type { PermissionCheck } from './commands.js';

export interface M10QueryDeps {
  checkPermission: PermissionCheck;
  knowledgePlatform: KnowledgePlatformPort;
}

/**
 * Permission-gated evidence search through the Knowledge Platform ACL.
 * Read-only: results are ephemeral suggestions — nothing becomes platform
 * state until a human attaches a KnowledgeReference to an EvidenceReview
 * (provenance recorded there, ADR-052). Port failures propagate as
 * DEPENDENCY_UNAVAILABLE rather than an empty result set.
 */
export async function searchKnowledgeEvidence(
  deps: M10QueryDeps,
  ctx: RequestContext,
  query: string,
): Promise<KnowledgeResource[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence.search',
    resource: { type: 'KnowledgeResource', id: 'external', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  return deps.knowledgePlatform.searchEvidence(query);
}
