import { assertCompatibleServer } from "../api/agent-server";
import {
  saveConnection,
  type StoredConnection,
} from "../storage/connection-store";
import type { MobileConnectPayload } from "./mobile-connect-payload";

export async function applyMobileConnectPayload(
  payload: MobileConnectPayload,
): Promise<StoredConnection> {
  await assertCompatibleServer(payload.host, payload.apiKey);
  return saveConnection({
    name: payload.name,
    host: payload.host,
    apiKey: payload.apiKey,
  });
}
