import React from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "../context/app-state";
import { colors, layout, radius } from "../theme";
import { ConversationListScreen } from "./ConversationListScreen";
import { WorkspaceScreen } from "./workspace-screen";

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
          <WorkspaceScreen onToggleNav={toggleNav} navOpen={navOpen} />
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
});
