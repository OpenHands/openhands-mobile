import React from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AgentServerError,
  eventText,
  isAssistantMessage,
  isToolEvent,
  isUserMessage,
  searchEvents,
  sendMessage,
  toolLabel,
} from "../api/agent-server";
import type { AgentEvent } from "../api/types";
import { useAppState } from "../context/app-state";
import { useConversationSocket } from "../hooks/useConversationSocket";
import { colors, radius, space } from "../theme";
import type { ConversationSummary } from "../api/types";

const HISTORY_PAGE_SIZE = 50;

interface ChatRow {
  id: string;
  kind: "user" | "assistant" | "tool" | "other";
  text: string;
}

function toRow(event: AgentEvent): ChatRow | null {
  if (event.kind === "ConversationStateUpdateEvent") return null;
  if (event.kind === "StreamingDeltaEvent") {
    const text = eventText(event);
    if (!text) return null;
    return { id: event.id, kind: "assistant", text };
  }
  if (isUserMessage(event)) {
    const text = eventText(event);
    return text ? { id: event.id, kind: "user", text } : null;
  }
  if (isAssistantMessage(event) && event.kind === "MessageEvent") {
    const text = eventText(event);
    return text ? { id: event.id, kind: "assistant", text } : null;
  }
  if (isToolEvent(event)) {
    return { id: event.id, kind: "tool", text: toolLabel(event) };
  }
  return null;
}

function mergeEvents(current: AgentEvent[], incoming: AgentEvent): AgentEvent[] {
  if (current.some((event) => event.id === incoming.id)) return current;
  return [...current, incoming];
}

export function ChatScreen({
  conversation,
  onBack,
}: {
  conversation: ConversationSummary;
  onBack?: () => void;
}) {
  const { connection } = useAppState();
  const [events, setEvents] = React.useState<AgentEvent[]>([]);
  const [draft, setDraft] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [historyReady, setHistoryReady] = React.useState(false);
  const [socketAnchor, setSocketAnchor] = React.useState<string | null>(null);
  const listRef = React.useRef<FlatList<ChatRow>>(null);

  React.useEffect(() => {
    if (!connection) return undefined;
    let cancelled = false;
    setLoading(true);
    setHistoryReady(false);
    setSocketAnchor(null);
    void (async () => {
      try {
        const page = await searchEvents(
          connection.host,
          connection.apiKey,
          conversation.id,
          { limit: HISTORY_PAGE_SIZE },
        );
        if (cancelled) return;
        const chronological = [...page.items].reverse();
        setEvents(chronological);
        setSocketAnchor(
          chronological[chronological.length - 1]?.timestamp ?? null,
        );
        setError(null);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof AgentServerError
              ? caught.message
              : "Could not load this conversation.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHistoryReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, conversation.id]);

  const socketStatus = useConversationSocket({
    host: connection?.host ?? "",
    apiKey: connection?.apiKey ?? "",
    conversationId: conversation.id,
    afterTimestamp: socketAnchor,
    enabled: Boolean(connection) && historyReady,
    onEvent: (event) => {
      setEvents((current) => mergeEvents(current, event));
    },
  });

  const rows = React.useMemo(() => {
    const next: ChatRow[] = [];
    let streamBuffer = "";
    for (const event of events) {
      if (event.kind === "StreamingDeltaEvent") {
        streamBuffer += eventText(event);
        continue;
      }
      if (streamBuffer && event.kind === "MessageEvent" && event.source === "agent") {
        streamBuffer = "";
      } else if (streamBuffer) {
        next.push({
          id: `stream-${event.id}`,
          kind: "assistant",
          text: streamBuffer,
        });
        streamBuffer = "";
      }
      const row = toRow(event);
      if (row) next.push(row);
    }
    if (streamBuffer) {
      next.push({ id: "stream-live", kind: "assistant", text: streamBuffer });
    }
    return next;
  }, [events]);

  const onSend = async () => {
    if (!connection || !draft.trim() || sending) return;
    const text = draft.trim();
    setDraft("");
    setSending(true);
    setError(null);
    try {
      await sendMessage(connection.host, connection.apiKey, conversation.id, text);
    } catch (caught) {
      setDraft(text);
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Message failed to send.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          {onBack ? (
            <Pressable onPress={onBack} style={styles.back}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>
              {conversation.title}
            </Text>
            <Text style={styles.status}>
              {socketStatus === "live"
                ? "Live"
                : socketStatus === "connecting"
                  ? "Connecting…"
                  : "Offline — is the laptop awake?"}
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.transcript}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <Text style={styles.empty}>
                No messages yet. Send one to continue this conversation.
              </Text>
            }
            renderItem={({ item }) => <Bubble row={item} />}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message OpenHands"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
          />
          <Pressable
            onPress={() => void onSend()}
            disabled={sending || !draft.trim()}
            style={({ pressed }) => [
              styles.send,
              pressed && styles.pressed,
              (sending || !draft.trim()) && styles.disabled,
            ]}
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ row }: { row: ChatRow }) {
  if (row.kind === "tool") {
    return (
      <View style={styles.tool}>
        <Text style={styles.toolText}>{row.text}</Text>
      </View>
    );
  }

  const isUser = row.kind === "user";
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.agentBubble]}>
      <Text style={styles.bubbleText}>{row.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: space.sm,
  },
  back: { width: 64 },
  backText: { color: colors.accent, fontSize: 16, fontWeight: "600" },
  headerCenter: { flex: 1, alignItems: "center" },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  status: { color: colors.muted, fontSize: 12, marginTop: 2 },
  error: { color: colors.danger, paddingHorizontal: space.md, paddingTop: space.sm },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  transcript: { padding: space.md, gap: space.sm, paddingBottom: space.lg },
  empty: { color: colors.muted, textAlign: "center", marginTop: space.lg },
  bubble: {
    maxWidth: "86%",
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.userBubble,
  },
  agentBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.agentBubble,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { color: colors.text, fontSize: 16, lineHeight: 22 },
  tool: {
    alignSelf: "center",
    backgroundColor: colors.tool,
    borderRadius: 999,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  toolText: { color: colors.muted, fontSize: 12 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
    padding: space.md,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 16,
  },
  send: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: 44,
    paddingHorizontal: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: colors.bg, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});
