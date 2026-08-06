import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type AccountItem, type RoleAssignmentItem, type StaffSession } from '../staff-api.js';

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

export function AccountsAndRoles({ session }: { session: StaffSession }) {
  const [accounts, setAccounts] = useState<AccountItem[] | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [revoking, setRevoking] = useState<{ account: AccountItem; role: RoleAssignmentItem } | null>(null);

  const load = async () => {
    try {
      const res = await staffApi.listOrganisationAccounts(session);
      // Defaulted rather than trusted: this section sits beside the
      // participant list, and a malformed payload here should not take
      // that screen down with it.
      setAccounts(res.data.map((a) => ({ ...a.attributes, roles: a.attributes.roles ?? [] })));
      setError('');
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
        Everyone holding a role in this organisation, and what that role is. A role is what somebody may do; taking it
        back stops that at the next thing they try.
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
        <p>No accounts hold a role in this organisation. Accounts are created outside this product for now.</p>
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
                Holds no role that is in force. They can sign in, and every action will be refused — the platform has
                no way to stop them signing in.
              </p>
            )}
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
