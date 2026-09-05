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
  /**
   * What these participants chose to be called in front of other people,
   * and where they said they live if they said it at all.
   *
   * A DIFFERENT QUESTION from `findDisplayNames`, and the difference is a
   * hard rule (Doc 20 §354): that one answers "what does the study office
   * have on record", this one answers "what did this person put up for
   * other people to see". Nothing copies a value from one to the other,
   * so a participant who has chosen nothing is simply absent from this
   * map — and absence must not be filled in from the research record,
   * which is the whole point (the C2 ruling, 2026-09-05).
   */
  findPublicNames(participantIds: string[]): Promise<Map<string, PublicName>>;
}

/** What one participant put up for other people to see. */
export interface PublicName {
  chosenName: string;
  /** Null when they did not say, which is the default. */
  city: string | null;
}

export const M02_EVENTS = {
  ParticipantRegistered: 'ParticipantRegistered',
  AccessibilityPreferenceRecorded: 'AccessibilityPreferenceRecorded',
  PublicProfileChanged: 'PublicProfileChanged',
  PublicProfileWithdrawn: 'PublicProfileWithdrawn',
} as const;
