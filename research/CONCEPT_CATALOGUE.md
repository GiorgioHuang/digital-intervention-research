# CONCEPT_CATALOGUE (WP-01)

> The normative concept catalogue. Each entry carries: a definition (with its authority and epistemic label), necessary and sufficient conditions (where they can be given), related concepts, exclusions, points of vagueness, open questions, and **executable evidence** (this repository's distinctive leverage: where a definition has already landed as a code invariant, its test is named). Terminology follows Appendix B v1.1; conceptual definitions follow Doc 1 v2.2 / Doc 2 v2.1. Status: `In Analysis`.

---

## C-01 Healthy Aging

- **Definition** `[Source-Derived: Doc 2 §6.1/§6.15]`: defined in reverse from the Healthy Aging Challenge — the conditions, barriers, transitions and unmet needs that affect a person's capacity to live a meaningful, connected, participating, self-directed later life; a Healthy Aging Outcome is the broader outcome related to functional capacity, participation, relationships, identity, autonomy, meaning and wellbeing.
- **Necessary conditions (analytic)**: it engages one of the dimensions of the capacity to live later life; a population may not be defined by age alone (Doc 2 §6.3).
- **Related**: Proximal Outcome, Process Outcome, Engagement.
- **Excluded** `[Definition]`: the volume of platform activity is not Healthy Aging (Doc 2 §6.12, "Engagement is not automatically benefit"; Doc 18 §227).
- **Point of vagueness** `[Contradiction candidate]`: the Handbook gives no positive sufficient condition for Healthy Aging — only an enumeration of dimensions; and it does not say whether the criterion for "meaningful" is always anchored in the participant's own standpoint or may be assessed externally. → **RQ-S1**.
- **Executable evidence**: none (an outcome-layer concept; the prototype only undertakes not to conflate it — see the tests under C-05).

## C-02 Autonomy

- **Definition** `[Source-Derived: Doc 2 §41]`: the mechanisms include self-determination, perceived control, confidence, reduced coercion and trust; "autonomy can be both an outcome and a safety mechanism".
- **Necessary conditions (as operationalised on this platform)** `[Deductive]`: the choice can be exercised (including refusing, pausing and withdrawing) + the choice is not pre-selected + the consequence is understandable.
- **Related**: Participant Control (C-07); Supported Decision-Making (Appendix B §5: assistance transfers neither authorship nor authority).
- **Excluded**: a change in ability is not a loss of autonomy (Doc 2 L440).
- **Executable evidence**: consent has nothing pre-selected and equally weighted buttons (`apps/web/test/consent-panel.test.tsx`); withdrawal requires an explicit confirmation with the consequence shown first (same file).

## C-03 Meaningful Engagement

- **Definition** `[Source-Derived: Doc 2 §40, Doc 1 §10.9]`: engagement by way of curiosity, mastery, enjoyment, purpose, creation, social interaction and participation in valued activities; it explicitly rejects engagement maximisation ("Meaningful Engagement Over Addictive Engagement").
- **Necessary conditions** `[Inference]`: the activity is valued by the participant (subjectively anchored) + the mechanism runs through one of the channels above. **A high volume of engagement is not a sufficient condition** (Doc 2 §40: "High engagement does not prove meaningful benefit").
- **Point of vagueness**: there is no operationalisation of what makes an activity "valued" → **RQ-S1/RQ-S2**.
- **Executable evidence**: the home page is a task list, not a feed (Doc 20 §107; `apps/web` App.tsx and its tests).

## C-04 Meaningful Human Connection

- **Definition** `[Deductive: Doc 19 §9 TP-03 + Doc 2 §42]`: the value of a digital connection lies in the meaningful human interaction it supports, not in the volume of interaction. Operationalised on the platform as: interaction that takes place on top of a Connection (C-13), initiated autonomously by both sides and terminable at any time.
- **The chain of distinctions** `[Definition, Doc 18 §322 / Master Prompt WP-02]`: `Platform Activity ≠ Intervention Exposure ≠ Human Interaction ≠ Healthy Aging Outcome`.
- **Open question** `[Future Empirical Question]`: which characteristics of interaction (frequency, depth, reciprocity) predict a subjective sense of connection — unanswerable at present, and only modellable.

## C-05 Identity Continuity

- **Definition** `[Deductive: Doc 19 §9 TP-02]`: the kind of self-consistency a Life Story can support when authorship of a personal narrative and control over its audience are both preserved.
- **Necessary conditions (the form of proposition TP-02)**: authorship is controllable ∧ audience is controllable. Sufficiency is not claimed (`Speculative Proposition`).
- **Executable evidence** (that the three authorship states cannot be conflated): AI Draft ≠ Supporter Contribution ≠ Participant Testimony has landed as separate `source_type` / `testimony_state` fields plus an exact-version confirmation command; after a contribution is accepted, `testimony_state='NotTestimony'` is asserted end-to-end (`apps/api/test/api.e2e.test.ts`, the supporter chain).

## C-06 Life Story

- **Definition** `[Source-Derived: Appendix B §8]`: the LifeStoryArchive — a participant-controlled M17 archive holding versioned LifeStoryItems and governed contributions. Private by default.
- **Necessary conditions** `[Definition]`: participant control (with authorship, audience, correction, withdrawal and export each separate — a core invariant of the Master Prompt); versions are immutable.
- **Excluded**: Internet Public is doubly disabled in the prototype (a 400 from the command + a database CHECK).
- **Executable evidence**: the m17 integration suite (18 test declarations) + e2e (version conflict 412, visibility, withdrawal).

## C-07 Participant Control

- **Definition** `[Deductive: Doc 4 + Doc 19 §7-Q4]`: the first authority a participant holds over resources concerning them, across six dimensions — consent, visibility, authorship, matching, messaging and AI; consistency across those dimensions is itself the object of research question RQ-P4.
- **The operationalised list** `[Prototype Observation]`: granular consent (a subset of the 22-choice model is implemented); owner-only actions; confirmation dialogs bound to an exact version and recipient; withdrawal effective immediately (evaluated at the point of use).
- **Point of vagueness**: the priority order when control and protection conflict (for example, a safety signal may be raised about a participant by someone else) → recorded as **RQ-S1**.

## C-08 Ability Adaptation

- **Definition** `[Source-Derived: Doc 5 / Doc 20 §286]`: eight composable modes (Standard / Simple / Step-by-Step / High Visibility / Read-Aloud / Supporter-Assisted / Low Stimulation / Extended Time); no choice among them may be labelled as a deficit.
- **Necessary condition**: the key rights are reachable in every mode (Doc 20 §336).
- **Executable evidence**: partly in the code baseline (rem units, focus, touch targets, aria-live — ACCESSIBILITY_TEST_PLAN §1); the mode system itself is `Not Started` (a research gap).

## C-09 Governed Community

- **Definition** `[Source-Derived: Appendix B §8]`: the capability constituted by a qualified CommunitySpace, a current rule version, human moderation, participant-controlled visibility and a design that does not maximise engagement.
- **Necessary conditions** `[Definition]`: a rule version exists ∧ human moderation is available ∧ joining requires a consent scope.
- **Executable evidence**: the join command is bound to a CommunityRuleVersion; a ModerationDecision is human, confirmed and immutable (a trigger + e2e).

## C-10 Open Matching

- **Definition** `[Source-Derived: Appendix B §8]`: an opt-in process that generates candidates from approved declared attributes for an approved purpose.
- **Necessary conditions** `[Definition]`: opt-in (the open-matching consent scope + a confirmation) ∧ declared attributes only ∧ a readable MatchExplanation.
- **Excluded**: MatchCandidate ≠ mutual interest ≠ Connection (Doc 20 §143 requires the UI to state this in so many words); there are no hidden scores.
- **Executable evidence**: matching without consent → 404 (protected existence) e2e; the candidate list contains no identity of the other side (the e2e asserts on the raw JSON).

## C-11 Mutual Choice

- **Definition** `[Deductive: Doc 19 §9 TP-04]`: the normative condition for a connection to form — a choice each side made independently, never inferred from system activity (browsing, passive signals).
- **Form** `[Definition]`: MatchDecision(A,c) = Interested ∧ MatchDecision(B,c′) = Interested, where c and c′ are the two sides' records of the same candidate pair, and neither decision is visible to the other until both are Interested.
- **Executable evidence**: one MatchDecision per actor (a database constraint); a one-sided Interested produces no notification of any kind (the component test asserts on the wording); decisions are version-bound (e2e 412).

## C-12 MutualAcceptance

- **Definition** `[Source-Derived: Appendix B §8 / Doc 8 v3.2]`: the canonical M18 aggregate, recording compatible independent MatchDecisions (or one accepted, approved ConnectionRequest) plus the actors, the purpose, the policy version, the validity window and the validity check.
- **Necessary conditions** `[Definition]`: the canonical source record exists ∧ it is within its validity window ∧ it is consumed exactly once (Consumed ⟺ exactly one connection_id).
- **Executable evidence**: `CHECK (Consumed ⟺ connection_id)` + a unique partial index; the expiry sweep never touches a Consumed row (the sweep tests); the UI shows nothing before the server confirms (a component test).

## C-13 Connection

- **Definition** `[Source-Derived: Appendix B §8]`: a mutually authorized social connection activated by one valid MutualAcceptance. It is **not** a Supporter Relationship, care authority or research permission.
- **Necessary conditions**: a valid MutualAcceptance ∧ activation confirmed by one of the two sides.
- **Related / excluded**: Disconnect ≠ Block; Mute is reversible and does not end the connection.

## C-14 CommunicationBasis

- **Definition** `[Source-Derived: Appendix B §8 / Doc 8 v3.2]`: the approved basis that permits a ConversationThread to be created or a Message to be sent (one of: an active Connection, an authorized Relationship, an approved InterventionSession, or a governed moderation context).
- **Necessary conditions** `[Definition]`: it exists and is currently valid before a thread is created; it is re-evaluated at the moment of sending.
- **Executable evidence**: creating a thread without a basis → 403 COMMUNICATION_BASIS_REQUIRED (e2e); the basis becomes invalid after a Block (the m18 tests).

## C-15 Human Interaction

- **Definition** `[Deductive]`: an exchange of messages or shared activity in which both parties are human actors and which passes through a valid CommunicationBasis; distinguished from platform activity (signing in, browsing) and from AI interaction (AIConversation is modelled separately).
- **Why the distinction matters** `[Source-Derived: Doc 19 §14]`: mechanism mapping must keep activity, mechanism and outcome apart; counting AI companionship as human interaction volume would contaminate any test of TP-03. → **RQ-S2**.

## C-16 AI Assistance

- **Definition** `[Source-Derived: Doc 18's core invariants / Doc 10]`: AI may explain, retrieve, translate, suggest and draft; it may not autonomously change a Consent, establish testimony, submit a MatchDecision on someone's behalf, create a MutualAcceptance or Connection, send anything without an exact confirmation, impose a final high-impact moderation decision, create a SafetyEvent, lock a dataset or approve a finding.
- **Executable evidence**: `PROHIBITED_AI_ACTIONS` refuses 17 actions by name (`packages/modules/m11-ai/src/contracts/index.ts`, the m11 tests); an AI-sourced signal raises AISafetySignalRaised and can never become an event (a human + MFA gate, e2e).
- **Point of vagueness**: the boundary between "AI executes on your behalf after you confirm" (Doc 18 §134, Controlled Optional) and "may not submit on your behalf" depends on the exact definition of "confirm" → **RQ-S3**.

## C-17 Research Evidence

- **Definition** `[Source-Derived: Doc 2 §6.21 / Doc 11's evaluation framework]`: information that might support or challenge an assertion; in the current conceptual phase the evidence types are limited to the eight labels of Doc 11 v1.2 L510 (definitional / deductive / source-supported / simulated / prototype-observed / inferred / speculative / reserved-for-empirical).
- **Excluded** `[Definition]`: synthetic data is not real data; simulation is not empirical evidence; prototype behaviour is not user acceptance (the Master Prompt's "Never present" list).

## C-18 Research Finding

- **Definition** `[Source-Derived: Appendix B §6]`: a reviewed conclusion linked to exact versions of a ResearchQuestion, protocol, intervention, dataset, analysis and interpretation. Theoretical findings in the conceptual phase use instead the eight types of Doc 19 §38 (coherent … reserved for empirical testing).
- **Necessary conditions** `[Definition]`: the three-way separation AnalysisOutput ≠ Interpretation ≠ Finding is preserved; approval is human.
- **Executable evidence**: `runAnalysis` accepts only a Locked dataset version; approving a Finding is at the MFA tier (the m12–m13 tests + e2e).

---

## The open questions, collected (feeding WP-03/WP-09)

1. There is no positive sufficient condition for Healthy Aging (C-01).
2. Operationalising "valued activity" and "meaningful" (C-03/C-04).
3. The priority order when control and protection conflict (C-07).
4. The boundary semantics between "AI executes after confirmation" and the AI prohibition list (C-16).
5. Whether the one-to-one identity mapping assumption (RESEARCH_BASELINE §8.1) is a conceptual commitment or an implementation convenience (RQ-S3).
