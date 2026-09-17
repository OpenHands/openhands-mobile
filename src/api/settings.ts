import { flattenMcpConfig, type McpServer } from "../customize/mcp-servers";
import type { SkillEnablement } from "../customize/skill-enablement";
import { isRecord, request } from "./http";

export interface AppSettings {
  enablement: SkillEnablement;
  mcpServers: McpServer[];
  mcpConfig: unknown;
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string");
  return items;
}

export async function getAppSettings(
  host: string,
  apiKey: string,
): Promise<AppSettings> {
  const data = await request<Record<string, unknown>>(host, apiKey, "/api/settings");
  const prefs = isRecord(data.misc_settings)
    ? data.misc_settings.app_preferences
    : undefined;
  const prefRecord = isRecord(prefs) ? prefs : {};
  const agentSettings = isRecord(data.agent_settings) ? data.agent_settings : {};
  const mcpConfig = agentSettings.mcp_config ?? data.mcp_config ?? {};
  const enabled = stringList(prefRecord.enabled_skills);
  return {
    enablement: {
      enabledSkills: enabled,
      disabledSkills: stringList(prefRecord.disabled_skills) ?? [],
    },
    mcpServers: flattenMcpConfig(mcpConfig),
    mcpConfig,
  };
}

export async function saveSkillEnablement(
  host: string,
  apiKey: string,
  enablement: SkillEnablement,
): Promise<void> {
  await request(host, apiKey, "/api/settings", {
    method: "PATCH",
    body: JSON.stringify({
      misc_settings_diff: {
        app_preferences: {
          ...(enablement.enabledSkills !== undefined
            ? { enabled_skills: enablement.enabledSkills }
            : {}),
          disabled_skills: enablement.disabledSkills,
        },
      },
    }),
  });
}

export async function setMcpServerEnabled(
  host: string,
  apiKey: string,
  serverId: string,
  enabled: boolean,
): Promise<void> {
  await request(host, apiKey, "/api/settings", {
    method: "PATCH",
    body: JSON.stringify({
      agent_settings_diff: {
        mcp_config: { [serverId]: { enabled } },
      },
    }),
  });
}
