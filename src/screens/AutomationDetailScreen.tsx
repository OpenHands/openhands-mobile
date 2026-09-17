import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  dispatchAutomation,
  getAutomation,
  resolveAutomationHealth,
  setAutomationEnabled,
  type AutomationSummary,
} from "../api/automations";
import { AgentServerError } from "../api/http";
import { useAppState } from "../context/app-state";
import { automationTriggerLabel } from "../customize/automation-labels";
import { formatTimeDelta } from "../lib/format-time-delta";
import { colors, radius, space, textBase, typeScale } from "../theme";
import { isPressHot, pressWebProps } from "../ui/press-style";
import { ToggleSwitch } from "../ui/toggle-switch";
import { ScreenBody, screenScrollProps, screenStyles } from "./screen-body";

export function AutomationDetailScreen({
  id,
  onToggleNav,
  navOpen,
}: {
  id: string;
  onToggleNav?: () => void;
  navOpen?: boolean;
}) {
  const { connection, openAutomations } = useAppState();
  const [item, setItem] = React.useState<AutomationSummary | null>(null);
  const [host, setHost] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [running, setRunning] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!connection) return;
    setError(null);
    try {
      const health = await resolveAutomationHealth(
        connection.host,
        connection.apiKey,
      );
      if (!health.ok) {
        setError("Automations are not available on this backend.");
        return;
      }
      setHost(health.host);
      setItem(await getAutomation(health.host, connection.apiKey, id));
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not load this automation.",
      );
    } finally {
      setLoading(false);
    }
  }, [connection, id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (enabled: boolean) => {
    if (!connection || !host || !item) return;
    const previous = item;
    setItem({ ...item, enabled });
    setSaving(true);
    try {
      setItem(await setAutomationEnabled(host, connection.apiKey, id, enabled));
    } catch (caught) {
      setItem(previous);
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not update this automation.",
      );
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    if (!connection || !host) return;
    setRunning(true);
    setError(null);
    try {
      await dispatchAutomation(host, connection.apiKey, id);
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not run this automation.",
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <ScreenBody
      title={item?.name ?? "Automation"}
      onToggleNav={onToggleNav}
      navOpen={navOpen}
      onBack={openAutomations}
      loading={loading}
      error={error}
    >
      {item ? (
        <ScrollView {...screenScrollProps} contentContainerStyle={screenStyles.content}>
          <View style={styles.row}>
            <Text style={styles.label}>Enabled</Text>
            <ToggleSwitch
              value={item.enabled}
              disabled={saving}
              accessibilityLabel={`${item.enabled ? "Disable" : "Enable"} ${item.name}`}
              onValueChange={(next) => void toggle(next)}
            />
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>Trigger</Text>
            <Text style={styles.value}>{automationTriggerLabel(item.trigger)}</Text>
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>Last run</Text>
            <Text style={styles.value}>
              {item.lastTriggeredAt
                ? formatTimeDelta(item.lastTriggeredAt)
                : "Never"}
            </Text>
          </View>
          {item.disabledReason ? (
            <View style={styles.block}>
              <Text style={styles.label}>Disabled reason</Text>
              <Text style={styles.value}>{item.disabledReason}</Text>
            </View>
          ) : null}
          {item.prompt ? (
            <View style={styles.block}>
              <Text style={styles.label}>Prompt</Text>
              <Text style={styles.prompt}>{item.prompt}</Text>
            </View>
          ) : null}
          <Pressable
            {...pressWebProps("accent")}
            onPress={() => void runNow()}
            disabled={running || !item.enabled}
            accessibilityRole="button"
            accessibilityLabel="Run now"
            style={(state) => [
              styles.run,
              isPressHot(state) && styles.runHot,
              (running || !item.enabled) && styles.runDisabled,
            ]}
          >
            <Text style={styles.runLabel}>{running ? "Running…" : "Run now"}</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
  },
  block: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    gap: 6,
  },
  label: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.meta,
    lineHeight: 18,
    fontWeight: "500",
  },
  value: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.title,
    lineHeight: 22,
  },
  prompt: {
    ...textBase,
    color: colors.textSecondary,
    fontSize: typeScale.meta,
    lineHeight: 20,
  },
  run: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  runHot: {
    opacity: 0.85,
  },
  runDisabled: {
    opacity: 0.4,
  },
  runLabel: {
    ...textBase,
    color: colors.accentForeground,
    fontSize: typeScale.title,
    fontWeight: "600",
  },
});
