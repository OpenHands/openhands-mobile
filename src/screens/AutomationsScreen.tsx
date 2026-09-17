import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import {
  dispatchAutomation,
  listAutomations,
  resolveAutomationHealth,
  setAutomationEnabled,
  type AutomationHealth,
  type AutomationSummary,
} from "../api/automations";
import { AgentServerError } from "../api/http";
import { useAppState } from "../context/app-state";
import { automationTriggerLabel } from "../customize/automation-labels";
import { colors, radius, space, textBase, typeScale } from "../theme";
import { PlayIcon } from "../ui/icons";
import { ModuleCard } from "../ui/module-card";
import { isPressHot, pressWebProps } from "../ui/press-style";
import { SearchField } from "../ui/search-field";
import { ToggleSwitch } from "../ui/toggle-switch";
import { ScreenBody, screenScrollProps, screenStyles } from "./screen-body";

export function AutomationsScreen({
  onToggleNav,
  navOpen,
}: {
  onToggleNav?: () => void;
  navOpen?: boolean;
}) {
  const { connection, openAutomation } = useAppState();
  const [health, setHealth] = React.useState<AutomationHealth | null>(null);
  const [items, setItems] = React.useState<AutomationSummary[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!connection) return;
    setError(null);
    try {
      const nextHealth = await resolveAutomationHealth(
        connection.host,
        connection.apiKey,
      );
      setHealth(nextHealth);
      if (!nextHealth.ok) {
        setItems([]);
        return;
      }
      setItems(await listAutomations(nextHealth.host, connection.apiKey));
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not load automations.",
      );
    } finally {
      setLoading(false);
    }
  }, [connection]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? items.filter((item) => item.name.toLowerCase().includes(needle))
      : items;
    return [...filtered].sort((left, right) => {
      if (left.enabled !== right.enabled) return left.enabled ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
  }, [items, query]);

  const automationHost = health?.ok ? health.host : null;

  const toggle = async (item: AutomationSummary, enabled: boolean) => {
    if (!connection || !automationHost) return;
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, enabled } : entry,
      ),
    );
    setSaving(item.id);
    try {
      const updated = await setAutomationEnabled(
        automationHost,
        connection.apiKey,
        item.id,
        enabled,
      );
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? updated : entry)),
      );
    } catch (caught) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, enabled: item.enabled } : entry,
        ),
      );
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not update that automation.",
      );
    } finally {
      setSaving(null);
    }
  };

  const runNow = async (item: AutomationSummary) => {
    if (!connection || !automationHost) return;
    setRunning(item.id);
    setError(null);
    try {
      await dispatchAutomation(automationHost, connection.apiKey, item.id);
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not run that automation.",
      );
    } finally {
      setRunning(null);
    }
  };

  const unavailable = health && !health.ok;

  return (
    <ScreenBody
      title="Automations"
      onToggleNav={onToggleNav}
      navOpen={navOpen}
      loading={loading}
      error={error}
    >
      {unavailable ? (
        <View style={screenStyles.content}>
          <Text style={styles.unavailableTitle}>Automations unavailable</Text>
          <Text style={screenStyles.empty}>
            {health.reason === "agent-only"
              ? "This device is talking to the agent server only. Start OpenHands with automations (npm run dev) or connect to the ingress host, usually port 8000."
              : "The automations backend is not available right now. Check that the automation service is running on the laptop."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          {...screenScrollProps}
          contentContainerStyle={screenStyles.content}
          ListHeaderComponent={
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Search automations"
            />
          }
          ListEmptyComponent={
            <Text style={screenStyles.empty}>
              {query.trim()
                ? "No automations match that search."
                : "No automations configured. Create them on the laptop — you can enable, disable, and run them here."}
            </Text>
          }
          renderItem={({ item }) => (
            <ModuleCard
              title={item.name}
              subtitle={automationTriggerLabel(item.trigger)}
              pill={item.enabled ? "On" : "Off"}
              onPress={() => openAutomation(item.id)}
              trailing={
                <View style={styles.actions}>
                  <Pressable
                    {...pressWebProps()}
                    onPress={() => void runNow(item)}
                    disabled={running === item.id || !item.enabled}
                    accessibilityRole="button"
                    accessibilityLabel={`Run ${item.name}`}
                    style={(state) => [
                      styles.run,
                      isPressHot(state) && styles.runHot,
                      (running === item.id || !item.enabled) && styles.runDisabled,
                    ]}
                  >
                    <PlayIcon />
                  </Pressable>
                  <ToggleSwitch
                    value={item.enabled}
                    disabled={saving === item.id}
                    accessibilityLabel={`${item.enabled ? "Disable" : "Enable"} ${item.name}`}
                    onValueChange={(next) => void toggle(item, next)}
                  />
                </View>
              }
            />
          )}
        />
      )}
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  unavailableTitle: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.brand,
    lineHeight: 28,
    fontWeight: "600",
    paddingTop: space.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  run: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  runHot: {
    backgroundColor: colors.tertiary,
  },
  runDisabled: {
    opacity: 0.35,
  },
});
