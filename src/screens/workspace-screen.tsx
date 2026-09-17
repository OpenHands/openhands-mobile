import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppState } from "../context/app-state";
import { colors, layout, textBase, typeScale } from "../theme";
import { MenuButton } from "../ui/menu-button";
import { AutomationDetailScreen } from "./AutomationDetailScreen";
import { AutomationsScreen } from "./AutomationsScreen";
import { ChatScreen } from "./ChatScreen";
import { CustomizeScreen } from "./CustomizeScreen";
import { McpScreen } from "./McpScreen";
import { PluginsScreen } from "./PluginsScreen";
import { SkillsScreen } from "./SkillsScreen";

export function WorkspaceScreen({
  onToggleNav,
  navOpen = false,
}: {
  onToggleNav?: () => void;
  navOpen?: boolean;
}) {
  const { route } = useAppState();

  if (route.name === "chat") {
    return (
      <ChatScreen
        key={route.conversation.id}
        conversation={route.conversation}
        onToggleNav={onToggleNav}
        navOpen={navOpen}
      />
    );
  }

  if (route.name === "customize") {
    if (route.section === "skills") {
      return <SkillsScreen onToggleNav={onToggleNav} navOpen={navOpen} />;
    }
    if (route.section === "mcp") {
      return <McpScreen onToggleNav={onToggleNav} navOpen={navOpen} />;
    }
    if (route.section === "plugins") {
      return <PluginsScreen onToggleNav={onToggleNav} navOpen={navOpen} />;
    }
    return <CustomizeScreen onToggleNav={onToggleNav} navOpen={navOpen} />;
  }

  if (route.name === "automations") {
    return <AutomationsScreen onToggleNav={onToggleNav} navOpen={navOpen} />;
  }

  if (route.name === "automation") {
    return (
      <AutomationDetailScreen
        key={route.id}
        id={route.id}
        onToggleNav={onToggleNav}
        navOpen={navOpen}
      />
    );
  }

  return <EmptyWorkspace navOpen={navOpen} onToggleNav={onToggleNav} />;
}

export function EmptyWorkspace({
  navOpen,
  onToggleNav,
}: {
  navOpen?: boolean;
  onToggleNav?: () => void;
}) {
  return (
    <SafeAreaView style={styles.emptySafe} edges={["top", "bottom"]}>
      <View style={styles.emptyHeader}>
        {onToggleNav ? (
          <MenuButton open={Boolean(navOpen)} onPress={onToggleNav} />
        ) : null}
        <View style={styles.emptyHeaderCopy} />
      </View>
      <View style={styles.emptyBody}>
        <Text style={styles.emptyTitle}>Start a conversation</Text>
        <Text style={styles.emptyCopy}>
          Open the menu to pick a thread, start a new chat, or open Customize and
          Automations.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptySafe: { flex: 1, backgroundColor: colors.bg },
  emptyHeader: {
    minHeight: layout.headerRowHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: layout.gutter,
    paddingRight: 12,
  },
  emptyHeaderCopy: { flex: 1 },
  emptyBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 8,
  },
  emptyTitle: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.brand,
    lineHeight: 28,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyCopy: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.title,
    lineHeight: 24,
    textAlign: "center",
  },
});
