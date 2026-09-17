import React from "react";
import { FlatList, Text } from "react-native";
import { AgentServerError } from "../api/http";
import { getAppSettings, setMcpServerEnabled } from "../api/settings";
import { useAppState } from "../context/app-state";
import {
  mcpTransportLabel,
  type McpServer,
} from "../customize/mcp-servers";
import { ModuleCard } from "../ui/module-card";
import { ToggleSwitch } from "../ui/toggle-switch";
import { ScreenBody, screenScrollProps, screenStyles } from "./screen-body";

export function McpScreen({
  onToggleNav,
  navOpen,
}: {
  onToggleNav?: () => void;
  navOpen?: boolean;
}) {
  const { connection, openCustomize } = useAppState();
  const [servers, setServers] = React.useState<McpServer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!connection) return;
    setError(null);
    try {
      const settings = await getAppSettings(connection.host, connection.apiKey);
      setServers(settings.mcpServers);
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not load MCP servers.",
      );
    } finally {
      setLoading(false);
    }
  }, [connection]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (server: McpServer, enabled: boolean) => {
    if (!connection) return;
    setServers((current) =>
      current.map((item) =>
        item.id === server.id ? { ...item, enabled } : item,
      ),
    );
    setSaving(server.id);
    try {
      await setMcpServerEnabled(
        connection.host,
        connection.apiKey,
        server.id,
        enabled,
      );
    } catch (caught) {
      setServers((current) =>
        current.map((item) =>
          item.id === server.id ? { ...item, enabled: server.enabled } : item,
        ),
      );
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not update that MCP server.",
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <ScreenBody
      title="MCP Servers"
      onToggleNav={onToggleNav}
      navOpen={navOpen}
      onBack={() => openCustomize("hub")}
      loading={loading}
      error={error}
    >
      <FlatList
        data={servers}
        keyExtractor={(item) => item.id}
        {...screenScrollProps}
        contentContainerStyle={
          servers.length === 0 ? screenStyles.content : screenStyles.content
        }
        ListEmptyComponent={
          <Text style={screenStyles.empty}>
            No MCP servers installed. Add them on the laptop under Customize →
            MCP Servers.
          </Text>
        }
        renderItem={({ item }) => (
          <ModuleCard
            title={item.name}
            subtitle={item.detail || undefined}
            pill={mcpTransportLabel(item.transport)}
            trailing={
              <ToggleSwitch
                value={item.enabled}
                disabled={saving === item.id}
                accessibilityLabel={`${item.enabled ? "Disable" : "Enable"} ${item.name}`}
                onValueChange={(next) => void toggle(item, next)}
              />
            }
          />
        )}
      />
    </ScreenBody>
  );
}
