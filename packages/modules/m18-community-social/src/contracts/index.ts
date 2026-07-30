export const M18_EVENTS = {
  BlockCreated: 'BlockCreated',
  BlockRevoked: 'BlockRevoked',
  UserReportSubmitted: 'UserReportSubmitted',
  ModerationCaseCreated: 'ModerationCaseCreated',
  ModerationDecisionRecorded: 'ModerationDecisionRecorded',
  CommunitySpaceCreated: 'CommunitySpaceCreated',
  CommunityRuleVersionPublished: 'CommunityRuleVersionPublished',
  CommunityMembershipActivated: 'CommunityMembershipActivated',
  SocialPostDrafted: 'SocialPostDrafted',
  SocialPostPublished: 'SocialPostPublished',
} as const;

/** Block query port implementation contract (consumed by M03 composition). */
export interface BlockQueryPort {
  findActiveBlocksInvolving(ids: readonly string[]): Promise<
    { blockerActorId: string; blockedActorId: string; state: 'Active' | 'Revoked' }[]
  >;
}
