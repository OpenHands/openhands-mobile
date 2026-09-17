import React from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "../context/app-state";
import { colors, layout, radius, textBase, typeScale } from "../theme";
import { MenuButton } from "../ui/menu-button";
import { ChatScreen } from "./ChatScreen";
import { ConversationListScreen } from "./ConversationListScreen";

export function MobileShell() {
  const { route } = useAppState();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [navOpen, setNavOpen] = React.useState(route.name !== "chat");
  const drawerWidth = Math.max(width - layout.drawerPeek, width * 0.86);
  const progress = React.useRef(new Animated.Value(navOpen ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: navOpen ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [navOpen, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drawerWidth],
  });

  const toggleNav = () => setNavOpen((value) => !value);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.navLayer,
          {
            width: drawerWidth,
            pointerEvents: navOpen ? "auto" : "none",
          },
        ]}
      >
        <ConversationListScreen
          onOpenConversation={() => setNavOpen(false)}
        />
      </View>

      <Animated.View
        style={[
          styles.chatLayer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.chatInner}>
          {route.name === "chat" ? (
            <ChatScreen
              key={route.conversation.id}
              conversation={route.conversation}
              onToggleNav={toggleNav}
              navOpen={navOpen}
            />
          ) : (
            <EmptyChat navOpen={navOpen} onToggleNav={toggleNav} />
          )}
          {navOpen ? (
            <Pressable
              accessibilityLabel="Close menu"
              onPress={() => setNavOpen(false)}
              style={[
                styles.chatScrim,
                { top: insets.top + layout.headerRowHeight },
              ]}
            />
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

function EmptyChat({
  navOpen,
  onToggleNav,
}: {
  navOpen: boolean;
  onToggleNav: () => void;
}) {
  return (
    <SafeAreaView style={styles.emptySafe} edges={["top", "bottom"]}>
      <View style={styles.emptyHeader}>
        <MenuButton open={navOpen} onPress={onToggleNav} />
        <View style={styles.emptyHeaderCopy} />
      </View>
      <View style={styles.emptyBody}>
        <Text style={styles.emptyTitle}>Start a conversation</Text>
        <Text style={styles.emptyCopy}>
          Open the menu to pick a thread or start a new chat.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  navLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 0,
  },
  chatLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    borderRadius: radius.lg,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  chatInner: {
    flex: 1,
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
  },
  chatScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
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
