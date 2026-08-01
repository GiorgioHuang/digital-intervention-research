import { createHash } from 'node:crypto';
import { PlatformError } from '@platform/kernel';
import type { KnowledgePlatformPort, KnowledgeResource } from '../contracts/index.js';

/**
 * Real Knowledge Platform adapter over the Healthy Aging Knowledge Graph
 * MCP surface (aging-knowledge-graph: JSON-RPC over POST /mcp; tools
 * graceage_search / graceage_node_detail). This is the ACL doorway the
 * contract promised (ADR-052 "MCP preferred") — the external graph stays
 * authoritative for evidence content; nothing here writes platform state.
 *
 * External version semantics (Doc 9 / Appendix B: "exact version or
 * retrieval identity"): the graph API does not expose a graph-level
 * version, so the adapter records a RETRIEVAL IDENTITY — the sha256 of
 * the exact node-detail payload retrieved. Same content, same version;
 * any upstream change to the node's claims or evidence changes it.
 *
 * Fail closed: transport or protocol errors surface as
 * DEPENDENCY_UNAVAILABLE — they are never silently treated as "no
 * evidence found".
 */
export interface KpMcpConfig {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

interface SearchRow {
  ownerType: string;
  id: string;
  name: string;
  nodeId?: string;
  score?: number;
}

interface NodeDetail {
  node: { id: string; name: string; type: string; domains?: string[]; external_ids?: string[] };
  outgoing?: { relationship: string; other?: { name?: string } }[];
  incoming?: { relationship: string; other?: { name?: string } }[];
}

export function createKnowledgePlatformMcpClient(config: KpMcpConfig): KnowledgePlatformPort {
  const doFetch = config.fetchImpl ?? fetch;
  const timeoutMs = config.timeoutMs ?? 15_000;
  let rpcId = 0;

  async function callTool<T>(name: string, args: Record<string, unknown>): Promise<T> {
    rpcId += 1;
    let res: Response;
    try {
      res = await doFetch(new URL('/mcp', config.baseUrl), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: rpcId,
          method: 'tools/call',
          params: { name, arguments: args },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw new PlatformError('DEPENDENCY_UNAVAILABLE', `Knowledge Platform MCP unreachable: ${String(err)}`);
    }
    if (!res.ok) {
      throw new PlatformError('DEPENDENCY_UNAVAILABLE', `Knowledge Platform MCP returned HTTP ${res.status}`);
    }
    const body = (await res.json()) as {
      result?: { content?: { type: string; text: string }[] };
      error?: { message?: string };
    };
    if (body.error !== undefined) {
      throw new PlatformError('DEPENDENCY_UNAVAILABLE', `Knowledge Platform MCP error: ${body.error.message ?? 'unknown'}`);
    }
    const text = body.result?.content?.[0]?.text;
    if (text === undefined) {
      throw new PlatformError('DEPENDENCY_UNAVAILABLE', 'Knowledge Platform MCP returned no content');
    }
    return JSON.parse(text) as T;
  }

  function toResource(detail: NodeDetail): KnowledgeResource {
    const payload = JSON.stringify(detail);
    const retrievalIdentity = `sha256:${createHash('sha256').update(payload).digest('hex').slice(0, 16)}`;
    const relations = [...(detail.outgoing ?? []), ...(detail.incoming ?? [])]
      .slice(0, 3)
      .map((c) => `${c.relationship}${c.other?.name === undefined ? '' : ` ${c.other.name}`}`)
      .join('; ');
    const external = (detail.node.external_ids ?? []).join(', ');
    return {
      externalIdentifier: detail.node.id,
      title: detail.node.name,
      sourceSystem: 'graceage-knowledge-mcp',
      externalVersion: retrievalIdentity,
      summary: [detail.node.type, external, relations].filter((s) => s !== '').join(' | '),
    };
  }

  return {
    async searchEvidence(query: string): Promise<KnowledgeResource[]> {
      const rows = await callTool<SearchRow[]>('graceage_search', { q: query, k: 8 });
      // Search rows may be owned by nodes, claims, or evidence entries
      // (the pgvector backend returns all three): claim/evidence rows carry
      // the related graph node in nodeId, while their own id is a claim or
      // source identifier (e.g. a DOI) that node_detail cannot resolve —
      // never fall back to it.
      const nodeIds = [
        ...new Set(
          rows
            .map((r) => r.nodeId ?? (r.ownerType === 'node' ? r.id : undefined))
            .filter((id): id is string => id !== undefined),
        ),
      ].slice(0, 5);
      const details = await Promise.all(
        nodeIds.map((id) => callTool<NodeDetail | null>('graceage_node_detail', { id })),
      );
      return details.filter((d): d is NodeDetail => d !== null).map(toResource);
    },

    async resolveReference(externalIdentifier: string): Promise<KnowledgeResource | undefined> {
      const detail = await callTool<NodeDetail | null>('graceage_node_detail', { id: externalIdentifier });
      return detail === null ? undefined : toResource(detail);
    },
  };
}
