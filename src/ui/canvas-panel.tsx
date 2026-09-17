import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, textBase, typeScale } from "../theme";
import {
  CANVAS_TABS,
  type CanvasTab,
} from "./canvas-tabs";
import {
  BrowserTabIcon,
  CommitsTabIcon,
  FilesTabIcon,
  PlannerTabIcon,
  TerminalTabIcon,
  UsageTabIcon,
} from "./icons";
import { isPressHot, pressWebProps } from "./press-style";
import { webScrollbarProps } from "./web-scrollbar";

const TAB_META: Record<
  CanvasTab,
  {
    label: string;
    empty: string;
    Icon: (props: { color?: string }) => React.ReactElement;
  }
> = {
  files: {
    label: "Files",
    empty: "No files in workspace",
    Icon: FilesTabIcon,
  },
  commits: {
    label: "Commits",
    empty: "OpenHands hasn't made any changes yet",
    Icon: CommitsTabIcon,
  },
  planner: {
    label: "Planner",
    empty: "No plan yet",
    Icon: PlannerTabIcon,
  },
  terminal: {
    label: "Terminal",
    empty:
      "No terminal output yet. Commands run by the agent will appear here.",
    Icon: TerminalTabIcon,
  },
  browser: {
    label: "Browser",
    empty:
      'No page loaded yet. Ask OpenHands to open a URL. Example: "Open https://example.com"',
    Icon: BrowserTabIcon,
  },
  usage: {
    label: "Usage",
    empty: "Usage appears here once the agent starts working.",
    Icon: UsageTabIcon,
  },
};

export function CanvasPanel({
  tab,
  onChangeTab,
}: {
  tab: CanvasTab;
  onChangeTab: (tab: CanvasTab) => void;
}) {
  const active = TAB_META[tab];

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <ScrollView
        horizontal
        {...webScrollbarProps}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarInner}
        showsHorizontalScrollIndicator={false}
      >
        {CANVAS_TABS.map((id) => {
          const meta = TAB_META[id];
          const selected = id === tab;
          const color = selected ? colors.text : colors.muted;
          return (
            <Pressable
              key={id}
              {...pressWebProps()}
              onPress={() => onChangeTab(id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={meta.label}
              style={(state) => [
                styles.tab,
                selected && styles.tabActive,
                isPressHot(state) && !selected && styles.tabHot,
              ]}
            >
              <meta.Icon color={color} />
              {selected ? (
                <Text style={styles.tabLabel}>{meta.label}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.body}>
        <Text style={styles.empty}>{active.empty}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.surface,
    zIndex: 4,
  },
  tabBar: {
    flexGrow: 0,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  tabBarInner: {
    minHeight: 40,
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 6,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: radius.sm,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.tertiary,
  },
  tabHot: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  tabLabel: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.meta,
    lineHeight: 20,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  empty: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.title,
    lineHeight: 24,
    textAlign: "center",
  },
});
