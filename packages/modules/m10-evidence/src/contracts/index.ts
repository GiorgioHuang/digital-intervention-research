/**
 * Knowledge Platform Anti-Corruption Layer port (ADR-052, Doc 9).
 * The external Knowledge Platform stays authoritative for evidence content;
 * this port is the ONLY doorway (MCP preferred, REST fallback — transport is
 * an adapter concern). Until ADR-110 is approved, a deterministic simulator
 * implements the port.
 */
export interface KnowledgeResource {
  externalIdentifier: string;
  title: string;
  sourceSystem: string;
  externalVersion: string;
  summary: string;
}

export interface KnowledgePlatformPort {
  searchEvidence(query: string): Promise<KnowledgeResource[]>;
  resolveReference(externalIdentifier: string): Promise<KnowledgeResource | undefined>;
}

export const M10_EVENTS = {
  EvidenceReviewCreated: 'EvidenceReviewCreated',
  KnowledgeReferenceCreated: 'KnowledgeReferenceCreated',
  EvidenceReviewSubmittedForReview: 'EvidenceReviewSubmittedForReview',
  EvidenceReviewCompleted: 'EvidenceReviewCompleted',
  EvidenceReviewReturnedForRevision: 'EvidenceReviewReturnedForRevision',
  EvidenceDecisionCreated: 'EvidenceDecisionCreated',
  EvidenceDecisionApproved: 'EvidenceDecisionApproved',
  EvidenceDecisionRejected: 'EvidenceDecisionRejected',
  EvidenceSnapshotCreated: 'EvidenceSnapshotCreated',
} as const;

export type EvidenceDecisionOutcome =
  | 'Support'
  | 'Support with Conditions'
  | 'Insufficient Evidence'
  | 'Conflicting Evidence'
  | 'Restrict'
  | 'Do Not Proceed'
  | 'Research Required';
