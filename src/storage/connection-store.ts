import * as SecureStore from "expo-secure-store";
import { createId } from "../lib/uuid";
import { normalizeHost } from "../api/agent-server";

const CONNECTIONS_KEY = "openhands.connections.v1";
const ACTIVE_ID_KEY = "openhands.active-connection-id";

export interface StoredConnection {
  id: string;
  name: string;
  host: string;
  apiKey: string;
}

export interface ConnectionDraft {
  name: string;
  host: string;
  apiKey: string;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function listConnections(): Promise<StoredConnection[]> {
  const items = await readJson<StoredConnection[]>(CONNECTIONS_KEY, []);
  return Array.isArray(items) ? items : [];
}

export async function getActiveConnection(): Promise<StoredConnection | null> {
  const [connections, activeId] = await Promise.all([
    listConnections(),
    SecureStore.getItemAsync(ACTIVE_ID_KEY),
  ]);
  if (activeId) {
    const match = connections.find((item) => item.id === activeId);
    if (match) return match;
  }
  return connections[0] ?? null;
}

export async function saveConnection(
  draft: ConnectionDraft,
  existingId?: string,
): Promise<StoredConnection> {
  const connections = await listConnections();
  const connection: StoredConnection = {
    id: existingId ?? createId(),
    name: draft.name.trim() || "Agent server",
    host: normalizeHost(draft.host),
    apiKey: draft.apiKey.trim(),
  };
  const next = existingId
    ? connections.map((item) => (item.id === existingId ? connection : item))
    : [...connections.filter((item) => item.host !== connection.host), connection];
  await SecureStore.setItemAsync(CONNECTIONS_KEY, JSON.stringify(next));
  await SecureStore.setItemAsync(ACTIVE_ID_KEY, connection.id);
  return connection;
}

export async function setActiveConnectionId(id: string): Promise<void> {
  await SecureStore.setItemAsync(ACTIVE_ID_KEY, id);
}

export async function clearActiveConnection(): Promise<void> {
  await SecureStore.deleteItemAsync(ACTIVE_ID_KEY);
}

export async function removeConnection(id: string): Promise<void> {
  const connections = await listConnections();
  const next = connections.filter((item) => item.id !== id);
  await SecureStore.setItemAsync(CONNECTIONS_KEY, JSON.stringify(next));
  const activeId = await SecureStore.getItemAsync(ACTIVE_ID_KEY);
  if (activeId === id) {
    if (next[0]) await SecureStore.setItemAsync(ACTIVE_ID_KEY, next[0].id);
    else await SecureStore.deleteItemAsync(ACTIVE_ID_KEY);
  }
}
