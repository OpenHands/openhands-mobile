import { isRecord, request } from "./http";

export interface InstalledPlugin {
  name: string;
  version: string;
  description: string | null;
  enabled: boolean;
  source: string;
}

export async function listInstalledPlugins(
  host: string,
  apiKey: string,
): Promise<InstalledPlugin[]> {
  const data = await request<Record<string, unknown>>(
    host,
    apiKey,
    "/api/plugins/installed",
  );
  const raw = Array.isArray(data.plugins) ? data.plugins : [];
  return raw.flatMap((item) => {
    if (!isRecord(item) || typeof item.name !== "string" || !item.name.trim()) {
      return [];
    }
    return [
      {
        name: item.name,
        version: typeof item.version === "string" ? item.version : "",
        description:
          typeof item.description === "string" ? item.description : null,
        enabled: item.enabled !== false,
        source: typeof item.source === "string" ? item.source : "",
      },
    ];
  });
}

export async function setPluginEnabled(
  host: string,
  apiKey: string,
  name: string,
  enabled: boolean,
): Promise<void> {
  await request(host, apiKey, `/api/plugins/installed/${encodeURIComponent(name)}`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}
