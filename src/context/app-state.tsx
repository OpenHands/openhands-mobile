import React from "react";
import type { ConversationSummary } from "../api/types";
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

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
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
  }, []);

  const value = React.useMemo<AppStateValue>(
    () => ({
      route,
      connection,
      setConnection: (next) => {
        setConnectionState(next);
        setRoute({ name: "list" });
      },
      openList: () => setRoute({ name: "list" }),
      openChat: (conversation) => setRoute({ name: "chat", conversation }),
      openCustomize: (section = "hub") => setRoute({ name: "customize", section }),
      openAutomations: () => setRoute({ name: "automations" }),
      openAutomation: (id) => setRoute({ name: "automation", id }),
      disconnect: async () => {
        await clearActiveConnection();
        setConnectionState(null);
        setRoute({ name: "connect" });
      },
    }),
    [connection, route],
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
