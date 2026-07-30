import type { KnowledgePlatformPort, KnowledgeResource } from '../contracts/index.js';

/**
 * Deterministic Knowledge Platform simulator (ADR-110 pending): fixed
 * fixture set, stable ordering, no randomness — usable in CI and the
 * synthetic Pilot. Never a source of research authority by itself; the
 * governed evidence records (Review/Decision/Snapshot) remain the basis.
 */
const FIXTURES: KnowledgeResource[] = [
  {
    externalIdentifier: 'kp-ref-0001',
    title: 'Reminiscence and life review interventions for older adults: systematic review',
    sourceSystem: 'knowledge-platform-simulator',
    externalVersion: 'v3',
    summary: 'Evidence on structured life review and wellbeing outcomes.',
  },
  {
    externalIdentifier: 'kp-ref-0002',
    title: 'Social connectedness interventions and loneliness: umbrella review',
    sourceSystem: 'knowledge-platform-simulator',
    externalVersion: 'v1',
    summary: 'Mixed evidence for digitally mediated social connection programmes.',
  },
  {
    externalIdentifier: 'kp-ref-0003',
    title: 'Digital exclusion and accessibility in ageing populations',
    sourceSystem: 'knowledge-platform-simulator',
    externalVersion: 'v2',
    summary: 'Accessibility barriers and ability-adaptive design implications.',
  },
];

export function createKnowledgePlatformSimulator(): KnowledgePlatformPort {
  return {
    async searchEvidence(query: string): Promise<KnowledgeResource[]> {
      const q = query.toLowerCase();
      return FIXTURES.filter(
        (f) => f.title.toLowerCase().includes(q) || f.summary.toLowerCase().includes(q),
      );
    },
    async resolveReference(externalIdentifier: string): Promise<KnowledgeResource | undefined> {
      return FIXTURES.find((f) => f.externalIdentifier === externalIdentifier);
    },
  };
}
