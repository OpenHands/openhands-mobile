import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, textBase, typeScale } from "../theme";
import { isPressHot, pressWebProps } from "./press-style";

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            {...pressWebProps()}
            onPress={() => onChange(option.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={(state) => [
              styles.tab,
              selected && styles.tabActive,
              isPressHot(state) && !selected && styles.tabHot,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
  },
  tabActive: {
    backgroundColor: colors.tertiary,
  },
  tabHot: {
    backgroundColor: colors.surfaceRaised,
  },
  label: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.meta,
    lineHeight: 18,
    fontWeight: "600",
  },
  labelActive: {
    color: colors.text,
  },
});
