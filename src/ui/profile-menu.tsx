import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, layout, radius, textBase, typeScale } from "../theme";
import { isPressHot, pressWebProps } from "./press-style";

export function ProfileMenu({
  name,
  host,
  onSwitch,
}: {
  name: string;
  host?: string;
  onSwitch: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const initial = (name.trim()[0] ?? "O").toUpperCase();

  const trigger = (
    <Pressable
      {...pressWebProps()}
      onPress={() => setOpen((value) => !value)}
      accessibilityRole="button"
      accessibilityLabel={`${name} menu`}
      accessibilityState={{ expanded: open }}
      style={(state) => [styles.trigger, isPressHot(state) && styles.hot]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {host ? (
          <Text style={styles.host} numberOfLines={1}>
            {host.replace(/^https?:\/\//, "")}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  const menu = (
    <View style={styles.menu}>
      <Pressable
        {...pressWebProps()}
        onPress={() => {
          setOpen(false);
          onSwitch();
        }}
        accessibilityRole="button"
        accessibilityLabel="Switch"
        style={(state) => [styles.item, isPressHot(state) && styles.hot]}
      >
        <Text style={styles.itemLabel}>Switch</Text>
      </Pressable>
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <View style={[styles.anchor, styles.fill]}>
        {open ? (
          <Pressable
            accessibilityLabel="Dismiss menu"
            onPress={() => setOpen(false)}
            style={styles.webDismiss}
          />
        ) : null}
        {open ? <View style={styles.webMenu}>{menu}</View> : null}
        {trigger}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {trigger}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>{menu}</View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minWidth: 0 },
  anchor: { position: "relative", zIndex: 20 },
  trigger: {
    minHeight: layout.tap,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hot: {
    backgroundColor: colors.surfaceRaised,
  },
  avatar: {
    width: layout.avatar,
    height: layout.avatar,
    borderRadius: 999,
    backgroundColor: colors.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.meta,
    fontWeight: "600",
  },
  meta: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.title,
    lineHeight: 22,
    fontWeight: "500",
  },
  host: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.caption,
    lineHeight: 16,
  },
  webDismiss: {
    // RN-web supports `fixed`; the RN StyleSheet type does not.
    position: "fixed" as unknown as "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  webMenu: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "100%",
    marginBottom: 6,
    zIndex: 2,
  },
  menu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    padding: 16,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 4,
  },
  item: {
    minHeight: layout.tap,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    justifyContent: "center",
  },
  itemLabel: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.title,
    lineHeight: 24,
  },
});
