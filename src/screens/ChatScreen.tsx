import React from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AgentServerError,
  eventText,
  isUserMessage,
  searchEvents,
  sendMessage,
} from "../api/agent-server";
import type { AgentEvent, ConversationSummary } from "../api/types";
import { mapEventToRows, type ChatRow } from "../chat/map-event";
import { useAppState } from "../context/app-state";
import { useConversationSocket } from "../hooks/useConversationSocket";
import { colors, layout, space, textBase, typeScale } from "../theme";
import { ChatBubble } from "../ui/chat-message";
import { Composer } from "../ui/composer";
import { MenuButton } from "../ui/menu-button";
import { StatusDot } from "../ui/status-dot";
import { webChatProps, webScrollbarProps } from "../ui/web-scrollbar";

const HISTORY_PAGE_SIZE = 50;

function mergeEvents(current: AgentEvent[], incoming: AgentEvent): AgentEvent[] {
  if (current.some((event) => event.id === incoming.id)) return current;
  if (isUserMessage(incoming)) {
    const text = eventText(incoming);
    return [
      ...current.filter(
        (event) =>
          !(event.id.startsWith("local-") && eventText(event) === text),
      ),
      incoming,
    ];
  }
  return [...current, incoming];
}

function mergeEventPage(
  current: AgentEvent[],
  incoming: AgentEvent[],
): AgentEvent[] {
  return incoming.reduce(mergeEvents, current);
}

export function ChatScreen({
  conversation,
  onToggleNav,
  navOpen = false,
}: {
  conversation: ConversationSummary;
  onToggleNav?: () => void;
  navOpen?: boolean;
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

  useConversationSocket({
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
      next.push(...mapEventToRows(event));
    }
    if (streamBuffer) {
      next.push({ id: "stream-live", kind: "assistant", text: streamBuffer });
    }
    return next;
  }, [events]);

  const refreshEvents = React.useCallback(async () => {
    if (!connection) return;
    const page = await searchEvents(
      connection.host,
      connection.apiKey,
      conversation.id,
      { limit: HISTORY_PAGE_SIZE },
    );
    const chronological = [...page.items].reverse();
    setEvents((current) => mergeEventPage(current, chronological));
  }, [connection, conversation.id]);

  const onSend = async () => {
    if (!connection || !draft.trim() || sending) return;
    const text = draft.trim();
    const optimisticId = `local-${Date.now()}`;
    setDraft("");
    setSending(true);
    setError(null);
    setEvents((current) => [
      ...current,
      {
        id: optimisticId,
        timestamp: new Date().toISOString(),
        source: "user",
        kind: "MessageEvent",
        llm_message: { role: "user", content: [{ type: "text", text }] },
      },
    ]);
    try {
      await sendMessage(connection.host, connection.apiKey, conversation.id, text);
      void (async () => {
        for (let attempt = 0; attempt < 8; attempt += 1) {
          await new Promise((resolve) => {
            setTimeout(resolve, 1500);
          });
          try {
            await refreshEvents();
          } catch {
            // Live updates still come from the socket when polling fails.
          }
        }
      })();
    } catch (caught) {
      setEvents((current) =>
        current.filter((event) => event.id !== optimisticId),
      );
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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]} {...webChatProps}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          {onToggleNav ? (
            <MenuButton open={navOpen} onPress={onToggleNav} />
          ) : null}
          <View style={styles.headerCopy}>
            <StatusDot status={conversation.executionStatus} />
            <Text style={styles.title} numberOfLines={1}>
              {conversation.title}
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
            {...webScrollbarProps}
            style={styles.transcriptScroll}
            contentContainerStyle={styles.transcript}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <Text style={styles.empty}>
                No messages yet. Send one to continue this conversation.
              </Text>
            }
            renderItem={({ item }) => <ChatBubble row={item} />}
          />
        )}

        <Composer
          value={draft}
          onChangeText={setDraft}
          onSubmit={() => void onSend()}
          disabled={sending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    minHeight: layout.headerRowHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: layout.gutter,
    gap: space.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    ...textBase,
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: typeScale.title,
    lineHeight: 22,
    fontWeight: "600",
  },
  error: {
    ...textBase,
    color: colors.danger,
    paddingHorizontal: layout.gutter,
    paddingTop: space.sm,
    fontSize: typeScale.meta,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  transcriptScroll: { flex: 1, minHeight: 0 },
  transcript: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.lg,
    paddingBottom: 40,
  },
  empty: {
    ...textBase,
    color: colors.muted,
    textAlign: "center",
    marginTop: space.xxl,
    fontSize: typeScale.title,
    lineHeight: 24,
  },
});
