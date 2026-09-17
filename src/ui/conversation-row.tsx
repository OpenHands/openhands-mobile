import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { ConversationSummary } from "../api/types";
import { formatTimeDelta } from "../lib/format-time-delta";
import { colors, layout, radius, space, textBase, typeScale } from "../theme";
import { isPressHot, pressWebProps } from "./press-style";
import { StatusDot } from "./status-dot";

export function ConversationRow({
  item,
  active,
  onPress,
}: {
  item: ConversationSummary;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      {...pressWebProps()}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={(state) => [
        styles.row,
        active && styles.rowActive,
        isPressHot(state) && styles.rowHot,
      ]}
    >
      <StatusDot status={item.executionStatus} />
      <Text style={styles.title} numberOfLines={1}>
        {item.title || "Untitled conversation"}
      </Text>
      <Text style={styles.time}>
        {formatTimeDelta(item.updatedAt || item.createdAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.conversationRowHeight,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  rowActive: {
    backgroundColor: colors.surface,
  },
  rowHot: {
    backgroundColor: colors.surfaceRaised,
  },
  title: {
    ...textBase,
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: typeScale.title,
    lineHeight: 24,
    fontWeight: "400",
  },
  time: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.caption,
    lineHeight: 16,
    flexShrink: 0,
  },
});
