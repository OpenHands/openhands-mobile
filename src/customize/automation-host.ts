import { normalizeHost } from "../api/http";

const AGENT_SERVER_PORTS = new Set(["18000", "18100", "3001", "3000"]);

/** Hosts to try for `/api/automation` when the phone is on the agent-server. */
export function automationHostCandidates(host: string): string[] {
  const normalized = normalizeHost(host);
  if (!normalized) return [];
  const candidates = [normalized];
  const rewritten = normalized.replace(
    /:(18000|18100|3001|3000)(?=\/|$)/,
    ":8000",
  );
  if (rewritten !== normalized) candidates.push(rewritten);
  return candidates;
}

export function looksLikeAgentServerPort(host: string): boolean {
  const match = normalizeHost(host).match(/:(\d+)(?:\/|$)/);
  return Boolean(match && AGENT_SERVER_PORTS.has(match[1]!));
}
