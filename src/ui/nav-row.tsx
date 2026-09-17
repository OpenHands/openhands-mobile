import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, layout, radius, space, textBase, typeScale } from "../theme";
import { IconSlot } from "./icons";
import { isPressHot, pressWebProps } from "./press-style";

export function NavRow({
  label,
  icon,
  onPress,
  disabled,
  trailing,
}: {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      {...pressWebProps()}
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityLabel={disabled ? `${label} (coming soon)` : label}
      style={(state) => [
        styles.row,
        !disabled && isPressHot(state) && styles.hot,
        disabled && styles.disabled,
      ]}
    >
      <IconSlot>{icon}</IconSlot>
      <Text
        style={[styles.label, disabled && styles.labelDisabled]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.navRowHeight,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  hot: {
    backgroundColor: colors.surfaceRaised,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    ...textBase,
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: typeScale.nav,
    lineHeight: 24,
  },
  labelDisabled: {
    color: colors.muted,
  },
});
