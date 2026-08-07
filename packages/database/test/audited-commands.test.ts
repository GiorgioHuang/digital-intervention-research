import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULES = join(process.cwd(), '..', 'modules');

/**
 * Which commands that change something write an audit event, and which
 * do not.
 *
 * The audit screen tells its reader, before they read a row, what the
 * record does not contain: no reads, and no refused attempts. Both are
 * true. It then says **"Only actions that changed something are written
 * here"**, which a reader takes to mean that everything that changed
 * something is — and that was not true. Thirty-nine application commands
 * write to the database and record nothing, including the two that
 * attach data to a participant's enrolment. Somebody asking what had
 * been recorded about them would have been shown a record with those
 * missing and no sign that anything was.
 *
 * Delivery and assessment are fixed. The rest are listed below with
 * where they sit, so the gap is visible rather than implied, and so the
 * screen's wording and the code cannot drift apart: the screen now says
 * this is a partial record, and it stays honest only while this list is
 * non-empty. When the list empties, that sentence has to change too, and
 * this test will be what says so.
 *
 * The check walks calls within a file, because several modules do the
 * write and the audit in a shared helper — M05's enrolment transitions
 * are audited that way, and a rule that only looked at the command body
 * would have called withdrawal unaudited.
 */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    if (e === 'node_modules' || e === 'dist' || e === 'test' || e === 'contracts' || e === 'infrastructure') return [];
    const p = join(dir, e);
    return statSync(p).isDirectory() ? sources(p) : p.endsWith('.ts') ? [p] : [];
  });
}

/** Every function in a file, by name, with its body. */
function functions(src: string): Map<string, string> {
  const table = new Map<string, string>();
  const marks = [...src.matchAll(/\n(?:export )?(?:async )?function (\w+)/g)];
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1]!.index! : src.length;
    table.set(m[1]!, src.slice(m.index!, end));
  });
  return table;
}

function reaches(table: Map<string, string>, name: string, test: (body: string) => boolean): boolean {
  const seen = new Set<string>();
  const walk = (n: string): boolean => {
    if (seen.has(n) || !table.has(n)) return false;
    seen.add(n);
    const body = table.get(n)!;
    if (test(body)) return true;
    return [...new Set([...body.matchAll(/\b(\w+)\(/g)].map((m) => m[1]!))].some(walk);
  };
  return walk(name);
}

function unaudited(): string[] {
  const found: string[] = [];
  for (const file of sources(MODULES)) {
    if (!file.replaceAll('\\', '/').includes('/src/application')) continue;
    const src = readFileSync(file, 'utf8');
    const table = functions(src);
    const module = file.replaceAll('\\', '/').split('/modules/')[1]!.split('/')[0]!;
    for (const m of src.matchAll(/\nexport async function (\w+)/g)) {
      const name = m[1]!;
      const writes = reaches(table, name, (b) => /\b(INSERT INTO|UPDATE )/.test(b));
      const audits = reaches(table, name, (b) => b.includes('recordAuditEvent'));
      if (writes && !audits) found.push(`${module} ${name}`);
    }
  }
  return [...new Set(found)].sort();
}

describe('commands that change something and record nothing', () => {
  /**
   * Equality, not containment: a new unaudited command cannot appear
   * quietly, and auditing one of these fails until it is struck off.
   */
  it('are exactly the ones written down here', () => {
    expect(unaudited()).toEqual([
      'm09-safety recordSafetySignal',
      'm10-evidence approveEvidenceReview',
      'm10-evidence draftEvidenceDecision',
      'm10-evidence rejectEvidenceDecision',
      'm10-evidence returnEvidenceReviewForRevision',
      'm10-evidence submitEvidenceReview',
      'm12-dataset approveDatasetDefinition',
      'm12-dataset completeQualityReview',
      'm12-dataset createDatasetDefinition',
      'm12-dataset generateDatasetVersion',
      'm13-analysis approveAnalysisPlan',
      'm13-analysis approveInterpretation',
      'm13-analysis draftAnalysisPlan',
      'm13-analysis draftInterpretation',
      'm13-analysis draftResearchFinding',
      'm13-analysis rejectAnalysisPlan',
      'm13-analysis runAnalysis',
      'm16-integration completeUpload',
      'm16-integration handleProviderCallback',
      'm16-integration scanObject',
      'm16-integration scanPendingObjects',
      'm17-life-story proposeContribution',
      'm17-life-story reviewContribution',
      'm17-life-story reviseItem',
      'm18-community-social createCommunitySpace',
      'm18-community-social createMessageDraft',
      'm18-community-social createThread',
      'm18-community-social draftSocialPost',
      'm18-community-social generateMatchCandidate',
      'm18-community-social joinCommunity',
      'm18-community-social leaveCommunity',
      'm18-community-social publishSocialPost',
      'm18-community-social recordDeliveryState',
      'm18-community-social recordMatchDecision',
      'm18-community-social reviseMessageDraft',
      'm18-community-social revokeBlock',
      'm18-community-social submitUserReport',
    ]);
  });

  /**
   * The two that attach data to a participant's enrolment — the only two
   * tables in the database carrying an enrolment_id — are the ones a
   * participant's own accountability record most obviously has to hold.
   */
  it('no longer include recording a delivery or an assessment', () => {
    const list = unaudited();
    expect(list).not.toContain('m07-delivery recordInterventionSession');
    expect(list).not.toContain('m08-assessment recordAssessment');
  });

  /**
   * While anything is on that list, the screen must not let its reader
   * believe the record is complete. The sentence is read out of the
   * component rather than restated, so the two cannot drift.
   */
  it('the audit screen says the record is partial while it is', () => {
    const screen = readFileSync(
      join(process.cwd(), '..', '..', 'apps', 'web', 'src', 'components', 'AuditAccess.tsx'),
      'utf8',
    );
    expect(unaudited().length).toBeGreaterThan(0);
    expect(screen).toMatch(/not every change/i);
    // And the sentence that was not true must not come back.
    expect(screen).not.toMatch(/Only actions that changed something are written here/);
  });
});
