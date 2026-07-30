export interface ParticipantView {
  id: string;
  userAccountId: string | undefined;
  displayName: string;
  state: 'Active' | 'Paused' | 'Withdrawn' | 'Archived';
}

/** Query port for other modules (M05 enrolment checks the Participant exists). */
export interface ParticipantQueryPort {
  findParticipant(participantId: string): Promise<ParticipantView | undefined>;
  findParticipantIdByAccount(userAccountId: string): Promise<string | undefined>;
}

export const M02_EVENTS = {
  ParticipantRegistered: 'ParticipantRegistered',
  AccessibilityPreferenceRecorded: 'AccessibilityPreferenceRecorded',
} as const;
