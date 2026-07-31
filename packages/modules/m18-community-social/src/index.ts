export * from './contracts/index.js';
export {
  createBlock,
  revokeBlock,
  submitUserReport,
  recordModerationDecision,
  createCommunitySpace,
  joinCommunity,
  draftSocialPost,
  publishSocialPost,
  type M18Deps,
} from './application/commands.js';
export { createBlockQuery } from './infrastructure/block-query.js';
export {
  activateMatchPreference,
  generateMatchCandidate,
  recordMatchDecision,
  activateConnection,
  createConnectionRequest,
  DEFAULT_MATCHING_CONFIG,
  type MatchingConfig,
} from './application/matching-commands.js';
export {
  createThread,
  createMessageDraft,
  reviseMessageDraft,
  confirmSend,
  recordDeliveryState,
} from './application/messaging-commands.js';
export {
  listConnections,
  listThreads,
  listMatchCandidates,
  listThreadMessages,
  type ConnectionSummary,
  type ThreadSummary,
  type MatchCandidateSummary,
  type ThreadMessage,
} from './application/queries.js';
export {
  expireMatchCandidates,
  expireMutualAcceptances,
  reconcileDeliveryUnknown,
} from './application/sweeps.js';
