import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import { launchAutomationChat } from "../customize/launch-automation-chat";
import {
  CREATE_AUTOMATION_PROMPT,
  filterRecommendedAutomations,
  type RecommendedAutomation,
} from "../customize/recommended-automations";
import { colors, layout, radius, space, textBase, typeScale } from "../theme";
import { PlayIcon, PlusIcon } from "../ui/icons";
import { ModuleCard } from "../ui/module-card";
import { isPressHot, pressWebProps } from "../ui/press-style";
import { SearchField } from "../ui/search-field";
import { SegmentedControl } from "../ui/segmented-control";
import { ToggleSwitch } from "../ui/toggle-switch";
import { ScreenBody, screenScrollProps, screenStyles } from "./screen-body";

type AutomationsTab = "dashboard" | "templates";

const TABS: { id: AutomationsTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "templates", label: "Templates" },
];

export function AutomationsScreen({
  onToggleNav,
  navOpen,
}: {
  onToggleNav?: () => void;
  navOpen?: boolean;
}) {
  const { connection, openAutomation, openChat } = useAppState();
  const [tab, setTab] = React.useState<AutomationsTab>("dashboard");
  const [health, setHealth] = React.useState<AutomationHealth | null>(null);
  const [items, setItems] = React.useState<AutomationSummary[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!connection) return;
    setError(null);
    setLoading(true);
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

  React.useEffect(() => {
    setQuery("");
  }, [tab]);

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

  const templates = React.useMemo(
    () => filterRecommendedAutomations(query),
    [query],
  );

  const automationHost = health?.ok ? health.host : null;

  const startChat = async (prompt: string) => {
    if (!connection) return;
    setCreating(true);
    setError(null);
    try {
      openChat(
        await launchAutomationChat(connection.host, connection.apiKey, prompt),
      );
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not start that conversation.",
      );
    } finally {
      setCreating(false);
    }
  };

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

  const unavailable = Boolean(health && !health.ok);

  return (
    <ScreenBody
      title="Automations"
      onToggleNav={onToggleNav}
      navOpen={navOpen}
      error={error}
      trailing={
        <Pressable
          {...pressWebProps()}
          onPress={() => void startChat(CREATE_AUTOMATION_PROMPT)}
          disabled={creating}
          accessibilityRole="button"
          accessibilityLabel="Create an automation"
          style={(state) => [
            styles.create,
            isPressHot(state) && styles.createHot,
            creating && styles.createDisabled,
          ]}
        >
          <PlusIcon color={colors.text} />
          <Text style={styles.createLabel}>
            {creating ? "Creating…" : "Create"}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.chrome}>
        <SegmentedControl value={tab} options={TABS} onChange={setTab} />
      </View>

      {tab === "templates" ? (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          {...screenScrollProps}
          contentContainerStyle={screenStyles.content}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={styles.pageTitle}>Templates</Text>
              <Text style={screenStyles.hint}>
                Browse proven automations and beta ideas, then launch one into a
                conversation to tailor it to your work.
              </Text>
              <SearchField
                value={query}
                onChangeText={setQuery}
                placeholder="Search templates"
              />
            </View>
          }
          ListEmptyComponent={
            <Text style={screenStyles.empty}>
              No templates match that search.
            </Text>
          }
          renderItem={({ item }) => (
            <TemplateCard
              item={item}
              disabled={creating}
              onPress={() => void startChat(item.launchPrompt)}
            />
          )}
        />
      ) : (
        <FlatList
          data={unavailable || loading ? [] : visible}
          keyExtractor={(item) => item.id}
          {...screenScrollProps}
          contentContainerStyle={screenStyles.content}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={styles.pageTitle}>Dashboard</Text>
              <Text style={screenStyles.hint}>
                Health, activity, and run performance across your automations.
              </Text>
              {!unavailable && !loading ? (
                <SearchField
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search automations"
                />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : unavailable && health && !health.ok ? (
              <UnavailableState reason={health.reason} onRetry={() => void load()} />
            ) : (
              <Text style={screenStyles.empty}>
                {query.trim()
                  ? "No automations match that search."
                  : "No automations yet. Create one or launch a template."}
              </Text>
            )
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
                      (running === item.id || !item.enabled) &&
                        styles.runDisabled,
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

function TemplateCard({
  item,
  disabled,
  onPress,
}: {
  item: RecommendedAutomation;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <ModuleCard
      title={item.name}
      subtitle={item.description}
      pill={item.featured ? "Featured" : item.category}
      onPress={disabled ? undefined : onPress}
    />
  );
}

function UnavailableState({
  reason,
  onRetry,
}: {
  reason: "unavailable" | "agent-only";
  onRetry: () => void;
}) {
  return (
    <View style={styles.unavailable}>
      <Text style={styles.unavailableTitle}>Automations Unavailable</Text>
      <Text style={screenStyles.empty}>
        {reason === "agent-only"
          ? "This device is talking to the agent server only. Start OpenHands with automations (npm run dev) or connect to the ingress host, usually port 8000."
          : "The automations backend is not available right now. Please try again later or check that the automation service is running."}
      </Text>
      <Pressable
        {...pressWebProps()}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry"
        style={(state) => [styles.retry, isPressHot(state) && styles.retryHot]}
      >
        <Text style={styles.retryLabel}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chrome: {
    paddingHorizontal: layout.gutter,
    paddingBottom: space.md,
  },
  headerBlock: {
    gap: space.md,
  },
  pageTitle: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.brand,
    lineHeight: 28,
    fontWeight: "600",
  },
  create: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  createHot: {
    backgroundColor: colors.tertiary,
  },
  createDisabled: {
    opacity: 0.45,
  },
  createLabel: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.meta,
    lineHeight: 18,
    fontWeight: "600",
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
  centered: {
    paddingVertical: space.xxl,
    alignItems: "center",
  },
  unavailable: {
    gap: space.md,
    paddingTop: space.sm,
  },
  unavailableTitle: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.brand,
    lineHeight: 28,
    fontWeight: "600",
  },
  retry: {
    alignSelf: "flex-start",
    minHeight: 36,
    paddingHorizontal: space.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  retryHot: {
    backgroundColor: colors.tertiary,
  },
  retryLabel: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.meta,
    lineHeight: 18,
    fontWeight: "600",
  },
});
