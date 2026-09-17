import React from "react";
import {
  buildEventsSocketUrl,
  parseSocketEvent,
  sendSocketAuth,
} from "../api/agent-server";
import type { AgentEvent } from "../api/types";

interface UseConversationSocketOptions {
  host: string;
  apiKey: string;
  conversationId: string;
  afterTimestamp: string | null;
  enabled: boolean;
  onEvent: (event: AgentEvent) => void;
}

export function useConversationSocket({
  host,
  apiKey,
  conversationId,
  afterTimestamp,
  enabled,
  onEvent,
}: UseConversationSocketOptions) {
  const [status, setStatus] = React.useState<"offline" | "connecting" | "live">(
    "offline",
  );
  const onEventRef = React.useRef(onEvent);
  onEventRef.current = onEvent;

  React.useEffect(() => {
    if (!enabled) {
      setStatus("offline");
      return undefined;
    }

    let closed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      if (closed) return;
      setStatus("connecting");
      const url = buildEventsSocketUrl(host, conversationId, { afterTimestamp });
      socket = new WebSocket(url);

      socket.onopen = () => {
        if (!socket) return;
        sendSocketAuth(socket, apiKey);
        attempt = 0;
        setStatus("live");
      };

      socket.onmessage = (message) => {
        try {
          const parsed: unknown = JSON.parse(String(message.data));
          const event = parseSocketEvent(parsed);
          if (event) onEventRef.current(event);
        } catch {
          // Ignore non-JSON frames (heartbeats, auth acks).
        }
      };

      socket.onerror = () => {
        setStatus("offline");
      };

      socket.onclose = () => {
        setStatus("offline");
        if (closed) return;
        const delay = Math.min(30_000, 1000 * 2 ** attempt);
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [afterTimestamp, apiKey, conversationId, enabled, host]);

  return status;
}
