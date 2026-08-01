import { describe, expect, it } from 'vitest';
import { PlatformError } from '@platform/kernel';
import { createKnowledgePlatformMcpClient } from '../src/infrastructure/kp-mcp-client.js';

/**
 * REAL-CALL integration test against a live Healthy Aging Knowledge Graph
 * MCP endpoint (aging-knowledge-graph). No mocks: every assertion below is
 * backed by an actual JSON-RPC round trip to POST /mcp.
 *
 * Endpoint selection: KNOWLEDGE_MCP_URL if set (CI points this at the
 * deployed Cloud Run instance, https://knowledge-graph.internal.example), else a locally
 * running server (repo aging-knowledge-graph, `PORT=8790 npm run serve`).
 * Skips honestly when neither is reachable — it never fakes a pass.
 */
const MCP_URL = process.env['KNOWLEDGE_MCP_URL'] ?? 'http://localhost:8790';

async function probe(): Promise<boolean> {
  // Two attempts with a generous timeout: a scaled-to-zero Cloud Run
  // instance can take several seconds to cold-start, and a skip caused by
  // an impatient probe would silently drop the real-call coverage.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const res = await fetch(new URL('/health', MCP_URL), { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        console.warn(`KG MCP probe attempt ${attempt}: HTTP ${res.status} from ${MCP_URL}`);
        continue;
      }
      const body = (await res.json()) as { status?: string };
      if (body.status === 'ok') return true;
      console.warn(`KG MCP probe attempt ${attempt}: unexpected health body ${JSON.stringify(body)}`);
    } catch (err) {
      console.warn(`KG MCP probe attempt ${attempt} failed for ${MCP_URL}: ${String(err)}`);
    }
  }
  return false;
}
const mcpAvailable = await probe();
if (!mcpAvailable) console.warn(`KG MCP real-call suite SKIPPED: ${MCP_URL} unreachable`);

describe.skipIf(!mcpAvailable)(`Knowledge Platform MCP client (real calls: ${MCP_URL})`, () => {
  const client = createKnowledgePlatformMcpClient({ baseUrl: MCP_URL });

  it('searchEvidence returns graph-backed resources with retrieval identity', async () => {
    const resources = await client.searchEvidence('loneliness in older adults');
    expect(resources.length).toBeGreaterThan(0);
    expect(resources.length).toBeLessThanOrEqual(5);
    for (const r of resources) {
      expect(r.externalIdentifier).toMatch(/^ga:/);
      expect(r.sourceSystem).toBe('graceage-knowledge-mcp');
      // Retrieval identity (Doc 9 / Appendix B): content hash of the exact
      // node-detail payload retrieved, since the graph API exposes no
      // graph-level version.
      expect(r.externalVersion).toMatch(/^sha256:[0-9a-f]{16}$/);
      expect(r.title.length).toBeGreaterThan(0);
    }
  });

  it('search results are deduplicated node ids', async () => {
    const resources = await client.searchEvidence('social connection');
    const ids = resources.map((r) => r.externalIdentifier);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolveReference resolves a known node with stable retrieval identity', async () => {
    const first = await client.resolveReference('ga:loneliness');
    const second = await client.resolveReference('ga:loneliness');
    expect(first).toBeDefined();
    expect(first!.externalIdentifier).toBe('ga:loneliness');
    expect(first!.title.toLowerCase()).toContain('loneliness');
    // Same upstream content → same retrieval identity (deterministic hash).
    expect(second!.externalVersion).toBe(first!.externalVersion);
  });

  it('resolveReference returns undefined for an unknown identifier', async () => {
    const resolved = await client.resolveReference('ga:does-not-exist-xyz');
    expect(resolved).toBeUndefined();
  });
});

describe('Knowledge Platform MCP client (fail-closed)', () => {
  it('unreachable endpoint surfaces DEPENDENCY_UNAVAILABLE, not an empty result', async () => {
    // Port 9 (discard) is never serving MCP; short timeout keeps this fast.
    const client = createKnowledgePlatformMcpClient({ baseUrl: 'http://127.0.0.1:9', timeoutMs: 1500 });
    const err = await client.searchEvidence('anything').then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(PlatformError);
    expect((err as PlatformError).code).toBe('DEPENDENCY_UNAVAILABLE');
  });

  it('non-MCP HTTP responses surface DEPENDENCY_UNAVAILABLE', async () => {
    const fetchImpl = (async () =>
      new Response('not json-rpc', { status: 500 })) as unknown as typeof fetch;
    const client = createKnowledgePlatformMcpClient({ baseUrl: 'http://example.invalid', fetchImpl });
    await expect(client.resolveReference('ga:loneliness')).rejects.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
    });
  });
});
