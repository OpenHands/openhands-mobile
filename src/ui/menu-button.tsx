import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors, layout } from "../theme";
import { MenuIcon } from "./icons";
import { isPressHot, pressWebProps } from "./press-style";

export function MenuButton({
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
      accessibilityLabel={open ? "Close menu" : "Open menu"}
      accessibilityState={{ expanded: open }}
      style={(state) => [styles.button, isPressHot(state) && styles.hot]}
    >
      <MenuIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: layout.tap,
    height: layout.tap,
    marginLeft: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  hot: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
  },
});
