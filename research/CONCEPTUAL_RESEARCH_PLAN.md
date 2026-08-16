# CONCEPTUAL_RESEARCH_PLAN

> Per Doc 19 v1.3 (CRP-HA-DIRP-001) and Doc 18 v1.3. Both the epistemic vocabulary and the finding types are taken from Doc 19 §10/§38. This plan takes effect immediately; there is no external approval gate (Doc 19 §2/§47).

## 1. Primary research questions (Doc 19 §7; the internal numbering is a repository convenience)

- **RQ-P1** Is the framework internally coherent?
- **RQ-P2** Are Healthy Aging outcomes separable from platform activity?
- **RQ-P3** Do the intervention mechanisms logically connect activity to future outcomes?
- **RQ-P4** Can participant control be represented consistently across consent, visibility, Life Story, matching, messaging and AI?
- **RQ-P5** Are the M01–M18 boundaries sufficient to preserve authority and research lineage?

## 2. Secondary research questions (Doc 19 §8)

- **RQ-S1** Which concepts are still vague or overlapping?
- **RQ-S2** Which mechanisms rest on untested empirical assumptions?
- **RQ-S3** Which architectural decisions derive from theory, and which are merely optional implementation choices?
- **RQ-S4** Which synthetic failure scenarios expose contradictions?
- **RQ-S5** Which future observations would most reduce uncertainty?

## 3. Theoretical propositions (the initial set; details in THEORETICAL_PROPOSITIONS.md, the WP-03 output)

The suggested propositions of Doc 19 §9 are taken as the starting point: TP-01 participant control is a mechanism, not a compliance property; TP-02 Life Story supports identity continuity if and only if authorship and audience are controllable; TP-03 the value of digital connection lies in supporting meaningful human interaction, not in the volume of interaction; TP-04 matching requires independent choice and must not be inferred from system activity; TP-05 AI can reduce the burden of interaction while preserving human authority, when its actions are transparent and bounded; TP-06 research reproducibility requires data, analysis, interpretation and findings to be recorded separately. All of them remain `Speculative Proposition` until WP-03 formalises them one by one.

## 4. Method (all ten methods of Doc 19 §12–21 are in use)

Conceptual analysis; evidence and source synthesis; causal and mechanism mapping; ontology and domain modelling; formal state analysis; synthetic personas; synthetic data generation; simulation; prototype experiments; comparative architecture analysis (with the trade-offs recorded as Appendix C ADRs). Each question follows the nine-step analysis plan of §37.

## 5. Work packages (Master Prompt WP-01…WP-10)

| WP | Output | Status |
|---|---|---|
| WP-01 concept and terminology audit | CONCEPT_CATALOGUE.md | **In Analysis (started here)** |
| WP-02 mechanism and causal model | MECHANISM_MODEL.md + a machine-readable graph + causal diagrams | Not Started |
| WP-03 theoretical propositions | THEORETICAL_PROPOSITIONS.md | Not Started |
| WP-04 formal domain model | FORMAL_DOMAIN_MODEL.md + a machine-readable model + executable invariant tests | Partly ahead (the invariant tests exist; the documentation does not) |
| WP-05 synthetic persona framework | SYNTHETIC_PERSONAS.md + machine-readable fixtures | Not Started |
| WP-06 synthetic data generator | SYNTHETIC_DATA_SPEC.md + generator code | Partly ahead (synthetic-pilot has deterministic seeds; a standalone generator and provenance labels are missing) |
| WP-07 scenario and simulation framework | SCENARIO_CATALOGUE.md + a scenario runner | Partly ahead (scenarios are scattered through the tests; the catalogue and runner are missing) |
| WP-08 executable reference prototype | the existing codebase (requalified as a research artefact) | **Implemented in Prototype** (see RESEARCH_BASELINE §3) |
| WP-09 counter-example and contradiction analysis | CONTRADICTION_REGISTER.md | **In Analysis (the first five are registered)** |
| WP-10 theoretical findings | THEORETICAL_FINDINGS.md | Not Started |

Order: WP-01 → WP-03 → WP-02 → WP-05/06 → WP-07 → WP-09 continuously → WP-10 as the synthesis. WP-04 advances in parallel with WP-01 (concept entries anchor directly to the executable invariants that already exist).

## 6. Scenario families (the thirteen of Doc 19 §23 × the mandatory list of Doc 18 §210)

The thirteen families: autonomy and consent; Life Story authorship; visibility and audience; community participation; matching and mutual selection; connection and CommunicationBasis; the message lifecycle; block/report/moderation; SafetySignal and SafetyEvent; AI assistance and prohibited actions; dataset and analysis lineage; degraded-dependency behaviour; withdrawal and deletion propagation. Each family carries at least one of each in SCENARIO_CATALOGUE: a normal path, a boundary, a failure, an adversarial case and a counter-example.

## 7. Expected outputs (Doc 19 §44)

A revised conceptual framework, definitions and taxonomies, theoretical propositions, causal and mechanism diagrams, formal state models, architectural decisions (ADRs), synthetic datasets, simulation reports, the reference prototype, a counter-example catalogue, and theoretical findings.

## 8. Completion criteria (Doc 19 §45 + the 16 clauses of the Master Prompt's "Definition of Done")

The key concepts are explicit and coherent; the major contradictions are resolved or recorded; the key invariants are executable; the synthetic scenarios are reproducible (seeds and configuration recorded); the main assumptions are classified; future empirical questions are cleanly separated from current findings; no human or private data, no empirical effect claims and no production-readiness claims anywhere; and Trace/ADR IDs run through research → code → scenario → finding.

## 9. How uncertainty is handled

- Every statement carries one of the ten epistemic labels of Doc 19 §10.
- Findings may only be one of the eight types of Doc 19 §38; a `supported` judgement must have source or experimental backing (the Master Prompt's traceability rule).
- A contradiction is a valuable output (Doc 19 §40): register it, propose alternatives, and never bury it under vague wording or an arbitrary implementation choice.
- Any assertion that cannot be supported from the existing sources is demoted to `Design Assumption` or `Future Empirical Question`.
