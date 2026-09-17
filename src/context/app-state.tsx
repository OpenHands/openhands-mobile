import React from "react";
import { Linking } from "react-native";
import type { ConversationSummary } from "../api/types";
import {
  connectionFromConnectUrl,
  payloadFromConnectUrl,
  useMobileConnectLink,
} from "../pairing/use-mobile-connect-link";
import type { StoredConnection } from "../storage/connection-store";
import {
  clearActiveConnection,
  getActiveConnection,
} from "../storage/connection-store";

export type CustomizeSection = "hub" | "skills" | "mcp" | "plugins";

export type Route =
  | { name: "boot" }
  | { name: "connect" }
  | { name: "list" }
  | { name: "chat"; conversation: ConversationSummary }
  | { name: "customize"; section: CustomizeSection }
  | { name: "automations" }
  | { name: "automation"; id: string };

interface AppStateValue {
  route: Route;
  connection: StoredConnection | null;
  pairingError: string | null;
  setConnection: (connection: StoredConnection) => void;
  openList: () => void;
  openChat: (conversation: ConversationSummary) => void;
  openCustomize: (section?: CustomizeSection) => void;
  openAutomations: () => void;
  openAutomation: (id: string) => void;
  disconnect: () => Promise<void>;
}

const AppStateContext = React.createContext<AppStateValue | null>(null);

export function isCustomizeRoute(route: Route): boolean {
  return route.name === "customize";
}

export function isAutomationsRoute(route: Route): boolean {
  return route.name === "automations" || route.name === "automation";
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = React.useState<Route>({ name: "boot" });
  const [connection, setConnectionState] =
    React.useState<StoredConnection | null>(null);
  const [pairingError, setPairingError] = React.useState<string | null>(null);

  const setConnection = React.useCallback((next: StoredConnection) => {
    setPairingError(null);
    setConnectionState(next);
    setRoute({ name: "list" });
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (payloadFromConnectUrl(initialUrl)) {
        try {
          const paired = await connectionFromConnectUrl(initialUrl);
          if (!cancelled && paired) {
            setConnection(paired);
            return;
          }
        } catch (caught: unknown) {
          if (!cancelled) {
            setPairingError(
              caught instanceof Error
                ? caught.message
                : "Could not connect from that QR code.",
            );
          }
        }
      }
      const stored = await getActiveConnection();
      if (cancelled) return;
      if (stored) {
        setConnectionState(stored);
        setRoute({ name: "list" });
      } else {
        setRoute({ name: "connect" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setConnection]);

  useMobileConnectLink(setConnection, setPairingError);

  const value = React.useMemo<AppStateValue>(
    () => ({
      route,
      connection,
      pairingError,
      setConnection,
      openList: () => setRoute({ name: "list" }),
      openChat: (conversation) => setRoute({ name: "chat", conversation }),
      openCustomize: (section = "hub") =>
        setRoute({ name: "customize", section }),
      openAutomations: () => setRoute({ name: "automations" }),
      openAutomation: (id) => setRoute({ name: "automation", id }),
      disconnect: async () => {
        await clearActiveConnection();
        setConnectionState(null);
        setRoute({ name: "connect" });
      },
    }),
    [connection, pairingError, route, setConnection],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const value = React.useContext(AppStateContext);
  if (!value) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return value;
}
