-- Up Migration
-- Self-signup, and what an invitation actually carries (owner's ruling,
-- 2026-08-08: anyone may register; registering shows you nobody else;
-- arriving on an invitation is what shows you the person who invited you).
--
-- The first half of that ruling needed no schema — an account with no role
-- assignments already reaches nothing but its own resources, because the
-- permission engine denies with 'no-granting-role' unless the actor either
-- holds a granting role or owns the resource. What needed schema is the
-- second half: an invitation has to be able to say what it grants, rather
-- than only which account it belongs to.

-- An invitation no longer has to point at an account somebody created in
-- advance. Two shapes now exist, and they answer different needs:
--
--   user_account_id SET  — staff onboarding: an administrator created the
--                          account, assigned its roles, and the invitation
--                          is how its holder claims it.
--   user_account_id NULL — a participant inviting somebody into their own
--                          circle: there is no account yet, and whoever
--                          claims the invitation gets one.
ALTER TABLE identity_org.account_invitations
  ALTER COLUMN user_account_id DROP NOT NULL;

ALTER TABLE identity_org.account_invitations
  -- The participant whose information this invitation opens up, and
  -- exactly which actions on it. Null for an invitation that grants no
  -- relationship at all (staff onboarding, where access comes from a role).
  --
  -- This is the mechanism behind "only somebody who arrived on an
  -- invitation sees the person who invited them": the relationship IS the
  -- grant, it is scoped to named actions, and the permission engine still
  -- re-decides every request against consent, purpose and state. An
  -- invitation opens a door; it does not hand over a room.
  ADD COLUMN relationship_participant_id text,
  ADD COLUMN relationship_type text CHECK (relationship_type IN (
        'FamilyMember', 'Friend', 'InformalCaregiver', 'ProfessionalCaregiver',
        'CommunityVolunteer', 'ResearchStaff', 'SubstituteDecisionMaker',
        'SupportedDecisionMakingAssistant', 'OrganisationMember', 'OtherApproved')),
  ADD COLUMN relationship_permitted_actions text[] NOT NULL DEFAULT '{}',
  -- Whether claiming this makes the person a Participant in their own
  -- right. A supporter invited to help somebody is not thereby enrolled as
  -- a research participant, and creating one for them would put a person
  -- into a study nobody consented on their behalf to.
  ADD COLUMN creates_participant boolean NOT NULL DEFAULT false;

-- Half a relationship grant is not a grant. Without this, an invitation
-- naming a participant but no actions would claim cleanly and grant
-- silently nothing, which reads as "the invitation was broken" only after
-- somebody spends an afternoon on it.
ALTER TABLE identity_org.account_invitations
  ADD CONSTRAINT account_invitations_relationship_complete
  CHECK (
    (relationship_participant_id IS NULL) = (relationship_type IS NULL)
    AND (relationship_participant_id IS NULL OR cardinality(relationship_permitted_actions) > 0)
  );

-- An invitation has to do SOMETHING. One that neither points at an account
-- nor grants a relationship nor creates a participant is an email that
-- signs somebody in as a stranger to everything — indistinguishable, from
-- the outside, from ordinary self-signup, and therefore a thing somebody
-- would send and then wonder about.
ALTER TABLE identity_org.account_invitations
  ADD CONSTRAINT account_invitations_grants_something
  CHECK (
    user_account_id IS NOT NULL
    OR relationship_participant_id IS NOT NULL
    OR creates_participant
  );

CREATE INDEX account_invitations_relationship
  ON identity_org.account_invitations (relationship_participant_id)
  WHERE relationship_participant_id IS NOT NULL;

-- How an account came to exist. Not decorative: "who let this person in"
-- is a question this platform has to be able to answer about every
-- account, and once self-signup exists the answer is no longer "somebody
-- did" for all of them. A self-registered account reaching data it should
-- not is a very different incident from an invited one doing so, and
-- telling them apart afterwards requires having written it down at the
-- time.
ALTER TABLE identity_org.user_accounts
  ADD COLUMN origin text NOT NULL DEFAULT 'created-by-administrator'
    CHECK (origin IN ('created-by-administrator', 'self-registered', 'invitation'));

-- Down Migration
ALTER TABLE identity_org.user_accounts DROP COLUMN origin;
DROP INDEX identity_org.account_invitations_relationship;
ALTER TABLE identity_org.account_invitations
  DROP CONSTRAINT account_invitations_grants_something,
  DROP CONSTRAINT account_invitations_relationship_complete,
  DROP COLUMN creates_participant,
  DROP COLUMN relationship_permitted_actions,
  DROP COLUMN relationship_type,
  DROP COLUMN relationship_participant_id;
ALTER TABLE identity_org.account_invitations
  ALTER COLUMN user_account_id SET NOT NULL;
