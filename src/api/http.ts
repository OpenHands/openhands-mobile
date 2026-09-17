const CLIENT_NAME = "openhands_mobile";
const CLIENT_VERSION = "0.1.0";

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

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stringField(
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

function formatApiDetail(detail: unknown): string {
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (isRecord(item) && typeof item.msg === "string") {
          return item.msg.replace(/^Value error,\s*/i, "").trim();
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length) return parts.join(" ");
  }
  return "";
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `${response.status} ${response.statusText}`;
  try {
    const parsed: unknown = JSON.parse(text);
    if (isRecord(parsed)) {
      const detail = formatApiDetail(
        parsed.detail ?? parsed.message ?? parsed.error,
      );
      if (detail) return detail;
    }
  } catch {
    // Use the raw body when the server did not return JSON.
  }
  return text.slice(0, 280);
}

const REQUEST_TIMEOUT_MS = 20_000;

export async function request<T>(
  host: string,
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const base = normalizeHost(host);
  const url = `${base}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  init.signal?.addEventListener("abort", onAbort);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        ...headers(apiKey),
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    if (controller.signal.aborted && init.signal?.aborted !== true) {
      throw new AgentServerError(
        `Timed out reaching ${base}. Scan the internet pairing QR from Settings → Mobile, or enter a host this phone can open.`,
      );
    }
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new AgentServerError(
      `${message}. Check the host, that OpenHands is running, and that this device can reach it.`,
    );
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener("abort", onAbort);
  }

  if (!response.ok) {
    throw new AgentServerError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
