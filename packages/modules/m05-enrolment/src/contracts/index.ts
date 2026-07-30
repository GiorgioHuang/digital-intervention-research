export const M05_EVENTS = {
  ParticipantInvited: 'ParticipantInvited',
  ScreeningStarted: 'ScreeningStarted',
  EligibilityDecisionRecorded: 'EligibilityDecisionRecorded',
  ConsentProcessStarted: 'ConsentProcessStarted',
  ParticipantEnrolled: 'ParticipantEnrolled',
  EnrolmentActivated: 'EnrolmentActivated',
  ParticipantWithdrawn: 'ParticipantWithdrawn',
  EnrolmentDiscontinued: 'EnrolmentDiscontinued',
} as const;

export interface EnrolmentView {
  id: string;
  participantId: string;
  researchProjectId: string;
  protocolVersionId: string;
  state: string;
  recordVersion: number;
}
