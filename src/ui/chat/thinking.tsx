import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, textBase, typeScale } from "../../theme";
import { MarkdownRenderer } from "../markdown/markdown-renderer";
import { isPressHot, pressWebProps } from "../press-style";

export function ThinkingCard({ content }: { content: string }) {
  const [open, setOpen] = React.useState(false);
  if (!content.trim()) return null;

  return (
    <View style={styles.wrap}>
      <Pressable
        {...pressWebProps()}
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? "Collapse thinking" : "Expand thinking"}
        style={(state) => [styles.toggle, isPressHot(state) && styles.hot]}
      >
        <Text style={styles.meta}>{open ? "▾" : "▸"}</Text>
        <Text style={styles.meta}>💡</Text>
        <Text style={styles.title}>Thinking</Text>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          <MarkdownRenderer>{content}</MarkdownRenderer>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", marginVertical: 4, paddingVertical: 4 },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  hot: { backgroundColor: colors.surfaceRaised },
  meta: { ...textBase, color: colors.muted, fontSize: typeScale.meta },
  title: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.meta,
    lineHeight: 20,
  },
  body: { marginTop: 6, paddingLeft: 24 },
});
