/** M14 canonical event names (no deprecated aliases). */
export const M14_EVENTS = {
  ReportCreated: 'ReportCreated',
  ReportVersionDrafted: 'ReportVersionDrafted',
  ReportVersionApproved: 'ReportVersionApproved',
  ExportRequested: 'ExportRequested',
  ExportDecided: 'ExportDecided',
  ExportPackageGenerated: 'ExportPackageGenerated',
  ExportDeliveryStateChanged: 'ExportDeliveryStateChanged',
} as const;
