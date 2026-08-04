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
  /**
   * Display names for a set of participants, for screens that would
   * otherwise render an internal identifier at another participant (see
   * decision D-12). Batched deliberately: a community feed resolves up to
   * a hundred authors, and one query per author would be a query storm on
   * the most-visited screen.
   *
   * Unknown ids are simply absent from the map — the caller decides what
   * to show, and no caller may treat presence or absence as an answer to
   * "does this participant exist", because callers only ever pass ids they
   * already hold.
   */
  findDisplayNames(participantIds: string[]): Promise<Map<string, string>>;
}

export const M02_EVENTS = {
  ParticipantRegistered: 'ParticipantRegistered',
  AccessibilityPreferenceRecorded: 'AccessibilityPreferenceRecorded',
} as const;
