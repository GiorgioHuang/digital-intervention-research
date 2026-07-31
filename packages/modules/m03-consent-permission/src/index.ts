export * from './contracts/index.js';
export { createPermissionService, type PermissionServiceDeps } from './application/permission-service.js';
export {
  recordConsentDecision,
  withdrawConsent,
  proposeRelationship,
  approveRelationship,
  revokeRelationship,
  type M03Deps,
} from './application/consent-commands.js';
export { expireRelationships } from './application/sweeps.js';
