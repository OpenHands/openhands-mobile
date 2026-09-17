import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, textBase } from "../theme";

type Visual = "check" | "working" | "active" | "paused" | "error" | "unknown";

function visualFor(status: string | null | undefined): Visual {
  switch (status?.toLowerCase()) {
    case "finished":
      return "check";
    case "running":
      return "working";
    case "idle":
    case "waiting_for_confirmation":
      return "active";
    case "paused":
      return "paused";
    case "error":
    case "stuck":
      return "error";
    default:
      return "unknown";
  }
}

export function StatusDot({
  status,
}: {
  status: string | null | undefined;
}) {
  const visual = visualFor(status);
  if (visual === "check") {
    return (
      <View style={styles.slot} accessibilityLabel="Finished">
        <Text style={styles.check}>✓</Text>
      </View>
    );
  }
  return (
    <View style={styles.slot} accessibilityLabel={status ?? "Stopped"}>
      <View
        style={[
          styles.dot,
          visual === "working" && styles.working,
          visual === "active" && styles.active,
          visual === "paused" && styles.paused,
          visual === "error" && styles.error,
          visual === "unknown" && styles.unknown,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 18,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  check: {
    ...textBase,
    color: colors.statusSuccess,
    fontSize: 11,
    lineHeight: 12,
    fontWeight: "700",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  working: { backgroundColor: colors.statusSuccess },
  active: { backgroundColor: colors.statusSuccess },
  paused: { backgroundColor: colors.muted },
  error: { backgroundColor: colors.statusError },
  unknown: { backgroundColor: colors.tertiary },
});
