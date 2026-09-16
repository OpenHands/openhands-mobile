import type {
  AgentEvent,
  ConversationPage,
  ConversationSummary,
  CreatedConversation,
  EventPage,
  ServerInfo,
} from "./types";

const CLIENT_NAME = "openhands_mobile";
const CLIENT_VERSION = "0.1.0";
const MINIMUM_AGENT_SERVER = "1.28.0";

export class AgentServerError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "AgentServerError";
    this.status = status;
  }
}

export function normalizeHost(host: string): string {
  const trimmed = host.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(
  record: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function headers(apiKey: string): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Session-API-Key": apiKey,
    "X-OpenHands-Client": CLIENT_NAME,
    "X-OpenHands-Client-Version": CLIENT_VERSION,
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `${response.status} ${response.statusText}`;
  try {
    const parsed: unknown = JSON.parse(text);
    if (isRecord(parsed)) {
      const detail = parsed.detail ?? parsed.message ?? parsed.error;
      if (typeof detail === "string" && detail.trim()) return detail;
    }
  } catch {
    // Use the raw body when the server did not return JSON.
  }
  return text.slice(0, 280);
}

async function request<T>(
  host: string,
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${normalizeHost(host)}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...headers(apiKey),
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new AgentServerError(
      `${message}. Check the host, that OpenHands is running, and that this device can reach it.`,
    );
  }

  if (!response.ok) {
    throw new AgentServerError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
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

export async function createConversation(
  host: string,
  apiKey: string,
  initialText?: string,
): Promise<CreatedConversation> {
  const payload: Record<string, unknown> = {
    max_iterations: 500,
    stuck_detection: true,
    workspace: { working_dir: "workspace/project" },
  };
  if (initialText?.trim()) {
    payload.initial_message = {
      role: "user",
      content: [{ type: "text", text: initialText.trim() }],
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
  await request(
    host,
    apiKey,
    `/api/conversations/${conversationId}/events?run=true`,
    {
      method: "POST",
      body: JSON.stringify({
        role: "user",
        content: [{ type: "text", text }],
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
