import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { TaskItem } from "../../api/types";
import { colors, space, textBase, typeScale } from "../../theme";

export function TaskListCard({
  title,
  tasks,
}: {
  title: string;
  tasks: TaskItem[];
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{title}</Text>
      {tasks.map((task, index) => {
        const done = task.status === "done";
        const mark =
          task.status === "done" ? "◉" : task.status === "in_progress" ? "◐" : "○";
        return (
          <View key={`${task.title}-${index}`} style={styles.row}>
            <Text style={[styles.mark, done && styles.done]}>{mark}</Text>
            <View style={styles.copy}>
              <Text style={[styles.title, done && styles.done]}>{task.title}</Text>
              {task.notes ? <Text style={styles.notes}>Notes: {task.notes}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", marginVertical: space.sm, gap: 2 },
  heading: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.meta,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  mark: { ...textBase, color: colors.accent, fontSize: 14, width: 16 },
  copy: { flex: 1, minWidth: 0 },
  title: {
    ...textBase,
    color: colors.accent,
    fontSize: typeScale.caption,
    lineHeight: 20,
  },
  notes: {
    ...textBase,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 14,
  },
  done: { color: colors.muted },
});
