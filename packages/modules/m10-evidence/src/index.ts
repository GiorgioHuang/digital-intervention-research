export * from './contracts/index.js';
export {
  createEvidenceReview,
  attachKnowledgeReference,
  submitEvidenceReview,
  approveEvidenceReview,
  draftEvidenceDecision,
  approveEvidenceDecision,
  type M10Deps,
} from './application/commands.js';
export {
  listDecisionWork,
  listDecisionsAwaitingApproval,
  listEvidenceWork,
  listReviewsAwaitingApproval,
  searchKnowledgeEvidence,
  type EvidenceDecisionSummary,
  type EvidenceReference,
  type EvidenceReviewSummary,
  type M10QueryDeps,
} from './application/queries.js';
export { createKnowledgePlatformSimulator } from './infrastructure/kp-simulator.js';
export { createKnowledgePlatformMcpClient, type KpMcpConfig } from './infrastructure/kp-mcp-client.js';
