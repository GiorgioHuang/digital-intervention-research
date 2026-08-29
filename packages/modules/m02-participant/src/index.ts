export * from './contracts/index.js';
export {
  registerParticipant,
  recordAccessibilityPreference,
  type M02Deps,
} from './application/commands.js';
export {
  listParticipantsForOrganisation,
  getMyProfile,
  type AdministeredParticipant,
  type MyProfile,
} from './application/queries.js';
export { createParticipantQuery } from './infrastructure/repository.js';
