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
export { createKnowledgePlatformSimulator } from './infrastructure/kp-simulator.js';
