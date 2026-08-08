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
  // 'google' is production authentication (ADR-104, owner's ruling
  // 2026-08-08: Sign in with Google, for staff and participants alike).
  // 'dev-header' is an explicit development/synthetic-pilot stub in which
  // identity is whatever a header says. 'oidc' is the name the target used
  // to have and is rejected below, so an old deployment configuration says
  // so instead of failing somewhere less obvious.
  AUTH_MODE: z.enum(['dev-header', 'google', 'oidc']).default('dev-header'),
  // The OAuth client ID tokens must be addressed to (`aud`). Required by
  // AUTH_MODE=google: without it there is nothing to check an ID token
  // against, and a token minted for any other application would verify.
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  // Signing key for sign-in nonces. Session cookies are random and stored
  // hashed, so this key protects the nonce only — but a guessable nonce is
  // a replayable sign-in, so it is held to the same length as any secret.
  SESSION_SECRET: z.string().min(32).optional(),
  // Restricts sign-in to Google Workspace accounts in these domains,
  // checked against the token's `hd` claim (never against the text after
  // an `@`). Empty means any Google account may sign in — which still
  // grants nothing without an invitation.
  GOOGLE_ALLOWED_DOMAINS: z.string().optional(),
  // Domains where the OPERATOR ASSERTS 2-Step Verification is enforced for
  // every member. Google's ID tokens carry no `amr`, so a second factor
  // cannot be read from the token; this is a statement about how a
  // Workspace domain is administered, and it is trusted exactly as far as
  // that. Leave it empty and nobody is treated as MFA — the consequential
  // actions then ask for a fresh re-authentication instead, which is a
  // stronger answer anyway and needs no assertion from anyone.
  GOOGLE_MFA_DOMAINS: z.string().optional(),
  SESSION_TTL_MINUTES: z.coerce.number().int().min(5).max(43200).default(720),
  // Secure cookies by default, and turning them off is a deliberate act
  // that only makes sense on http://localhost — a Secure cookie is simply
  // never stored there, which presents as "sign-in does nothing".
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  // How recently Google must have authenticated the person for a step-up
  // to count. This is the freshness claim itself: minutes, not hours.
  STEP_UP_MAX_AGE_SECONDS: z.coerce.number().int().min(30).max(900).default(120),
  // How long a re-authentication counts for. Short by intent: it answers
  // "is that person still at the keyboard", and that answer goes stale.
  STEP_UP_TTL_MINUTES: z.coerce.number().int().min(1).max(120).default(10),
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
  // 'oidc' was the placeholder name while ADR-104 was open. It is now
  // decided and implemented under the name of the provider it actually
  // uses, so the old value is refused with the new one rather than
  // silently accepted as something adjacent.
  if (cfg.AUTH_MODE === 'oidc') {
    issues.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['AUTH_MODE'],
      message:
        "'oidc' was the placeholder name for ADR-104 and no longer exists. Production authentication is Sign in with Google: set AUTH_MODE=google (with GOOGLE_CLIENT_ID and SESSION_SECRET), or AUTH_MODE=dev-header for local development and the synthetic pilot.",
    });
  }
  // Fail fast rather than at the first sign-in attempt: a platform that
  // starts and then cannot authenticate anybody looks like a platform
  // that is broken, and the two cost very different afternoons.
  if (cfg.AUTH_MODE === 'google') {
    if (cfg.GOOGLE_CLIENT_ID === undefined) {
      issues.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GOOGLE_CLIENT_ID'],
        message: 'required when AUTH_MODE=google — ID tokens are verified against this client ID',
      });
    }
    if (cfg.SESSION_SECRET === undefined) {
      issues.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_SECRET'],
        message: 'required when AUTH_MODE=google — at least 32 characters, used to sign sign-in nonces',
      });
    }
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
