import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors, layout } from "../theme";
import { DrawerIcon } from "./icons";
import { isPressHot, pressWebProps } from "./press-style";

export function DrawerButton({
  open,
  onPress,
}: {
  open: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      {...pressWebProps()}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={open ? "Hide panel" : "Show panel"}
      accessibilityState={{ expanded: open }}
      style={(state) => [styles.button, isPressHot(state) && styles.hot]}
    >
      <DrawerIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: layout.tap,
    height: layout.tap,
    marginRight: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  hot: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
  },
});
