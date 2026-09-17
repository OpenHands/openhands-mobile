export const MOBILE_CONNECT_URL_SCHEME = "openhands";
export const MOBILE_CONNECT_URL_PATH = "connect";
export const MOBILE_CONNECT_VERSION = "1";

export interface MobileConnectPayload {
  host: string;
  apiKey: string;
  name: string;
}

export function normalizeConnectHost(host: string): string {
  const trimmed = host.trim();
  if (!trimmed) {
    return "";
  }
  if (
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) &&
    !/^https?:\/\//i.test(trimmed)
  ) {
    return "";
  }
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  return withScheme.replace(/\/+$/, "");
}

export function buildMobileConnectUrl(payload: MobileConnectPayload): string {
  const host = normalizeConnectHost(payload.host);
  const apiKey = payload.apiKey.trim();
  if (!host || !apiKey) {
    throw new Error("Mobile connect payload requires a host and session key");
  }
  const params = new URLSearchParams({
    v: MOBILE_CONNECT_VERSION,
    host,
    key: apiKey,
    name: payload.name.trim() || "OpenHands",
  });
  return `${MOBILE_CONNECT_URL_SCHEME}://${MOBILE_CONNECT_URL_PATH}?${params.toString()}`;
}

export function parseMobileConnectUrl(
  raw: string,
): MobileConnectPayload | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== `${MOBILE_CONNECT_URL_SCHEME}:`) {
    return null;
  }
  const path = url.pathname.replace(/^\//, "");
  if (
    url.hostname !== MOBILE_CONNECT_URL_PATH &&
    path !== MOBILE_CONNECT_URL_PATH
  ) {
    return null;
  }
  if (url.searchParams.get("v") !== MOBILE_CONNECT_VERSION) {
    return null;
  }
  const host = normalizeConnectHost(url.searchParams.get("host") ?? "");
  const apiKey = (url.searchParams.get("key") ?? "").trim();
  const name = (url.searchParams.get("name") ?? "").trim() || "OpenHands";
  if (!host || !apiKey) {
    return null;
  }
  try {
    const parsedHost = new URL(host);
    if (parsedHost.protocol !== "http:" && parsedHost.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }
  return { host, apiKey, name };
}
