import React from "react";
import { FlatList, Text } from "react-native";
import { AgentServerError } from "../api/http";
import {
  listInstalledPlugins,
  setPluginEnabled,
  type InstalledPlugin,
} from "../api/plugins";
import { useAppState } from "../context/app-state";
import { ModuleCard } from "../ui/module-card";
import { ToggleSwitch } from "../ui/toggle-switch";
import { ScreenBody, screenScrollProps, screenStyles } from "./screen-body";

export function PluginsScreen({
  onToggleNav,
  navOpen,
}: {
  onToggleNav?: () => void;
  navOpen?: boolean;
}) {
  const { connection, openCustomize } = useAppState();
  const [plugins, setPlugins] = React.useState<InstalledPlugin[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!connection) return;
    setError(null);
    try {
      setPlugins(await listInstalledPlugins(connection.host, connection.apiKey));
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not load plugins.",
      );
    } finally {
      setLoading(false);
    }
  }, [connection]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (plugin: InstalledPlugin, enabled: boolean) => {
    if (!connection) return;
    setPlugins((current) =>
      current.map((item) =>
        item.name === plugin.name ? { ...item, enabled } : item,
      ),
    );
    setSaving(plugin.name);
    try {
      await setPluginEnabled(
        connection.host,
        connection.apiKey,
        plugin.name,
        enabled,
      );
    } catch (caught) {
      setPlugins((current) =>
        current.map((item) =>
          item.name === plugin.name ? { ...item, enabled: plugin.enabled } : item,
        ),
      );
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not update that plugin.",
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <ScreenBody
      title="Plugins"
      onToggleNav={onToggleNav}
      navOpen={navOpen}
      onBack={() => openCustomize("hub")}
      loading={loading}
      error={error}
    >
      <FlatList
        data={plugins}
        keyExtractor={(item) => item.name}
        {...screenScrollProps}
        contentContainerStyle={screenStyles.content}
        ListEmptyComponent={
          <Text style={screenStyles.empty}>
            No plugins installed. Install them on the laptop under Customize →
            Plugins.
          </Text>
        }
        renderItem={({ item }) => (
          <ModuleCard
            title={item.name}
            subtitle={item.description || undefined}
            pill={item.version || undefined}
            trailing={
              <ToggleSwitch
                value={item.enabled}
                disabled={saving === item.name}
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
