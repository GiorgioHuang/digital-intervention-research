import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import {
  staffApi,
  type AccountItem,
  type InvitationItem,
  type RoleAssignmentItem,
  type StaffSession,
} from '../staff-api.js';

/**
 * Who holds what, and taking it back (G3).
 *
 * `revokeRole` has existed since M01 was written — with its permission
 * check, its optimistic version guard, its domain event and its audit
 * entry — and no route and no screen anywhere. `user.view` was granted to
 * the organisation administrator and the coordinator and checked by no
 * code at all, and nothing listed an account or a role.
 *
 * So access on this platform could be given and never taken back. A
 * coordinator who left the study, a researcher whose involvement ended,
 * an account that should have been shut down — none of it could be
 * touched from any screen, and the only thing between a former colleague
 * and a participant's records was that nobody had thought to look.
 *
 * Two things this screen must not overstate.
 *
 * Revoking a role is not closing an account. `account_state` exists with
 * five values and no code writes any of them, so an account is 'Active'
 * because that is the column default and not because anybody decided it.
 * Showing that as a status would answer a question the platform was never
 * asked, so the screen says the state is not maintained and that removing
 * every role is the only way to stop somebody.
 *
 * And revoking removes what a person may do next, not what they did. The
 * records they wrote stay, their name stays on their decisions, and the
 * audit trail keeps their actions — which is the point of an audit trail
 * and would be a surprise to anybody who read "revoke" as "erase".
 */
const ROLE_STATE_WORDING: Record<string, string> = {
  Active: 'in force',
  Proposed: 'proposed, not in force',
  PendingApproval: 'waiting for approval, not in force',
  Suspended: 'suspended',
  Expired: 'expired',
  Revoked: 'taken back',
  Rejected: 'rejected',
};

/**
 * Roles an administrator may hand out from this screen. Deliberately not
 * every role in the catalogue: SystemAdministrator is platform-wide and
 * not an organisation's to give, so it stays a deliberate act elsewhere
 * rather than an option in a dropdown beside ordinary ones.
 */
const GRANTABLE_ROLES = [
  'ResearchCoordinator',
  'Researcher',
  'DataAnalyst',
  'ResearchApprover',
  'EvidenceReviewer',
  'SafetyReviewer',
  'PrivacyReviewer',
  'Moderator',
  'OrganisationAdministrator',
  'Supporter',
] as const;

export function AccountsAndRoles({ session }: { session: StaffSession }) {
  const [accounts, setAccounts] = useState<AccountItem[] | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [revoking, setRevoking] = useState<{ account: AccountItem; role: RoleAssignmentItem } | null>(null);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [invite, setInvite] = useState({ displayName: '', email: '' });
  const [inviting, setInviting] = useState(false);
  /** The address and expiry of the invitation just created, to pass on by
   *  hand — the platform sends nothing. */
  const [justInvited, setJustInvited] = useState<{ email: string; expiresAt: string } | null>(null);
  const [grantingRole, setGrantingRole] = useState<Record<string, string>>({});
  const [inviteHolder, setInviteHolder] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const res = await staffApi.listOrganisationAccounts(session);
      // Defaulted rather than trusted: this section sits beside the
      // participant list, and a malformed payload here should not take
      // that screen down with it.
      setAccounts(res.data.map((a) => ({ ...a.attributes, roles: a.attributes.roles ?? [] })));
      setError('');
      try {
        const pending = await staffApi.listInvitations(session);
        setInvitations(pending.data.map((i) => i.attributes));
      } catch {
        // An invitation list that cannot load must not take the accounts
        // list down with it — they answer different questions and only one
        // of them is on the critical path.
        setInvitations([]);
      }
    } catch (err) {
      setError(staffLoadError(err, 'the accounts in this organisation'));
    }
  };

  /*
   * Nothing is asked for without an organisation. The query refuses an
   * unscoped listing anyway (ORGANISATION_CONTEXT_REQUIRED), and the
   * participant list beside this one already declines to offer itself in
   * that state — making the call regardless would turn a settled rule
   * into a request that happens to fail.
   */
  const scoped = session.organisationId !== undefined && session.organisationId !== '';

  useEffect(() => {
    if (scoped) void load();
  }, []);

  const revoke = async () => {
    if (revoking === null) return;
    const target = revoking;
    setRevoking(null);
    try {
      await staffApi.revokeRole(session, target.role.roleAssignmentId, target.role.recordVersion);
      setAnnouncement(
        `${target.account.displayName} no longer holds ${target.role.role}. What they already did is unchanged.`,
      );
      await load();
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That role'));
    }
  };

  return (
    <section aria-labelledby="accounts-heading">
      <h2 id="accounts-heading">Accounts and roles</h2>
      <p>
        Everyone in this organisation, and what they may do. A role is what somebody may do; taking it back stops that
        at the next thing they try. Somebody who has just claimed an invitation appears here with no role at all —
        that is the state they arrive in, and giving them one is the next step.
      </p>
      {/*
        Said before the list, because the absence is the dangerous part: an
        administrator who assumes accounts can be closed will think they
        have shut somebody out when they have not.
      */}
      <p>
        <strong>There is no way to close an account here.</strong> The platform records an account state but nothing
        ever sets it, so every account reads the same whatever has happened. Removing every role is the only way to
        stop somebody using this platform, and it is what you should do if that is what you mean.
      </p>
      <p>
        Taking a role back does not remove anything the person did. Their name stays on their decisions and the audit
        trail keeps their actions — that is what an audit trail is for.
      </p>
      {!scoped ? (
        <p role="alert">
          You are signed in without an organisation, so there is no set of accounts to show. This is not a permission
          problem — there is nothing here to scope the list to.
        </p>
      ) : (
        <p>
          <button onClick={() => void load()}>Refresh</button>
        </p>
      )}
      {error !== '' && <p role="alert">{error}</p>}
      {accounts !== null && accounts.length === 0 && (
        <p>Nobody is in this organisation yet. Invite somebody below.</p>
      )}

      {(accounts ?? []).map((a) => {
        const active = a.roles.filter((r) => r.assignmentState === 'Active');
        return (
          <article key={a.userAccountId} aria-label={`Account ${a.displayName}`}>
            <h3>
              {a.displayName} {a.actorType === 'service-account' && <span>(service account)</span>}
            </h3>
            <p>
              <small>{a.userAccountId}</small>
            </p>
            {active.length === 0 && (
              <p>
                Holds no role that is in force. They can sign in and see nothing but their own account; every other
                action is refused.
              </p>
            )}
            {/*
              An account nobody can sign in as. Every account made before
              Sign in with Google is in this state — with its roles, its
              history, and no holder. It looks staffed here and is
              unreachable in fact, so the way to reach it belongs next to
              the fact.
            */}
            {a.hasSignIn === false && (
              <>
                <p>
                  <strong>Nobody can sign in as this account.</strong> No Google account is linked to it, so its
                  roles are held by no one. Invite whoever should hold it.
                </p>
                <p>
                  <label htmlFor={`hold-${a.userAccountId}`}>Their Google account address</label>{' '}
                  <input
                    id={`hold-${a.userAccountId}`}
                    type="email"
                    value={inviteHolder[a.userAccountId] ?? ''}
                    onChange={(e) => setInviteHolder({ ...inviteHolder, [a.userAccountId]: e.target.value })}
                  />{' '}
                  <button
                    disabled={(inviteHolder[a.userAccountId] ?? '').trim() === ''}
                    onClick={() => {
                      const email = (inviteHolder[a.userAccountId] ?? '').trim();
                      if (email === '') return;
                      void staffApi
                        .inviteExistingAccountHolder(session, a.userAccountId, email)
                        .then(async (res) => {
                          setInviteHolder({ ...inviteHolder, [a.userAccountId]: '' });
                          setAnnouncement(
                            `Invitation recorded for ${res.data.attributes.invitedEmail}. Nothing has been sent — tell them yourself.`,
                          );
                          await load();
                        })
                        .catch((err: unknown) => setAnnouncement(staffActionError(err, 'That invitation')));
                    }}
                  >
                    Invite its holder
                  </button>
                </p>
              </>
            )}
            {/*
              An account with no role could be listed and never given one:
              assigning was a command with no route and no screen, so every
              new colleague meant somebody writing a row by hand.
            */}
            <p>
              <label htmlFor={`grant-${a.userAccountId}`}>Give a role</label>{' '}
              <select
                id={`grant-${a.userAccountId}`}
                value={grantingRole[a.userAccountId] ?? ''}
                onChange={(e) => setGrantingRole({ ...grantingRole, [a.userAccountId]: e.target.value })}
              >
                <option value="">Choose a role…</option>
                {GRANTABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>{' '}
              <button
                disabled={(grantingRole[a.userAccountId] ?? '') === ''}
                onClick={() => {
                  const role = grantingRole[a.userAccountId] ?? '';
                  if (role === '') return;
                  void staffApi
                    .assignRole(session, a.userAccountId, role)
                    .then(async () => {
                      setGrantingRole({ ...grantingRole, [a.userAccountId]: '' });
                      setAnnouncement(`${a.displayName} now holds ${role}.`);
                      await load();
                    })
                    .catch((err: unknown) => setAnnouncement(staffActionError(err, 'That role')));
                }}
              >
                Give this role
              </button>
            </p>
            <ul>
              {a.roles.map((r) => (
                <li key={r.roleAssignmentId}>
                  <strong>{r.role}</strong> — {ROLE_STATE_WORDING[r.assignmentState] ?? r.assignmentState}
                  {r.researchProjectId === null ? '' : ` · only in project ${r.researchProjectId}`}
                  {r.expiresAt === null ? '' : ` · ends ${new Date(r.expiresAt).toLocaleDateString()}`}
                  <br />
                  <small>
                    Given by {r.assignedByActorId} on {new Date(r.createdAt).toLocaleDateString()}
                    {r.revokedAt === null
                      ? ''
                      : `; taken back by ${r.revokedByActorId ?? 'somebody not recorded'} on ${new Date(
                          r.revokedAt,
                        ).toLocaleDateString()}`}
                  </small>
                  {r.assignmentState === 'Active' && (
                    <p>
                      <button onClick={() => setRevoking({ account: a, role: r })}>Take back this role</button>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </article>
        );
      })}

      <section aria-labelledby="invite-heading">
        <h3 id="invite-heading">Invite somebody</h3>
        {/*
          Stated first and plainly. Every other product that shows this form
          sends a message, so an administrator will assume this one does;
          somebody would then sit waiting for an email that was never going
          to arrive, on both sides.
        */}
        <p>
          <strong>This does not send an email.</strong> It creates the account and records the invitation. You pass the
          address on yourself — tell them to open this platform and sign in with that exact Google account.
        </p>
        <p>
          The address decides one thing only: which invitation their first sign-in may claim. After that they are their
          Google account, so a later change of address does not lock them out — and does not let anybody else in.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (invite.displayName.trim() === '' || invite.email.trim() === '') return;
            setInviting(true);
            setJustInvited(null);
            void staffApi
              .inviteToPlatform(session, { displayName: invite.displayName.trim(), email: invite.email.trim() })
              .then(async (res) => {
                setJustInvited({
                  email: res.data.attributes.invitedEmail,
                  expiresAt: res.data.attributes.expiresAt,
                });
                setInvite({ displayName: '', email: '' });
                setAnnouncement(`Invitation recorded for ${res.data.attributes.invitedEmail}.`);
                await load();
              })
              .catch((err: unknown) => setAnnouncement(staffActionError(err, 'That invitation')))
              .finally(() => setInviting(false));
          }}
        >
          <p>
            <label htmlFor="invite-name">Their name</label>{' '}
            <input
              id="invite-name"
              value={invite.displayName}
              onChange={(e) => setInvite({ ...invite, displayName: e.target.value })}
            />
          </p>
          <p>
            <label htmlFor="invite-email">Their Google account address</label>{' '}
            <input
              id="invite-email"
              type="email"
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
            />
          </p>
          <button type="submit" disabled={inviting || !scoped}>
            {inviting ? 'Recording…' : 'Record invitation'}
          </button>
        </form>
        {justInvited !== null && (
          <p role="status">
            Invitation recorded for <strong>{justInvited.email}</strong>, valid until{' '}
            {new Date(justInvited.expiresAt).toLocaleDateString()}. Nothing has been sent — tell them yourself.
          </p>
        )}

        <h4>Waiting to be claimed</h4>
        {invitations.length === 0 ? (
          <p>Nothing outstanding.</p>
        ) : (
          <ul>
            {invitations.map((i) => (
              <li key={i.invitationId}>
                <strong>{i.invitedEmail}</strong>
                {i.displayName === null ? '' : ` — ${i.displayName}`} · expires{' '}
                {new Date(i.expiresAt).toLocaleDateString()}{' '}
                <button
                  onClick={() => {
                    void staffApi
                      .revokeInvitation(session, i.invitationId)
                      .then(async () => {
                        setAnnouncement(`The invitation to ${i.invitedEmail} has been withdrawn.`);
                        await load();
                      })
                      .catch((err: unknown) => setAnnouncement(staffActionError(err, 'That invitation')));
                  }}
                >
                  Withdraw
                </button>
              </li>
            ))}
          </ul>
        )}
        <p>
          <small>
            An invitation that is never claimed expires on its own. Withdrawing one only works while it is still
            waiting — once somebody has signed in with it, taking their roles back is what stops them.
          </small>
        </p>
      </section>

      {revoking !== null && (
        <div role="alertdialog" aria-labelledby="revoke-confirm">
          <p id="revoke-confirm">
            Take {revoking.role.role} back from {revoking.account.displayName}?
          </p>
          <p>
            From the moment you confirm, anything that role allowed is refused. Work they were part-way through stops
            being possible for them, and nobody is told — not them, and not whoever was relying on them.
          </p>
          <p>
            {revoking.account.roles.filter(
              (r) => r.assignmentState === 'Active' && r.roleAssignmentId !== revoking.role.roleAssignmentId,
            ).length === 0
              ? 'This is their last role in force. Afterwards they can still sign in and everything will be refused; there is no way here to close the account itself.'
              : 'They hold other roles, which are untouched. Taking one back does not stop the others.'}
          </p>
          <p>
            <button onClick={() => void revoke()}>Yes, take it back</button>{' '}
            <button onClick={() => setRevoking(null)}>Go back</button>
          </p>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
