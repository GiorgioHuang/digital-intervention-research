import { useEffect, useState } from 'react';
import { api, type MyRelationship, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';

/**
 * Who has access to this participant, and on what terms.
 *
 * Approving and revoking a relationship have always been owner-only, so
 * the participant is the only person who may let a supporter in or shut
 * one out. Nothing listed relationships, which made both unreachable: a
 * proposal sat waiting on an approval the participant could not see they
 * had been asked for, and an active relationship could not be ended by
 * the only person entitled to end it.
 *
 * This is the other half of the consent screen. Consent answers what may
 * be done with the participant's information; this answers by whom. The
 * permission engine requires both, so a workspace that shows only one
 * cannot tell anyone what is actually true of their data.
 */

/**
 * Exactly the two actions a relationship can carry today, said plainly.
 * Anything else is shown as its own key rather than guessed at — a
 * confident-sounding description of an access right nobody has checked is
 * worse than an unfamiliar word.
 */
const ACTION_WORDING: Record<string, string> = {
  'participant.view-shared': 'See the parts of your information you have agreed to share with supporters',
  'life-story.contribute': 'Offer something for your life story — which only you can accept',
};

const TYPE_WORDING: Record<string, string> = {
  FamilyMember: 'Family member',
  Friend: 'Friend',
  InformalCaregiver: 'Someone who helps care for you',
  ProfessionalCaregiver: 'A professional carer',
  CommunityVolunteer: 'A community volunteer',
  ResearchStaff: 'Research staff',
  SubstituteDecisionMaker: 'Someone appointed to decide for you',
  SupportedDecisionMakingAssistant: 'Someone who helps you decide',
  OrganisationMember: 'Someone from an organisation',
  OtherApproved: 'Someone else who was approved',
};

/**
 * `PendingVerification` reads the same as `Proposed` on purpose. It is
 * the state every relationship is created in, and nothing in the platform
 * verifies anything from it — the participant's decision is the only
 * transition out. Wording it as "their details are being checked" would
 * describe a check nobody performs, and would invite someone to approve
 * on the strength of it.
 */
const STATE_WORDING: Record<string, string> = {
  Proposed: 'Waiting for you to decide.',
  PendingVerification: 'Waiting for you to decide.',
  Active: 'Has access now.',
  Restricted: 'Has limited access.',
  Suspended: 'Access is paused.',
  Expired: 'This ran out and no longer gives any access.',
  Revoked: 'You ended this. It gives no access.',
  Rejected: 'You said no to this. It gives no access.',
};

const AWAITING = new Set(['Proposed', 'PendingVerification']);
const LIVE = new Set(['Active', 'Restricted', 'Suspended']);

export function WhoHasAccess({ session }: { session: Session }) {
  const [items, setItems] = useState<MyRelationship[] | null>(null);
  const [loadError, setLoadError] = useState<PresentedError | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [deciding, setDeciding] = useState<MyRelationship | null>(null);
  const [ending, setEnding] = useState<MyRelationship | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const load = async () => {
    try {
      setItems((await api.listMyRelationships(session)).data.map((d) => d.attributes));
      setLoadError(null);
    } catch (err) {
      setLoadError(presentError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (fn: () => Promise<unknown>, said: string) => {
    try {
      await fn();
      setActionError(null);
      setDeciding(null);
      setEnding(null);
      setAnnouncement(said);
      await load();
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const who = (r: MyRelationship) => r.relatedDisplayName ?? r.relatedActorId;

  return (
    <section aria-labelledby="access-heading">
      <h1 id="access-heading">Who has access to me</h1>
      <p>
        Nobody gets access to your information because someone else agreed to it. Every entry here was either agreed
        to by you, or is still waiting for you.
      </p>

      {items === null && loadError === null && <LoadingState label="Loading who has access to you…" />}
      {loadError !== null && <ErrorState error={loadError} />}
      {items !== null && items.length === 0 && (
        <EmptyState
          title="Nobody has access to your information"
          detail="If someone asks for access, they will appear here and nothing happens until you decide."
        />
      )}

      {(items ?? []).map((r) => (
        <article key={r.relationshipId} aria-label={`Access for ${who(r)}`}>
          <h2>{who(r)}</h2>
          <p>
            {TYPE_WORDING[r.relationshipType] ?? r.relationshipType} — {STATE_WORDING[r.relationshipState] ?? r.relationshipState}
          </p>
          {r.permittedActions.length === 0 ? (
            <p>This gives no particular access on its own.</p>
          ) : (
            <>
              <p>What this would let them do:</p>
              <ul>
                {r.permittedActions.map((a) => (
                  <li key={a}>{ACTION_WORDING[a] ?? a}</li>
                ))}
              </ul>
            </>
          )}
          {r.expiresAt !== null && <p>This runs out on {new Date(r.expiresAt).toLocaleDateString()}.</p>}
          <p>
            Even with this, they still only see what your consent choices allow. Ending it here does not change your
            consent choices, and changing your consent choices does not end this.
          </p>

          {AWAITING.has(r.relationshipState) && (
            <p>
              <button onClick={() => setDeciding(r)}>Decide about this</button>
            </p>
          )}
          {LIVE.has(r.relationshipState) && (
            <p>
              <button onClick={() => setEnding(r)}>End this person's access</button>
            </p>
          )}

          {deciding?.relationshipId === r.relationshipId && (
            <div role="alertdialog" aria-labelledby={`decide-${r.relationshipId}`}>
              <h3 id={`decide-${r.relationshipId}`}>Give {who(r)} this access?</h3>
              <p>
                Nothing has been given yet. If you agree, they can do the things listed above from that moment, and
                you can end it again whenever you want.
              </p>
              <p>
                <button onClick={() => void run(() => api.approveRelationship(session, r.relationshipId, r.recordVersion), 'Access given. You can end it at any time.')}>
                  Yes, give this access
                </button>{' '}
                <button onClick={() => void run(() => api.revokeRelationship(session, r.relationshipId, r.recordVersion), 'Not given. They have no access.')}>
                  No, refuse it
                </button>{' '}
                <button onClick={() => setDeciding(null)}>Decide later</button>
              </p>
            </div>
          )}

          {ending?.relationshipId === r.relationshipId && (
            <div role="alertdialog" aria-labelledby={`end-${r.relationshipId}`}>
              <h3 id={`end-${r.relationshipId}`}>End {who(r)}'s access?</h3>
              <p>
                They stop being able to do the things listed above. Anything they already saw, they have already
                seen — ending access cannot unsee it. Anything they wrote and you accepted stays where it is.
              </p>
              <p>You do not have to give a reason, and they are not told why.</p>
              <p>
                <button onClick={() => void run(() => api.revokeRelationship(session, r.relationshipId, r.recordVersion), 'Ended. They no longer have this access.')}>
                  Yes, end it
                </button>{' '}
                <button onClick={() => setEnding(null)}>Leave it as it is</button>
              </p>
            </div>
          )}
        </article>
      ))}

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
