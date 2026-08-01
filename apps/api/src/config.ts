import { z } from 'zod';

/**
 * Environment validation (fail fast, fail closed): the process refuses to
 * start with an invalid configuration instead of falling back to defaults
 * for anything security-relevant.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  // 'oidc' is the production target (pending ADR-104); 'dev-header' is an
  // explicit development/synthetic-pilot stub and the only mode implemented.
  AUTH_MODE: z.enum(['dev-header', 'oidc']).default('dev-header'),
  // Knowledge Platform ACL backing (ADR-052 "MCP preferred"): 'simulator'
  // is the deterministic default (fail closed — the real dependency is
  // opt-in); 'mcp' talks JSON-RPC to the Healthy Aging Knowledge Graph MCP
  // endpoint and requires KNOWLEDGE_MCP_URL.
  KNOWLEDGE_PLATFORM_MODE: z.enum(['simulator', 'mcp']).default('simulator'),
  KNOWLEDGE_MCP_URL: z.string().url().optional(),
});

const envSchemaChecked = envSchema.superRefine((cfg, issues) => {
  if (cfg.KNOWLEDGE_PLATFORM_MODE === 'mcp' && cfg.KNOWLEDGE_MCP_URL === undefined) {
    issues.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['KNOWLEDGE_MCP_URL'],
      message: 'required when KNOWLEDGE_PLATFORM_MODE=mcp',
    });
  }
});

export type ApiConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const parsed = envSchemaChecked.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}
