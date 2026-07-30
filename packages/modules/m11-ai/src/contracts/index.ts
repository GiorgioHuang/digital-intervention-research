/**
 * M11 AI governance (ADR-040/041/060, Doc 17). All model access goes
 * through the Model Gateway; tools are allowlisted with Action Levels
 * 0-4; Level-5 actions are prohibited outright and each carries a
 * negative test.
 */

export interface ModelRequest {
  alias: string;
  instructions: string;
  input: string;
}
export interface ModelResponse {
  outputText: string;
  resolvedModelId: string;
  epistemicType: 'AI Inference' | 'Draft' | 'Suggestion';
}

export interface ModelProviderPort {
  invoke(modelId: string, request: ModelRequest): Promise<{ outputText: string }>;
}

export interface ToolDefinition {
  toolId: string;
  /** 0 explain/retrieve, 1 suggest, 2 draft, 3 confirmed reversible, 4 controlled workflow. */
  actionLevel: 0 | 1 | 2 | 3 | 4;
  /** Executes via the owning module's command port — never direct writes. */
  execute(args: Record<string, unknown>): Promise<unknown>;
}

/** Level-5 prohibited autonomous actions (Doc 17 §9 — enforced, tested). */
export const PROHIBITED_AI_ACTIONS = [
  'grant_consent',
  'withdraw_consent',
  'enrol_participant',
  'determine_capacity',
  'approve_protocol_version',
  'confirm_participant_testimony',
  'submit_match_decision_for_other_actor',
  'create_mutual_acceptance',
  'activate_connection',
  'create_thread_without_basis',
  'send_message_unconfirmed',
  'impose_moderation_decision',
  'confirm_safety_event',
  'lock_dataset_version',
  'approve_analysis_plan',
  'approve_research_finding',
  'publish_internet_public',
] as const;
