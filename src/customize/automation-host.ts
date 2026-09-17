import { normalizeHost } from "../api/http";

const AGENT_SERVER_PORTS = new Set(["18000", "18100", "3001", "3000"]);
const AUTOMATION_PORTS = ["8000", "18001", "18002"] as const;

/** Hosts to try for `/api/automation` when the phone is on the agent-server. */
export function automationHostCandidates(host: string): string[] {
  const normalized = normalizeHost(host);
  if (!normalized) return [];
  const candidates = [normalized];
  for (const port of AUTOMATION_PORTS) {
    const rewritten = normalized.replace(
      /:(18000|18100|3001|3000)(?=\/|$)/,
      `:${port}`,
    );
    if (rewritten !== normalized && !candidates.includes(rewritten)) {
      candidates.push(rewritten);
    }
  }
  return candidates;
}

export function looksLikeAgentServerPort(host: string): boolean {
  const match = normalizeHost(host).match(/:(\d+)(?:\/|$)/);
  return Boolean(match && AGENT_SERVER_PORTS.has(match[1]!));
}
