-- Up Migration
-- Whether somebody was helping, on the consent state anyone can read.
--
-- `consent_decisions.assistance_recorded` has existed since the consent
-- tables were written and no code has ever set it. Meanwhile the platform
-- has assisted mode, and a chat message sent while somebody was helping
-- carries `sent_with_assistance` and says so to its recipient. So the
-- platform records that a person had help writing "I'll bring the
-- seedlings on Thursday", and records nothing about whether anybody was
-- sitting beside them when they agreed to take part in the study.
--
-- For a study about older people that is the wrong way round. Whether
-- someone was present when a person consented is exactly the fact an
-- ethics reviewer, a later question about capacity, or the participant
-- themselves would need, and it cannot be reconstructed afterwards.
--
-- The history column is where the fact belongs; this one is on the
-- projection so the participant's own consent screen can say it about
-- the choice standing right now, without reading the whole history.
--
-- What is NOT recorded, here or anywhere, is who was helping. The
-- helper's name is entered by the participant and never leaves their
-- device (D-15). Recording "somebody was present" is a fact about the
-- circumstances; recording their name would make the participant's
-- household a matter of study record.

ALTER TABLE consent_permission.consent_current
  ADD COLUMN assistance_recorded boolean NOT NULL DEFAULT false;

-- Down Migration
ALTER TABLE consent_permission.consent_current DROP COLUMN assistance_recorded;
