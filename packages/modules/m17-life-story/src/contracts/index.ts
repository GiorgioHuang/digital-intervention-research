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

/** MVP visibility scopes — Internet Public is feature-disabled (ADR-020). */
export type LifeStoryVisibility =
  | 'Private'
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
