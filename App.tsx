import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStateProvider, useAppState } from "./src/context/app-state";
import { ChatScreen } from "./src/screens/ChatScreen";
import { ConnectScreen } from "./src/screens/ConnectScreen";
import { ConversationListScreen } from "./src/screens/ConversationListScreen";
import { MobileShell } from "./src/screens/mobile-shell";
import { applyWebTheme, colors, layout, TABLET_MIN_WIDTH } from "./src/theme";

function Shell() {
  const { route } = useAppState();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;

  if (route.name === "boot") {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (route.name === "connect") {
    return <ConnectScreen />;
  }

  if (isTablet) {
    return (
      <View style={styles.split}>
        <View style={styles.paneList}>
          <ConversationListScreen />
        </View>
        <View style={styles.paneChat}>
          {route.name === "chat" ? (
            <ChatScreen
              key={route.conversation.id}
              conversation={route.conversation}
            />
          ) : (
            <View style={styles.boot} />
          )}
        </View>
      </View>
    );
  }

  return <MobileShell />;
}

export default function App() {
  React.useEffect(() => {
    applyWebTheme();
  }, []);

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="light" />
        <Shell />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  split: { flex: 1, flexDirection: "row", backgroundColor: colors.bg },
  paneList: {
    width: layout.sidebarWidth,
    maxWidth: "42%",
    borderRightColor: colors.border,
    borderRightWidth: 1,
    backgroundColor: colors.bg,
  },
  paneChat: { flex: 1 },
});
