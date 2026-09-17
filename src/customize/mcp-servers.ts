import { isRecord } from "../api/http";

export type McpTransport = "stdio" | "sse" | "http";

export interface McpServer {
  id: string;
  name: string;
  transport: McpTransport;
  enabled: boolean;
  detail: string;
}

function normalizeTransport(value: unknown): McpTransport {
  if (value === "stdio" || value === "sse") return value;
  return "http";
}

function serverMap(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  if (isRecord(value.mcpServers)) return value.mcpServers;
  return value;
}

export function flattenMcpConfig(value: unknown): McpServer[] {
  const map = serverMap(value);
  if (!map) return [];
  return Object.entries(map).flatMap(([id, raw]) => {
    if (!isRecord(raw)) return [];
    const transport = normalizeTransport(raw.transport);
    const command = typeof raw.command === "string" ? raw.command : "";
    const args = Array.isArray(raw.args)
      ? raw.args.filter((item): item is string => typeof item === "string")
      : [];
    const url = typeof raw.url === "string" ? raw.url : "";
    const detail =
      transport === "stdio" ? [command, ...args].filter(Boolean).join(" ") : url;
    return [
      {
        id,
        name: typeof raw.name === "string" && raw.name.trim() ? raw.name : id,
        transport,
        enabled: raw.enabled !== false,
        detail,
      },
    ];
  });
}

export function mcpTransportLabel(transport: McpTransport): string {
  if (transport === "stdio") return "STDIO";
  if (transport === "sse") return "SSE";
  return "HTTP";
}
