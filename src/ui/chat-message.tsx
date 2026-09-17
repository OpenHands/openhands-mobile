import React from "react";
import { StyleSheet, View } from "react-native";
import type { ChatRow } from "../chat/map-event";
import { colors, radius, space } from "../theme";
import { CriticCard } from "./chat/critic-card";
import { ErrorCard } from "./chat/error-card";
import { EventCard } from "./chat/event-card";
import { TaskListCard } from "./chat/task-list";
import { ThinkingCard } from "./chat/thinking";
import { MarkdownRenderer } from "./markdown/markdown-renderer";

export type { ChatRow, ChatRowKind } from "../chat/map-event";

export function ChatBubble({ row }: { row: ChatRow }) {
  switch (row.kind) {
    case "user":
      return (
        <View style={styles.userWrap}>
          <View style={styles.userBubble}>
            <MarkdownRenderer>{row.text}</MarkdownRenderer>
          </View>
        </View>
      );
    case "assistant":
      return (
        <View style={styles.agent}>
          <MarkdownRenderer>{row.text}</MarkdownRenderer>
        </View>
      );
    case "thinking":
      return <ThinkingCard content={row.text} />;
    case "event":
      return (
        <EventCard title={row.title} details={row.details} status={row.status} />
      );
    case "tasks":
      return <TaskListCard title={row.title} tasks={row.tasks} />;
    case "error":
      return <ErrorCard message={row.text} />;
    case "critic":
      return <CriticCard result={row.result} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  userWrap: {
    alignSelf: "flex-end",
    maxWidth: "86%",
    marginTop: space.xxl,
  },
  userBubble: {
    backgroundColor: colors.tertiary,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: 10,
  },
  agent: {
    alignSelf: "stretch",
    marginTop: space.xxl,
  },
});
