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
import { colors, radius, space } from "../theme";

function formatWhen(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function ConversationListScreen() {
  const { connection, openChat, disconnect } = useAppState();
  const [items, setItems] = React.useState<ConversationSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? `${caught.message} Start a thread on the laptop if create is not supported yet.`
          : "Could not create a conversation.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>{connection?.name ?? "OpenHands"}</Text>
          <Text style={styles.title}>Conversations</Text>
          <Text style={styles.host} numberOfLines={1}>
            {connection?.host}
          </Text>
        </View>
        <Pressable onPress={() => void disconnect()} style={styles.linkButton}>
          <Text style={styles.link}>Switch</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
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
              No conversations yet. Start one on the laptop, or try New chat.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openChat(item)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta}>
                {item.executionStatus ?? "idle"} · {formatWhen(item.updatedAt)}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Pressable
        onPress={() => void onCreate()}
        disabled={creating}
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.cardPressed,
          creating && styles.disabled,
        ]}
      >
        <Text style={styles.fabText}>{creating ? "Creating…" : "New chat"}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.md,
  },
  headerText: { flex: 1, gap: 4 },
  kicker: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  title: { color: colors.text, fontSize: 28, fontWeight: "700" },
  host: { color: colors.muted, fontSize: 13 },
  linkButton: { paddingVertical: 8 },
  link: { color: colors.accent, fontSize: 16, fontWeight: "600" },
  error: {
    color: colors.danger,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: space.lg, paddingBottom: 96, gap: space.sm },
  emptyContainer: { flexGrow: 1, padding: space.lg },
  empty: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: 6,
  },
  cardPressed: { opacity: 0.8 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: "600" },
  cardMeta: { color: colors.muted, fontSize: 13 },
  fab: {
    position: "absolute",
    right: space.lg,
    bottom: space.lg,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: space.lg,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: colors.bg, fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.6 },
});
