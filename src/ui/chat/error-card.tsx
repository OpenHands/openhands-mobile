import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, textBase, typeScale } from "../../theme";
import { MarkdownRenderer } from "../markdown/markdown-renderer";
import { isPressHot, pressWebProps } from "../press-style";

export function ErrorCard({ message }: { message: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable
        {...pressWebProps()}
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Agent error"
        style={(state) => [styles.row, isPressHot(state) && styles.hot]}
      >
        <Text style={styles.title}>There was an unexpected error</Text>
        <Text style={styles.chevron}>{open ? "▾" : "▸"}</Text>
      </Pressable>
      {open ? <MarkdownRenderer>{message}</MarkdownRenderer> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", marginVertical: 8, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 4,
  },
  hot: { backgroundColor: colors.surfaceRaised },
  title: {
    ...textBase,
    color: colors.danger,
    fontSize: typeScale.meta,
    fontWeight: "700",
    flex: 1,
  },
  chevron: { ...textBase, color: colors.danger, fontSize: 12 },
});
