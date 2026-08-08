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
  // Interim perimeter for cloud deployments (THREAT_MODEL: the dev-header
  // auth stub must never be publicly reachable unguarded): when set, every
  // /v1 request must present the token. Static assets and /health stay
  // open — they carry no data. This is a compensating control, NOT
  // authentication; OIDC (ADR-104) remains required before any real use.
  ACCESS_TOKEN: z.string().min(16).optional(),
  // When set, the API also serves the built web app from this directory
  // (single Cloud Run service serves UI + API from one origin).
  WEB_DIST_DIR: z.string().optional(),
});

const envSchemaChecked = envSchema.superRefine((cfg, issues) => {
  // 'oidc' names the target (ADR-104) and nothing implements it. Left in the
  // enum so this says what is wrong instead of "invalid enum value", but
  // rejected at startup: with no actor resolver behind it every request
  // would 401 forever. That is fail closed, and it is also indistinguishable
  // from a platform that is simply broken — somebody would spend a morning
  // on it. Refusing to start says which of the two it is, on line one.
  if (cfg.AUTH_MODE === 'oidc') {
    issues.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['AUTH_MODE'],
      message:
        "'oidc' is the target of ADR-104 and is NOT implemented — no actor is resolved in this mode, so every request would be refused. Use 'dev-header' (development/synthetic pilot only, behind ACCESS_TOKEN) until the OIDC integration exists.",
    });
  }
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
  // Cloud Run injects PORT; an explicit API_PORT still wins.
  const withPort = env['API_PORT'] === undefined && env['PORT'] !== undefined ? { ...env, API_PORT: env['PORT'] } : env;
  const parsed = envSchemaChecked.safeParse(withPort);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}
