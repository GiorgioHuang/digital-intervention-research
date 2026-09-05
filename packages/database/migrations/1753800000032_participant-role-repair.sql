-- Up Migration
-- Every account with a participant record holds the Participant role.
--
-- Nothing on this platform ever assigned that role except a member of
-- staff on the accounts screen. So everybody who arrived through the
-- door — Google sign-in, which creates the account and the participant
-- record together — had a participant record and no role.
--
-- Almost everything still worked, which is why it went unnoticed: every
-- other action the Participant role carries is owner-only, and the
-- permission engine allows an owner without consulting roles at all. The
-- exceptions are the two actions that read what somebody ELSE shared —
-- `life-story.view-shared` and `object.view-shared` — and those resources
-- are marked protected-existence, so the denial came back as 404. The
-- community feed and "stories shared with me" therefore answered "this
-- item cannot be opened right now" for every real person on the platform.
--
-- The sign-in path now keeps this invariant, but only at a sign-in: an
-- account with a live session would stay broken until it signed out. This
-- repairs the ones already here, at deploy, without anybody having to.
--
-- Narrow on purpose:
--   * only accounts that have a participant record — a supporter is not a
--     participant and must not be given the study's own actions;
--   * only accounts with NO Participant assignment of any state, so a role
--     somebody revoked or suspended stays revoked. A repair that undid a
--     decision would be worse than the fault it fixes.

INSERT INTO identity_org.role_assignments
  (id, user_account_id, role, assignment_state, assigned_by_actor_id)
SELECT
  'ra_repair_' || substr(md5(p.user_account_id), 1, 24),
  p.user_account_id,
  'Participant',
  'Active',
  'system-registration'
FROM participant_profile.participants p
WHERE p.user_account_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM identity_org.role_assignments ra
     WHERE ra.user_account_id = p.user_account_id AND ra.role = 'Participant'
  );

-- Down Migration
-- Removes only what the repair inserted, identified by the assigning
-- actor and the deterministic id above — never a role a person granted.
DELETE FROM identity_org.role_assignments
 WHERE role = 'Participant'
   AND assigned_by_actor_id = 'system-registration'
   AND id LIKE 'ra_repair_%';
