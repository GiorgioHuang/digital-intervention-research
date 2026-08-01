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
export { searchKnowledgeEvidence, type M10QueryDeps } from './application/queries.js';
export { createKnowledgePlatformSimulator } from './infrastructure/kp-simulator.js';
export { createKnowledgePlatformMcpClient, type KpMcpConfig } from './infrastructure/kp-mcp-client.js';
