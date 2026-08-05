-- Up Migration
-- Saying no.
--
-- Eight approval commands existed across the platform and not one of them
-- could refuse. Five of the artefacts already carried a refusal in their
-- CHECK constraint - protocol versions and evidence decisions and analysis
-- plans and research findings have 'Rejected', evidence reviews have
-- 'Returned for Revision' - and no code path could ever write any of them.
--
-- A decision screen whose only outcome is approval is not a decision
-- screen. It is worse than an omission: the only way for an approver to
-- clear their queue is to approve everything in it, and the screen says
-- "you can decide this" while offering one move. Separation of duties,
-- exact versions, content hashes and confirmation dialogues are all built
-- on top of a choice that was never there.
--
-- Refusing needs a reason for the same reason the eligibility decision
-- does: the person whose work is refused has to be able to find out why,
-- and the record has to say who decided rather than leaving it to be
-- inferred. The reason lives beside the artefact, written by the module
-- that owns it - there is no shared refusals table, because a row about
-- an evidence review must be written by the evidence module and by nothing
-- else (ADR-008).

ALTER TABLE research_design.protocol_versions
  ADD COLUMN refused_by_actor_id text,
  ADD COLUMN refused_reason      text,
  ADD COLUMN refused_at          timestamptz,
  -- Refusing is the same authority as approving and carries the same
  -- separation of duties: you cannot refuse what you submitted.
  ADD CONSTRAINT protocol_versions_refusal_not_by_submitter
    CHECK (refused_by_actor_id IS NULL OR refused_by_actor_id <> submitted_by_actor_id),
  -- A refusal without a reason is the thing this migration exists to
  -- prevent, so the database refuses it too.
  ADD CONSTRAINT protocol_versions_refusal_has_reason
    CHECK ((refused_by_actor_id IS NULL) = (refused_reason IS NULL));

ALTER TABLE evidence.evidence_reviews
  ADD COLUMN refused_by_actor_id text,
  ADD COLUMN refused_reason      text,
  ADD COLUMN refused_at          timestamptz,
  ADD CONSTRAINT evidence_reviews_refusal_not_by_submitter
    CHECK (refused_by_actor_id IS NULL OR refused_by_actor_id <> submitted_by_actor_id),
  ADD CONSTRAINT evidence_reviews_refusal_has_reason
    CHECK ((refused_by_actor_id IS NULL) = (refused_reason IS NULL));

ALTER TABLE evidence.evidence_decisions
  ADD COLUMN refused_by_actor_id text,
  ADD COLUMN refused_reason      text,
  ADD COLUMN refused_at          timestamptz,
  ADD CONSTRAINT evidence_decisions_refusal_not_by_drafter
    CHECK (refused_by_actor_id IS NULL OR refused_by_actor_id <> drafted_by_actor_id),
  ADD CONSTRAINT evidence_decisions_refusal_has_reason
    CHECK ((refused_by_actor_id IS NULL) = (refused_reason IS NULL));

ALTER TABLE analysis_finding.analysis_plans
  ADD COLUMN refused_by_actor_id text,
  ADD COLUMN refused_reason      text,
  ADD COLUMN refused_at          timestamptz,
  ADD CONSTRAINT analysis_plans_refusal_not_by_drafter
    CHECK (refused_by_actor_id IS NULL OR refused_by_actor_id <> drafted_by_actor_id),
  ADD CONSTRAINT analysis_plans_refusal_has_reason
    CHECK ((refused_by_actor_id IS NULL) = (refused_reason IS NULL));

ALTER TABLE analysis_finding.research_findings
  ADD COLUMN refused_by_actor_id text,
  ADD COLUMN refused_reason      text,
  ADD COLUMN refused_at          timestamptz,
  ADD CONSTRAINT research_findings_refusal_not_by_drafter
    CHECK (refused_by_actor_id IS NULL OR refused_by_actor_id <> drafted_by_actor_id),
  ADD CONSTRAINT research_findings_refusal_has_reason
    CHECK ((refused_by_actor_id IS NULL) = (refused_reason IS NULL));

-- Down Migration
ALTER TABLE analysis_finding.research_findings
  DROP CONSTRAINT research_findings_refusal_has_reason,
  DROP CONSTRAINT research_findings_refusal_not_by_drafter,
  DROP COLUMN refused_at, DROP COLUMN refused_reason, DROP COLUMN refused_by_actor_id;

ALTER TABLE analysis_finding.analysis_plans
  DROP CONSTRAINT analysis_plans_refusal_has_reason,
  DROP CONSTRAINT analysis_plans_refusal_not_by_drafter,
  DROP COLUMN refused_at, DROP COLUMN refused_reason, DROP COLUMN refused_by_actor_id;

ALTER TABLE evidence.evidence_decisions
  DROP CONSTRAINT evidence_decisions_refusal_has_reason,
  DROP CONSTRAINT evidence_decisions_refusal_not_by_drafter,
  DROP COLUMN refused_at, DROP COLUMN refused_reason, DROP COLUMN refused_by_actor_id;

ALTER TABLE evidence.evidence_reviews
  DROP CONSTRAINT evidence_reviews_refusal_has_reason,
  DROP CONSTRAINT evidence_reviews_refusal_not_by_submitter,
  DROP COLUMN refused_at, DROP COLUMN refused_reason, DROP COLUMN refused_by_actor_id;

ALTER TABLE research_design.protocol_versions
  DROP CONSTRAINT protocol_versions_refusal_has_reason,
  DROP CONSTRAINT protocol_versions_refusal_not_by_submitter,
  DROP COLUMN refused_at, DROP COLUMN refused_reason, DROP COLUMN refused_by_actor_id;
