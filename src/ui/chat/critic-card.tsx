import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CriticResult } from "../../api/types";
import { colors, textBase } from "../../theme";
import { isPressHot, pressWebProps } from "../press-style";

function clamp(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(1, Math.max(0, score));
}

function stars(score: number): string {
  const filled = Math.round(score * 5);
  return `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;
}

function scoreColor(score: number): string {
  if (score >= 0.6) return colors.statusSuccess;
  if (score >= 0.4) return colors.timeout;
  return colors.statusError;
}

export function CriticCard({ result }: { result: CriticResult }) {
  const [open, setOpen] = React.useState(false);
  const score = clamp(result.score ?? 0);
  const categorized = result.metadata?.categorized_features;
  const groups = [
    { label: "Potential issues", items: categorized?.agent_behavioral_issues },
    { label: "Infrastructure", items: categorized?.infrastructure_issues },
    { label: "Likely follow-up", items: categorized?.user_followup_patterns },
    { label: "Other", items: categorized?.other },
  ].filter((group) => (group.items?.length ?? 0) > 0);

  return (
    <View style={styles.wrap}>
      <Pressable
        {...pressWebProps()}
        onPress={() => groups.length > 0 && setOpen((value) => !value)}
        disabled={groups.length === 0}
        accessibilityRole="button"
        accessibilityLabel="Success likelihood"
        style={(state) => [styles.row, isPressHot(state) && styles.hot]}
      >
        <Text style={styles.label}>Success likelihood</Text>
        <Text style={[styles.stars, { color: scoreColor(score) }]}>
          {stars(score)}
        </Text>
        <Text style={styles.pct}>({((score * 100).toFixed(1))}%)</Text>
        {groups.length > 0 ? (
          <Text style={styles.chevron}>{open ? "▾" : "▸"}</Text>
        ) : null}
      </Pressable>
      {open
        ? groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <Text style={styles.groupItems}>
                {(group.items ?? [])
                  .map(
                    (item) =>
                      `${item.display_name ?? item.name ?? "Issue"} (${Math.round((item.probability ?? 0) * 100)}%)`,
                  )
                  .join(" · ")}
              </Text>
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderLeftColor: colors.border,
    borderLeftWidth: 2,
    paddingLeft: 8,
    marginVertical: 8,
    paddingVertical: 6,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 6,
    paddingVertical: 2,
  },
  hot: { backgroundColor: colors.surfaceRaised },
  label: {
    ...textBase,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  stars: { ...textBase, fontSize: 12, letterSpacing: 1 },
  pct: { ...textBase, color: colors.textDim, fontSize: 12 },
  chevron: { ...textBase, color: colors.muted, fontSize: 12 },
  group: { gap: 2 },
  groupLabel: {
    ...textBase,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  groupItems: { ...textBase, color: colors.text, fontSize: 12, lineHeight: 18 },
});
