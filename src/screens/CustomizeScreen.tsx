import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppState } from "../context/app-state";
import { colors, layout, space, textBase, typeScale } from "../theme";
import {
  ChevronRightIcon,
  McpIcon,
  PluginsIcon,
  SkillsIcon,
} from "../ui/icons";
import { NavRow } from "../ui/nav-row";
import { ScreenBody, screenScrollProps, screenStyles } from "./screen-body";

export function CustomizeScreen({
  onToggleNav,
  navOpen,
}: {
  onToggleNav?: () => void;
  navOpen?: boolean;
}) {
  const { openCustomize } = useAppState();

  return (
    <ScreenBody title="Customize" onToggleNav={onToggleNav} navOpen={navOpen}>
      <ScrollView {...screenScrollProps} contentContainerStyle={screenStyles.content}>
        <Text style={styles.lede}>
          Skills, MCP servers, and plugins from the laptop. Changes sync to the
          same OpenHands backend.
        </Text>
        <View style={styles.list}>
          <NavRow
            label="MCP Servers"
            icon={<McpIcon />}
            trailing={<ChevronRightIcon />}
            onPress={() => openCustomize("mcp")}
          />
          <NavRow
            label="Skills"
            icon={<SkillsIcon />}
            trailing={<ChevronRightIcon />}
            onPress={() => openCustomize("skills")}
          />
          <NavRow
            label="Plugins"
            icon={<PluginsIcon />}
            trailing={<ChevronRightIcon />}
            onPress={() => openCustomize("plugins")}
          />
        </View>
      </ScrollView>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  lede: {
    ...textBase,
    color: colors.textSecondary,
    fontSize: typeScale.meta,
    lineHeight: 20,
    paddingTop: space.sm,
  },
  list: {
    marginHorizontal: -layout.navInset,
    gap: 2,
  },
});
