import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import type { Pool } from '@platform/database';
import {
  PROHIBITED_AI_ACTIONS,
  type ModelProviderPort,
  type ModelRequest,
  type ModelResponse,
  type ToolDefinition,
} from '../contracts/index.js';

/**
 * Model Gateway (ADR-041): the only path to model providers. Aliases
 * resolve to approved models; unknown aliases fail closed — never a
 * silent substitution (Doc 17 §29).
 */
export function createModelGateway(
  provider: ModelProviderPort,
  approvedAliases: Readonly<Record<string, string>>,
) {
  return {
    async invoke(request: ModelRequest): Promise<ModelResponse> {
      const modelId = approvedAliases[request.alias];
      if (modelId === undefined) {
        throw new PlatformError('DEPENDENCY_UNAVAILABLE', `Model alias '${request.alias}' is not approved`);
      }
      const res = await provider.invoke(modelId, request);
      // Output is labelled — AI text is never a domain fact (ADR-024/040).
      return { outputText: res.outputText, resolvedModelId: modelId, epistemicType: 'Draft' };
    },
  };
}

/** Deterministic model provider simulator (ADR-109 pending). */
export function createModelProviderSimulator(): ModelProviderPort {
  return {
    async invoke(modelId, request) {
      return { outputText: `[simulated:${modelId}] draft for: ${request.input.slice(0, 40)}` };
    },
  };
}

export interface ToolGatewayDeps {
  pool: Pool;
  clock: Clock;
}

/**
 * Tool Gateway: tools are unavailable unless registered (allowlist);
 * Level-5 prohibited actions are refused by NAME before any lookup, and
 * every invocation (executed or refused) is recorded (Doc 17 §53-58).
 * Authority fields can never come from model output — execute() receives
 * only schema-validated arguments and runs owning-module commands.
 */
export function createToolGateway(deps: ToolGatewayDeps, tools: readonly ToolDefinition[]) {
  const registry = new Map(tools.map((t) => [t.toolId, t]));
  return {
    async invoke(
      ctx: RequestContext,
      toolId: string,
      args: Record<string, unknown>,
    ): Promise<unknown> {
      const record = async (level: number, outcome: 'Executed' | 'Refused' | 'Failed', reason?: string) => {
        await deps.pool.query(
          `INSERT INTO ai_companion.ai_tool_invocations
             (id, tool_id, action_level, invoked_for_actor_id, outcome, refusal_reason)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newId('ti'), toolId, level, ctx.actor?.id ?? 'anonymous', outcome, reason ?? null],
        );
      };

      if ((PROHIBITED_AI_ACTIONS as readonly string[]).includes(toolId)) {
        await record(0, 'Refused', 'level-5-prohibited-autonomous-action');
        throw new PlatformError('AUTHORISATION_DENIED', `'${toolId}' is a prohibited autonomous AI action (ADR-060)`);
      }
      const tool = registry.get(toolId);
      if (tool === undefined) {
        await record(0, 'Refused', 'tool-not-in-allowlist');
        throw new PlatformError('AUTHORISATION_DENIED', `Tool '${toolId}' is not registered`);
      }
      try {
        const result = await tool.execute(args);
        await record(tool.actionLevel, 'Executed');
        return result;
      } catch (err) {
        await record(tool.actionLevel, 'Failed', err instanceof Error ? err.message : 'unknown');
        throw err;
      }
    },
  };
}
