import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AgentServerError,
  createConversation,
  searchConversations,
} from "../api/agent-server";
import type { ConversationSummary } from "../api/types";
import { useAppState } from "../context/app-state";
import { colors, layout, radius, space, textBase, typeScale } from "../theme";
import { ConversationRow } from "../ui/conversation-row";
import {
  AutomationsIcon,
  CubesIcon,
  LogoMark,
  PlusIcon,
  SettingsIcon,
} from "../ui/icons";
import { NavRow } from "../ui/nav-row";
import { ProfileMenu } from "../ui/profile-menu";
import { webScrollbarProps, webSidebarProps } from "../ui/web-scrollbar";

export function ConversationListScreen({
  onOpenConversation,
}: {
  onOpenConversation?: () => void;
}) {
  const {
    connection,
    openChat,
    openCustomize,
    openAutomations,
    disconnect,
    route,
  } = useAppState();
  const customizeActive = route.name === "customize";
  const automationsActive =
    route.name === "automations" || route.name === "automation";
  const [items, setItems] = React.useState<ConversationSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const activeId = route.name === "chat" ? route.conversation.id : null;

  const load = React.useCallback(async () => {
    if (!connection) return;
    setError(null);
    try {
      const page = await searchConversations(connection.host, connection.apiKey);
      setItems(page.items);
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not load conversations. Is OpenHands still running?",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [connection]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async () => {
    if (!connection) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createConversation(connection.host, connection.apiKey);
      openChat({
        id: created.id,
        title: created.title ?? "New conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executionStatus: null,
      });
      onOpenConversation?.();
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not create a conversation.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]} {...webSidebarProps}>
      <View style={styles.header}>
        <LogoMark />
        <Text style={styles.wordmark}>OpenHands</Text>
      </View>

      <View style={styles.nav}>
        <NavRow
          label={creating ? "Creating…" : "New Chat"}
          icon={<PlusIcon />}
          onPress={() => void onCreate()}
          disabled={creating}
        />
        <NavRow
          label="Customize"
          icon={<CubesIcon />}
          active={customizeActive}
          onPress={() => {
            openCustomize("hub");
            onOpenConversation?.();
          }}
        />
        <NavRow
          label="Automations"
          icon={<AutomationsIcon />}
          active={automationsActive}
          onPress={() => {
            openAutomations();
            onOpenConversation?.();
          }}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.conversationsHeader}>
        <Text style={styles.conversationsTitle}>Conversations</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          {...webScrollbarProps}
          style={styles.listScroll}
          contentContainerStyle={
            items.length === 0 ? styles.emptyContainer : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              No conversations yet. Start one on the laptop, or try New Chat.
            </Text>
          }
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              active={item.id === activeId}
              onPress={() => {
                openChat(item);
                onOpenConversation?.();
              }}
            />
          )}
        />
      )}

      <View style={styles.footer}>
        <View style={styles.profileRow}>
          <View style={styles.profileGrow}>
            <ProfileMenu
              name={connection?.name ?? "Laptop"}
              host={connection?.host}
              onSwitch={() => void disconnect()}
            />
          </View>
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel="Settings (coming soon)"
            style={styles.settingsGear}
          >
            <SettingsIcon />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: layout.navInset,
  },
  header: {
    minHeight: layout.headerRowHeight,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wordmark: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.brand,
    lineHeight: 28,
    fontWeight: "600",
  },
  nav: {
    paddingTop: space.sm,
    paddingBottom: space.md,
    gap: 2,
  },
  conversationsHeader: {
    minHeight: 40,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
    justifyContent: "center",
  },
  conversationsTitle: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.meta,
    lineHeight: 18,
    fontWeight: "500",
  },
  error: {
    ...textBase,
    color: colors.danger,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
    fontSize: typeScale.meta,
    lineHeight: 18,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listScroll: { flex: 1, minHeight: 0 },
  list: {
    paddingBottom: space.xxl,
  },
  emptyContainer: { flexGrow: 1, padding: space.md },
  empty: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.title,
    lineHeight: 24,
  },
  footer: {
    paddingTop: space.md,
    paddingHorizontal: space.xs,
    paddingBottom: space.md,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profileGrow: { flex: 1, minWidth: 0 },
  settingsGear: {
    width: layout.tap,
    height: layout.tap,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.4,
  },
});
