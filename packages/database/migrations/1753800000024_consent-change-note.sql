-- Up Migration
-- Somewhere to say what changed, when a participant is asked to agree
-- again.
--
-- `decision` has permitted 'ReConsentRequired' since the consent tables
-- were written, and no code has ever set it. The permission engine reads
-- that value and stops the affected access until the participant agrees
-- again (engine.ts step 5), and `assert.ts` carries a message for the
-- outcome. So the platform has a complete, working mechanism for "the
-- terms you agreed to have changed" - and nothing anywhere can trigger
-- it. A consent text can be revised and every participant carries on
-- under an agreement to wording that no longer exists.
--
-- Asking somebody to agree again without saying what changed is not a
-- request, it is an obstruction: they cannot judge the thing they are
-- being asked to judge. The column exists so the demand cannot be made
-- silently - the command that writes 'ReConsentRequired' requires it.
--
-- Nullable, because an ordinary Granted or Withdrawn decision has nothing
-- to explain: the participant made it themselves and knows why.

ALTER TABLE consent_permission.consent_decisions
  ADD COLUMN decision_note text;

ALTER TABLE consent_permission.consent_current
  ADD COLUMN decision_note text;

-- Down Migration
ALTER TABLE consent_permission.consent_current DROP COLUMN decision_note;
ALTER TABLE consent_permission.consent_decisions DROP COLUMN decision_note;
