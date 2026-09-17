import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, layout, radius, space, textBase, typeScale } from "../theme";
import { isPressHot, pressWebProps } from "./press-style";

export function Composer({
  value,
  onChangeText,
  onSubmit,
  disabled,
  placeholder = "What do you want to build?",
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const canSubmit = Boolean(value.trim()) && !disabled;
  return (
    <View style={styles.wrap}>
      <View style={styles.shell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          style={styles.input}
          multiline
          editable={!disabled}
          onSubmitEditing={() => {
            if (canSubmit) onSubmit();
          }}
          blurOnSubmit={false}
        />
        <View style={styles.actions}>
          <View style={styles.actionsLeft} />
          <Pressable
            {...pressWebProps("send")}
            onPress={onSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={(state) => [
              styles.send,
              !canSubmit && styles.sendDisabled,
              canSubmit && isPressHot(state) && styles.sendHot,
            ]}
          >
            <Text style={[styles.sendGlyph, !canSubmit && styles.sendGlyphOff]}>
              ↑
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: layout.gutter,
    paddingBottom: space.lg,
    paddingTop: space.md,
  },
  shell: {
    backgroundColor: colors.surface,
    borderRadius: radius.composer,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  input: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 24,
    minHeight: 24,
    maxHeight: 160,
    padding: 0,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsLeft: { flex: 1 },
  send: {
    width: layout.sendButton,
    height: layout.sendButton,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    borderColor: colors.muted,
  },
  sendHot: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  sendGlyph: {
    ...textBase,
    color: colors.accent,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "600",
  },
  sendGlyphOff: {
    color: colors.muted,
  },
});
