import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, layout, textBase, typeScale } from "../theme";
import { ChevronLeftIcon } from "./icons";
import { MenuButton } from "./menu-button";
import { isPressHot, pressWebProps } from "./press-style";

export function PageHeader({
  title,
  onToggleNav,
  navOpen = false,
  onBack,
  trailing,
}: {
  title: string;
  onToggleNav?: () => void;
  navOpen?: boolean;
  onBack?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onToggleNav ? <MenuButton open={navOpen} onPress={onToggleNav} /> : null}
      {onBack ? (
        <Pressable
          {...pressWebProps()}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={(state) => [styles.back, isPressHot(state) && styles.hot]}
        >
          <ChevronLeftIcon />
        </Pressable>
      ) : null}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: layout.headerRowHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: layout.gutter,
    paddingRight: 12,
    gap: 4,
  },
  back: {
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
  title: {
    ...textBase,
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: typeScale.title,
    lineHeight: 24,
    fontWeight: "600",
  },
});
