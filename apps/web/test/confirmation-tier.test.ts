import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const POLICY = join(process.cwd(), '..', '..', 'packages', 'policy', 'src', 'catalogue.ts');

/**
 * The confirmation tier, and who is doing the confirming.
 *
 * The permission engine has a tier of actions that may only proceed when
 * a human has confirmed: the command passes `confirmed` through to the
 * engine, and the engine refuses without it. Both api clients send
 * `confirmed: true` as a literal at every call site, which is fine as
 * long as the screen asked first — the client is then reporting what
 * happened. Where the screen did not ask, the constant *is* the
 * confirmation, and the tier protects nothing.
 *
 * A sweep of all forty-five confirmation-tier actions found five that
 * were recorded on a single click: approving an intervention version
 * (which is also in the strong-authentication tier, and whose own
 * component comment claimed it had a confirmation), recording an
 * eligibility decision, recording an action against a safety event,
 * moving a safety event's state — including to Resolved — and switching
 * matching on. Every other one asked.
 *
 * What this file can and cannot check:
 *
 * - It CAN check that a component calling a confirmed-sending client
 *   function has a confirmation gate at all. That is what caught the
 *   safety screen, which had none.
 * - It CANNOT tell, by reading, whether a *particular* call is behind
 *   that gate. Three of the five were on screens that already confirmed
 *   something else, and the confirmation had been written for the other
 *   action. Those are held by the behavioural tests on each screen, and
 *   the inventory below exists so a new pairing has to be looked at by a
 *   person rather than appearing quietly.
 */
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

/**
 * Client functions whose request body carries a confirmation — either as
 * the literal `confirmed: true`, or forwarded from a parameter, which is
 * the honest shape and the one the rest should move to. The declaration
 * of that parameter is not a body key, so it is excluded.
 */
function confirmingClientFunctions(): string[] {
  const names = new Set<string>();
  for (const file of ['api.ts', 'staff-api.ts']) {
    const lines = readFileSync(join(SRC, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      const code = line.trim();
      if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) return;
      if (!/\bconfirmed\b/.test(code) || /confirmed\??: boolean/.test(code)) return;
      for (let j = i; j >= 0; j--) {
        const m = /^ {2}(\w+):/.exec(lines[j]!);
        if (m) {
          names.add(m[1]!);
          return;
        }
      }
    });
  }
  return [...names].sort();
}

function callers(): { component: string; fn: string }[] {
  const fns = confirmingClientFunctions();
  const found: { component: string; fn: string }[] = [];
  for (const path of walk(SRC)) {
    const src = readFileSync(path, 'utf8');
    for (const fn of fns) {
      if (new RegExp(`(?:staffApi|api)\\.${fn}\\(`).test(src)) {
        found.push({ component: path.slice(SRC.length + 1).replaceAll('\\', '/'), fn });
      }
    }
  }
  // Plain code-unit order, so the checked-in list below is stable rather
  // than depending on the locale the suite happens to run under.
  return found.sort((a, b) => (`${a.component} → ${a.fn}` < `${b.component} → ${b.fn}` ? -1 : 1));
}

describe('the confirmation tier is confirmed by a person, not by the api client', () => {
  it('the tier is not empty, and the catalogue is where it is defined', () => {
    const catalogue = readFileSync(POLICY, 'utf8');
    const tier = [...catalogue.matchAll(/'([a-z0-9.-]+)'\s*:\s*\{([^}]*)\}/g)]
      .filter((m) => m[2]!.includes('confirmationRequired: true'))
      .map((m) => m[1]!);
    expect(tier.length).toBeGreaterThan(40);
    // The five this sweep found, so the list cannot quietly lose them.
    for (const a of [
      'intervention.approve',
      'eligibility.decide',
      'safety-event.act',
      'matching.activate',
    ]) {
      expect(tier, `${a} should be in the confirmation tier`).toContain(a);
    }
  });

  /**
   * A screen that sends `confirmed: true` and has no way of asking
   * anybody anything is confirming on the caller's behalf. This is the
   * check the safety screen failed.
   */
  it('every screen that sends a confirmation can ask for one', () => {
    const ungated = [...new Set(callers().map((c) => c.component))].filter((component) => {
      const src = readFileSync(join(SRC, component), 'utf8');
      return !src.includes('role="alertdialog"') && !src.includes('ConfirmDecision');
    });
    expect(ungated, 'these screens send confirmed: true with no confirmation of any kind').toEqual([]);
  });

  /**
   * The inventory. Adding a confirmation-tier call to a screen changes
   * this list, and the change is the prompt to check that the screen asks
   * before that particular call — which reading the file cannot tell you.
   */
  it('the set of screens sending confirmations is the reviewed one', () => {
    expect(callers().map((c) => `${c.component} → ${c.fn}`)).toEqual([
      'components/AccountsAndRoles.tsx → revokeRole',
      'components/CommunityPanel.tsx → leaveCommunity',
      'components/CommunityPanel.tsx → publishSocialPost',
      'components/ConsentPanel.tsx → withdrawConsent',
      'components/MatchingPanel.tsx → activateConnection',
      'components/MatchingPanel.tsx → activateMatching',
      'components/MatchingPanel.tsx → deactivateMatching',
      'components/MatchingPanel.tsx → matchDecision',
      'components/MessagePanel.tsx → confirmSend',
      'components/MessagesScreen.tsx → endConnection',
      'components/MyDataCopy.tsx → requestMyExport',
      'components/MyLifeStory.tsx → confirmTestimony',
      'components/MyLifeStory.tsx → removeFile',
      'components/MyLifeStory.tsx → withdrawLifeStoryItem',
      'components/MyResearchPart.tsx → withdrawFromStudy',
      'components/SafetyEvents.tsx → moveSafetyEvent',
      'components/SafetyEvents.tsx → recordSafetyAction',
      'components/SafetyPanel.tsx → createBlock',
      'components/SafetyPanel.tsx → revokeBlock',
      'components/StaffCoordinatorPanel.tsx → eligibilityDecision',
      'components/StaffCoordinatorPanel.tsx → withdrawEnrolment',
      'components/StaffGovernancePanel.tsx → recordBreakGlass',
      'components/StaffGovernancePanel.tsx → reviewBreakGlass',
      'components/StaffModeratorPanel.tsx → recordModerationDecision',
      'components/StaffSafetyTriagePanel.tsx → triageSignal',
      'components/WhoHasAccess.tsx → approveRelationship',
      'components/approver/AnalysisDecisions.tsx → approveAnalysisPlan',
      'components/approver/AnalysisDecisions.tsx → approveInterpretation',
      'components/approver/AnalysisDecisions.tsx → approveResearchFinding',
      'components/approver/AnalysisDecisions.tsx → rejectAnalysisPlan',
      'components/approver/AnalysisDecisions.tsx → rejectResearchFinding',
      'components/approver/ApprovalRecords.tsx → decideApproval',
      'components/approver/DatasetDefinitions.tsx → approveDatasetDefinition',
      'components/approver/DatasetLock.tsx → lockDatasetVersion',
      'components/approver/EvidenceDecisions.tsx → approveEvidenceDecision',
      'components/approver/EvidenceDecisions.tsx → rejectEvidenceDecision',
      'components/approver/EvidenceReviews.tsx → approveEvidenceReview',
      'components/approver/EvidenceReviews.tsx → returnEvidenceReview',
      'components/approver/ExportDecisions.tsx → decideExport',
      'components/approver/InterventionDecisions.tsx → activateInterventionVersion',
      'components/approver/InterventionDecisions.tsx → approveInterventionVersion',
      'components/approver/ProtocolDecisions.tsx → activateProtocolVersion',
      'components/approver/ProtocolDecisions.tsx → approveProtocolVersion',
      'components/approver/ProtocolDecisions.tsx → rejectProtocolVersion',
      'components/approver/ReConsent.tsx → requireReConsent',
      'components/approver/ReportDecisions.tsx → approveReportVersion',
    ]);
  });
});
