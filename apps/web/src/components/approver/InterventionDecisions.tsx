import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../../errors.js';
import { staffApi, type InterventionItem, type StaffSession } from '../../staff-api.js';

/**
 * Approving and activating an intervention version.
 *
 * Both commands existed from the start with routes and no callers, and
 * M06 had no query at all — so an approver had these two decisions to
 * make and no way to learn that anything was waiting. This is the same
 * defect that had left the protocol, dataset, report and evidence queues
 * unreachable, on the module the platform is named after.
 *
 * Driven from the list, so the only control offered on a row is the one
 * that row's state accepts. Approving needs strong authentication and a
 * confirmation; activating needs a confirmation and says what it
 * displaces, because putting one version into use retires the one that
 * was in use, and that is not obvious from the word "activate".
 */
export function InterventionDecisions({ session }: { session: StaffSession }) {
  const [items, setItems] = useState<InterventionItem[] | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [activating, setActivating] = useState<{ versionId: string; label: string; displaces: string | null } | null>(
    null,
  );

  const load = async () => {
    try {
      const res = await staffApi.listInterventions(session);
      setItems(res.data.map((i) => i.attributes));
      setError('');
    } catch (err) {
      setError(staffLoadError(err, 'the interventions waiting for a decision'));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
      await load();
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That decision'));
    }
  };

  const waiting = (items ?? []).flatMap((i) =>
    i.versions
      .filter((v) => v.versionState === 'In Review' || v.versionState === 'Approved')
      .map((v) => ({
        intervention: i,
        version: v,
        activeVersion: i.versions.find((o) => o.versionState === 'Active') ?? null,
      })),
  );

  return (
    <section aria-labelledby="int-decisions-heading">
      <h2 id="int-decisions-heading">Intervention versions</h2>
      <p>
        Two decisions live here: approving a submitted version, and putting an approved one into use. You cannot
        approve a version you submitted — the server refuses it and so does the database.
      </p>
      <p>
        Approving needs strong authentication. You are signed in with{' '}
        {session.authStrength === 'mfa' ? 'strong authentication' : 'a password, so approving will be refused'}.
      </p>
      <p>
        <button onClick={() => void load()}>Refresh</button>
      </p>
      {error !== '' && <p role="alert">{error}</p>}
      {items !== null && waiting.length === 0 && (
        <p>Nothing is waiting for a decision. Versions still in draft have not been submitted to anyone.</p>
      )}

      {waiting.map(({ intervention, version, activeVersion }) => (
        <article key={version.interventionVersionId} aria-label={`Version ${version.interventionVersionId}`}>
          <h4>
            {intervention.interventionCode} — {intervention.name}, version {version.versionNumber}
          </h4>
          <p>
            {version.versionState === 'In Review'
              ? `Submitted by ${version.submittedByActorId ?? 'somebody not recorded'}, waiting for a decision.`
              : `Approved by ${version.approvedByActorId ?? 'somebody not recorded'}. Not in use yet.`}
          </p>
          {version.versionState === 'In Review' && (
            <p>
              <button
                onClick={() =>
                  void run(
                    () => staffApi.approveInterventionVersion(session, version.interventionVersionId),
                    'Approved in your name. It is not in use until somebody activates it.',
                  )
                }
              >
                Approve version {version.versionNumber}
              </button>{' '}
              <small>Approving does not put it into use. That is the separate step below, once it is approved.</small>
            </p>
          )}
          {version.versionState === 'Approved' && (
            <p>
              <button
                onClick={() =>
                  setActivating({
                    versionId: version.interventionVersionId,
                    label: `${intervention.interventionCode} version ${version.versionNumber}`,
                    displaces: activeVersion === null ? null : `version ${activeVersion.versionNumber}`,
                  })
                }
              >
                Put version {version.versionNumber} into use
              </button>
            </p>
          )}
        </article>
      ))}

      {activating !== null && (
        <div role="alertdialog" aria-labelledby="int-activate-confirm">
          <p id="int-activate-confirm">Put {activating.label} into use?</p>
          {/*
            The consequence the word "activate" hides: one version at a
            time is in use, enforced by a unique index, so this does not
            add — it replaces.
          */}
          <p>
            {activating.displaces === null
              ? 'Nothing is in use for this intervention yet, so this does not replace anything.'
              : `This replaces ${activating.displaces}, which stops being the one in use at that moment.`}
          </p>
          <p>
            Study configurations that already name an exact version keep naming it. Nothing already recorded is
            rewritten by this.
          </p>
          <p>
            <button
              onClick={() => {
                const target = activating;
                setActivating(null);
                void run(
                  () => staffApi.activateInterventionVersion(session, target.versionId),
                  'It is now the version in use.',
                );
              }}
            >
              Yes, put it into use
            </button>{' '}
            <button onClick={() => setActivating(null)}>Go back</button>
          </p>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
