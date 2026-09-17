import {
  AgentServerError,
  isRecord,
  normalizeHost,
  request,
  stringField,
} from "./http";
import type {
  AgentEvent,
  ConversationPage,
  ConversationSummary,
  CreatedConversation,
  EventPage,
  ServerInfo,
} from "./types";

export { AgentServerError, normalizeHost } from "./http";

const MINIMUM_AGENT_SERVER = "1.28.0";

export function compareVersions(left: string, right: string): number {
  const parse = (value: string) =>
    value
      .replace(/^v/i, "")
      .split("-")[0]
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);

  const a = parse(left);
  const b = parse(right);
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const delta = (a[i] ?? 0) - (b[i] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

function toConversation(value: unknown): ConversationSummary | null {
  if (!isRecord(value)) return null;
  const id = stringField(value, "id");
  if (!id) return null;
  return {
    id,
    title: stringField(value, "title") || "Untitled conversation",
    createdAt: stringField(value, "created_at", "createdAt"),
    updatedAt: stringField(value, "updated_at", "updatedAt"),
    executionStatus:
      stringField(value, "execution_status", "agent_status", "status") || null,
  };
}

export async function getServerInfo(
  host: string,
  apiKey: string,
): Promise<ServerInfo> {
  return request<ServerInfo>(host, apiKey, "/server_info", {
    method: "GET",
  });
}

export async function assertCompatibleServer(
  host: string,
  apiKey: string,
): Promise<ServerInfo> {
  const info = await getServerInfo(host, apiKey);
  const version = info.version ?? info.sdk_version;
  if (!version || version === "unknown") {
    throw new AgentServerError(
      "This agent server did not report a version. Update OpenHands and try again.",
    );
  }
  if (compareVersions(version, MINIMUM_AGENT_SERVER) < 0) {
    throw new AgentServerError(
      `This agent server (${version}) is older than ${MINIMUM_AGENT_SERVER}. Update the laptop install.`,
    );
  }
  return info;
}

export async function searchConversations(
  host: string,
  apiKey: string,
  options: { limit?: number; pageId?: string } = {},
): Promise<ConversationPage> {
  const params = new URLSearchParams();
  params.set("limit", String(options.limit ?? 50));
  params.set("sort_order", "UPDATED_AT_DESC");
  if (options.pageId) params.set("page_id", options.pageId);

  const data = await request<Record<string, unknown>>(
    host,
    apiKey,
    `/api/conversations/search?${params.toString()}`,
  );
  const rawItems = Array.isArray(data.items) ? data.items : [];
  return {
    items: rawItems
      .map(toConversation)
      .filter((item): item is ConversationSummary => item !== null),
    nextPageId:
      typeof data.next_page_id === "string" ? data.next_page_id : null,
  };
}

const DEFAULT_WORKING_DIR = "workspace/project";

async function getActiveAgentProfileId(
  host: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const data = await request<Record<string, unknown>>(
      host,
      apiKey,
      "/api/agent-profiles",
    );
    return typeof data.active_agent_profile_id === "string" &&
      data.active_agent_profile_id.trim()
      ? data.active_agent_profile_id
      : null;
  } catch (error) {
    if (error instanceof AgentServerError && error.status === 401) throw error;
    return null;
  }
}

async function getEncryptedAgentSettings(
  host: string,
  apiKey: string,
): Promise<Record<string, unknown> | null> {
  try {
    const data = await request<Record<string, unknown>>(
      host,
      apiKey,
      "/api/settings",
      { headers: { "X-Expose-Secrets": "encrypted" } },
    );
    return isRecord(data.agent_settings) ? data.agent_settings : null;
  } catch (error) {
    if (error instanceof AgentServerError && error.status === 401) throw error;
    return null;
  }
}

export async function createConversation(
  host: string,
  apiKey: string,
  initialText?: string,
): Promise<CreatedConversation> {
  const payload: Record<string, unknown> = {
    max_iterations: 500,
    stuck_detection: true,
    workspace: { working_dir: DEFAULT_WORKING_DIR },
  };

  // Inherit the laptop's active agent. The server requires one of
  // `agent`, `agent_settings`, or `agent_profile_id`.
  const profileId = await getActiveAgentProfileId(host, apiKey);
  if (profileId) {
    payload.agent_profile_id = profileId;
  } else {
    const agentSettings = await getEncryptedAgentSettings(host, apiKey);
    if (!agentSettings) {
      throw new AgentServerError(
        "This OpenHands has no active agent profile. Start a chat on the laptop once, then try again.",
      );
    }
    payload.agent_settings = agentSettings;
  }

  if (initialText?.trim()) {
    payload.initial_message = {
      role: "user",
      content: [{ type: "text", text: initialText.trim() }],
      run: true,
    };
  }

  const data = await request<Record<string, unknown>>(
    host,
    apiKey,
    "/api/conversations",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  const conversation = toConversation(data);
  if (!conversation) {
    throw new AgentServerError(
      "The agent server created a conversation but did not return an id.",
    );
  }
  return conversation;
}

export async function searchEvents(
  host: string,
  apiKey: string,
  conversationId: string,
  options: { limit?: number; pageId?: string } = {},
): Promise<EventPage> {
  const params = new URLSearchParams();
  params.set("limit", String(options.limit ?? 50));
  params.set("sort_order", "TIMESTAMP_DESC");
  if (options.pageId) params.set("page_id", options.pageId);

  const data = await request<EventPage>(
    host,
    apiKey,
    `/api/conversations/${conversationId}/events/search?${params.toString()}`,
  );
  return {
    items: Array.isArray(data.items) ? data.items : [],
    next_page_id: data.next_page_id ?? null,
  };
}

export async function sendMessage(
  host: string,
  apiKey: string,
  conversationId: string,
  text: string,
): Promise<void> {
  // `run` must be in the JSON body. `?run=true` is stored and ignored —
  // the conversation stays idle and no assistant reply is produced.
  await request(
    host,
    apiKey,
    `/api/conversations/${conversationId}/events`,
    {
      method: "POST",
      body: JSON.stringify({
        role: "user",
        content: [{ type: "text", text }],
        run: true,
      }),
    },
  );
}

export function buildEventsSocketUrl(
  host: string,
  conversationId: string,
  options: { afterTimestamp?: string | null } = {},
): string {
  const normalized = normalizeHost(host);
  const wsHost = normalized.replace(/^http/i, "ws");
  const params = new URLSearchParams();
  if (options.afterTimestamp) {
    params.set("resend_mode", "since");
    params.set("after_timestamp", options.afterTimestamp);
  } else {
    params.set("resend_mode", "all");
  }
  return `${wsHost}/sockets/events/${conversationId}?${params.toString()}`;
}

export function sendSocketAuth(
  socket: { send: (data: string) => void },
  apiKey: string,
): void {
  socket.send(
    JSON.stringify({
      type: "auth",
      session_api_key: apiKey,
    }),
  );
}

export function isAgentEvent(value: unknown): value is AgentEvent {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.timestamp === "string"
  );
}

export function parseSocketEvent(value: unknown): AgentEvent | null {
  if (isAgentEvent(value)) return value;
  if (isRecord(value) && isAgentEvent(value.event)) return value.event;
  return null;
}

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter(isRecord)
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n")
    .trim();
}

export function eventText(event: AgentEvent): string {
  if (event.llm_message) return textFromContent(event.llm_message.content);
  if (typeof event.delta === "string") return event.delta;
  if (typeof event.content === "string") return event.content;
  if (Array.isArray(event.thought)) {
    return event.thought
      .map((block) => block.text ?? "")
      .join("\n")
      .trim();
  }
  if (typeof event.detail === "string") return event.detail;
  return "";
}

export function isUserMessage(event: AgentEvent): boolean {
  return (
    event.source === "user" &&
    (event.kind === "MessageEvent" || event.llm_message?.role === "user")
  );
}

export function isAssistantMessage(event: AgentEvent): boolean {
  return (
    event.source === "agent" &&
    (event.kind === "MessageEvent" ||
      event.kind === "StreamingDeltaEvent" ||
      !!event.llm_message)
  );
}

export function isToolEvent(event: AgentEvent): boolean {
  return Boolean(event.action || event.observation || event.tool_name);
}

export function toolLabel(event: AgentEvent): string {
  if (event.summary?.trim()) return event.summary.trim();
  if (event.tool_name) return event.tool_name;
  if (event.action?.kind) return event.action.kind.replace(/Action$/, "");
  if (event.observation?.kind)
    return event.observation.kind.replace(/Observation$/, "");
  return "Tool";
}
