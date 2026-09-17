import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, space, textBase, typeScale } from "../../theme";
import type { EventStatus } from "../../chat/event-content";
import { MarkdownRenderer } from "../markdown/markdown-renderer";
import { isPressHot, pressWebProps } from "../press-style";

export function EventCard({
  title,
  details,
  status,
}: {
  title: string;
  details: string;
  status?: EventStatus;
}) {
  const [open, setOpen] = React.useState(false);
  const canExpand = Boolean(details.trim());

  return (
    <View style={styles.wrap}>
      <Pressable
        {...pressWebProps()}
        onPress={() => canExpand && setOpen((value) => !value)}
        disabled={!canExpand}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        style={(state) => [styles.row, isPressHot(state) && styles.hot]}
      >
        <Text style={styles.chevron}>{canExpand ? (open ? "▾" : "▸") : " "}</Text>
        <Text style={styles.title} numberOfLines={open ? undefined : 2}>
          {title}
        </Text>
        {status && status !== "running" ? (
          <Text
            style={[
              styles.status,
              status === "error" && styles.statusError,
              status === "timeout" && styles.statusTimeout,
              status === "success" && styles.statusSuccess,
            ]}
          >
            {status === "timeout" ? "⏱" : status === "error" ? "✕" : "●"}
          </Text>
        ) : null}
      </Pressable>
      {open && canExpand ? (
        <View style={styles.details}>
          <MarkdownRenderer>{details}</MarkdownRenderer>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginVertical: 4,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  hot: { backgroundColor: colors.surfaceRaised },
  chevron: {
    ...textBase,
    color: colors.muted,
    width: 14,
    fontSize: 12,
  },
  title: {
    ...textBase,
    flex: 1,
    minWidth: 0,
    color: colors.muted,
    fontSize: typeScale.meta,
    lineHeight: 20,
  },
  status: {
    ...textBase,
    fontSize: 12,
    marginLeft: space.sm,
  },
  statusSuccess: { color: colors.statusSuccess },
  statusError: { color: colors.statusError },
  statusTimeout: { color: colors.timeout },
  details: {
    marginTop: 6,
    paddingLeft: 22,
  },
});
