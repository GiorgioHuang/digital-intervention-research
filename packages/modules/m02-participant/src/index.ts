export * from './contracts/index.js';
export {
  registerParticipant,
  recordAccessibilityPreference,
  setPublicProfile,
  withdrawPublicProfile,
  type M02Deps,
} from './application/commands.js';
export {
  listParticipantsForOrganisation,
  getMyProfile,
  getMyPublicProfile,
  type AdministeredParticipant,
  type MyProfile,
  type MyPublicProfile,
} from './application/queries.js';
export { createParticipantQuery } from './infrastructure/repository.js';
