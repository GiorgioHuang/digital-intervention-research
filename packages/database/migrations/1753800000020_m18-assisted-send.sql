-- Up Migration
-- Assisted mode (decision D-15): a participant may have someone helping
-- them use the app. The decision is READ-ONLY assistance — the helper
-- never acts on the participant's behalf, so there is no second identity
-- to record and no action to attribute to anyone but the participant.
--
-- What does need recording is that a message left a screen someone else
-- could see. The recipient is told, because the alternative is a
-- conversation whose audience is larger than one party believes it to be.
-- Only the fact is stored, never who was helping: naming the helper would
-- put a third party the recipient has no relationship with into their
-- conversation, and the helper's identity is not the recipient's business.

ALTER TABLE community_social.messages
  ADD COLUMN sent_with_assistance boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN community_social.messages.sent_with_assistance IS
  'True when the participant confirmed this send while someone was helping them (decision D-15). Records the fact only, never the helper.';

-- Down Migration
ALTER TABLE community_social.messages DROP COLUMN sent_with_assistance;
