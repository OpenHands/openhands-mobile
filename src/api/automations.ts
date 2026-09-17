import {
  automationHostCandidates,
  looksLikeAgentServerPort,
} from "../customize/automation-host";
import type { AutomationTrigger } from "../customize/automation-labels";
import { AgentServerError, isRecord, request, stringField } from "./http";

export interface AutomationSummary {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  prompt: string | null;
  lastTriggeredAt: string | null;
  updatedAt: string;
  disabledReason: string | null;
}

export type AutomationHealth =
  | { ok: true; host: string }
  | { ok: false; reason: "unavailable" | "agent-only" };

function toTrigger(value: unknown): AutomationTrigger {
  if (!isRecord(value)) return { type: "schedule" };
  const on = value.on;
  return {
    type: typeof value.type === "string" ? value.type : "schedule",
    schedule: typeof value.schedule === "string" ? value.schedule : undefined,
    schedule_human:
      typeof value.schedule_human === "string" ? value.schedule_human : undefined,
    timezone: typeof value.timezone === "string" ? value.timezone : undefined,
    source: typeof value.source === "string" ? value.source : undefined,
    on: Array.isArray(on)
      ? on.filter((item): item is string => typeof item === "string")
      : typeof on === "string"
        ? on
        : undefined,
  };
}

function toAutomation(value: unknown): AutomationSummary | null {
  if (!isRecord(value)) return null;
  const id = stringField(value, "id");
  const name = stringField(value, "name");
  if (!id || !name) return null;
  return {
    id,
    name,
    enabled: value.enabled !== false,
    trigger: toTrigger(value.trigger),
    prompt: typeof value.prompt === "string" ? value.prompt : null,
    lastTriggeredAt:
      typeof value.last_triggered_at === "string"
        ? value.last_triggered_at
        : null,
    updatedAt: stringField(value, "updated_at") || new Date().toISOString(),
    disabledReason:
      typeof value.disabled_reason === "string" ? value.disabled_reason : null,
  };
}

async function probeHealth(host: string, apiKey: string): Promise<boolean> {
  try {
    const data = await request<Record<string, unknown>>(
      host,
      apiKey,
      "/api/automation/health",
    );
    return data.status !== "error";
  } catch {
    return false;
  }
}

export async function resolveAutomationHealth(
  host: string,
  apiKey: string,
): Promise<AutomationHealth> {
  for (const candidate of automationHostCandidates(host)) {
    if (await probeHealth(candidate, apiKey)) {
      return { ok: true, host: candidate };
    }
  }
  return {
    ok: false,
    reason: looksLikeAgentServerPort(host) ? "agent-only" : "unavailable",
  };
}

export async function listAutomations(
  host: string,
  apiKey: string,
): Promise<AutomationSummary[]> {
  const data = await request<Record<string, unknown>>(
    host,
    apiKey,
    "/api/automation/v1?limit=50&offset=0",
  );
  const raw = Array.isArray(data.automations) ? data.automations : [];
  return raw
    .map(toAutomation)
    .filter((item): item is AutomationSummary => item !== null);
}

export async function getAutomation(
  host: string,
  apiKey: string,
  id: string,
): Promise<AutomationSummary> {
  const data = await request<unknown>(
    host,
    apiKey,
    `/api/automation/v1/${encodeURIComponent(id)}`,
  );
  const automation = toAutomation(data);
  if (!automation) {
    throw new AgentServerError("This automation could not be loaded.");
  }
  return automation;
}

export async function setAutomationEnabled(
  host: string,
  apiKey: string,
  id: string,
  enabled: boolean,
): Promise<AutomationSummary> {
  const data = await request<unknown>(
    host,
    apiKey,
    `/api/automation/v1/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    },
  );
  return toAutomation(data) ?? {
    id,
    name: id,
    enabled,
    trigger: { type: "schedule" },
    prompt: null,
    lastTriggeredAt: null,
    updatedAt: new Date().toISOString(),
    disabledReason: null,
  };
}

export async function dispatchAutomation(
  host: string,
  apiKey: string,
  id: string,
): Promise<void> {
  await request(host, apiKey, `/api/automation/v1/${encodeURIComponent(id)}/dispatch`, {
    method: "POST",
  });
}
