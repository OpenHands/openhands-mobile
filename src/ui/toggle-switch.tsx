import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "../theme";

export function ToggleSwitch({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, value && styles.trackOn, disabled && styles.disabled]}
    >
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.tertiary,
    padding: 3,
    justifyContent: "center",
  },
  trackOn: {
    backgroundColor: colors.text,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.muted,
  },
  thumbOn: {
    alignSelf: "flex-end",
    backgroundColor: colors.accentForeground,
  },
  disabled: {
    opacity: 0.45,
  },
});
