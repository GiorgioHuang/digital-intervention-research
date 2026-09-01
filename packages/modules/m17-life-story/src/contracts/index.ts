export const M17_EVENTS = {
  LifeStoryArchiveCreated: 'LifeStoryArchiveCreated',
  LifeStoryItemDrafted: 'LifeStoryItemDrafted',
  LifeStoryItemUpdated: 'LifeStoryItemUpdated',
  ParticipantTestimonyConfirmed: 'ParticipantTestimonyConfirmed',
  LifeStoryItemVisibilityChanged: 'LifeStoryItemVisibilityChanged',
  LifeStoryContributionCreated: 'LifeStoryContributionCreated',
  LifeStoryContributionAccepted: 'LifeStoryContributionAccepted',
  LifeStoryContributionRejected: 'LifeStoryContributionRejected',
  LifeStoryItemWithdrawn: 'LifeStoryItemWithdrawn',
  LifeStoryExportRequested: 'LifeStoryExportRequested',
} as const;

/**
 * MVP visibility scopes — Internet Public is feature-disabled (ADR-020).
 *
 * `My Supporters` means the people in an approved supporter relationship
 * with the participant. It is not `Connections`, which is
 * participant-to-participant: a supporter is the family member or friend
 * who helps somebody use this, and for this project that is the important
 * one — the purpose is reducing loneliness by keeping somebody connected
 * to their family, and their daughter is a supporter (owner, 2026-09-01,
 * B-30).
 */
export type LifeStoryVisibility =
  | 'Private'
  | 'My Supporters'
  | 'Selected People'
  | 'Connections'
  | 'Community'
  | 'Platform Public';

export type LifeStorySourceType =
  | 'ParticipantAuthored'
  | 'AIDraft'
  | 'SupporterContribution'
  | 'Transcription'
  | 'Translation';
