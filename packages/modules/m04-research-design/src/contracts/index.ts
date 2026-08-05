export interface ProtocolVersionView {
  id: string;
  protocolId: string;
  versionNumber: number;
  state: 'Draft' | 'In Review' | 'Approved' | 'Active' | 'Suspended' | 'Superseded' | 'Archived' | 'Rejected';
  researchProjectId: string;
}

/** Query port consumed by M05 (enrolment binds to an exact, usable version). */
export interface ProtocolVersionQueryPort {
  findProtocolVersion(id: string): Promise<ProtocolVersionView | undefined>;
}

export const M04_EVENTS = {
  ResearchProjectCreated: 'ResearchProjectCreated',
  ResearchProjectApproved: 'ResearchProjectApproved',
  ResearchProjectActivated: 'ResearchProjectActivated',
  ResearchQuestionCreated: 'ResearchQuestionCreated',
  ProtocolCreated: 'ProtocolCreated',
  ProtocolVersionDrafted: 'ProtocolVersionDrafted',
  ProtocolVersionSubmittedForReview: 'ProtocolVersionSubmittedForReview',
  ProtocolVersionApproved: 'ProtocolVersionApproved',
  ProtocolVersionRejected: 'ProtocolVersionRejected',
  ProtocolVersionActivated: 'ProtocolVersionActivated',
  ProtocolVersionSuperseded: 'ProtocolVersionSuperseded',
} as const;
