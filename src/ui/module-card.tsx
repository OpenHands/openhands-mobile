import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, textBase, typeScale } from "../theme";
import { isPressHot, pressWebProps } from "./press-style";

export function ModuleCard({
  title,
  subtitle,
  pill,
  onPress,
  trailing,
}: {
  title: string;
  subtitle?: string;
  pill?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const copy = (
    <View style={styles.copy}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {pill ? <Text style={styles.pill}>{pill}</Text> : null}
      </View>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.card}>
      {onPress ? (
        <Pressable
          {...pressWebProps()}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={title}
          style={(state) => [styles.press, isPressHot(state) && styles.hot]}
        >
          {copy}
        </Pressable>
      ) : (
        copy
      )}
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
  },
  press: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.sm,
  },
  hot: {
    backgroundColor: colors.surfaceRaised,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    ...textBase,
    flexShrink: 1,
    color: colors.text,
    fontSize: typeScale.title,
    lineHeight: 22,
    fontWeight: "600",
  },
  pill: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.caption,
    lineHeight: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.tertiary,
    overflow: "hidden",
  },
  subtitle: {
    ...textBase,
    color: colors.textSecondary,
    fontSize: typeScale.meta,
    lineHeight: 18,
  },
});
