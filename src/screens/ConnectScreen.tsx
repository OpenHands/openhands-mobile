import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AgentServerError, assertCompatibleServer } from "../api/agent-server";
import { useAppState } from "../context/app-state";
import { saveConnection } from "../storage/connection-store";
import { colors, radius, space, textBase } from "../theme";
import { isPressHot, pressWebProps } from "../ui/press-style";

export function ConnectScreen() {
  const { setConnection } = useAppState();
  const [name, setName] = React.useState("Laptop");
  const [host, setHost] = React.useState("http://");
  const [apiKey, setApiKey] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const onConnect = async () => {
    setError(null);
    if (!host.replace(/^https?:\/\//i, "").trim()) {
      setError("Enter the agent-server host, for example http://192.168.1.10:8000");
      return;
    }
    if (!apiKey.trim()) {
      setError("Enter the session API key from your OpenHands laptop.");
      return;
    }

    setBusy(true);
    try {
      await assertCompatibleServer(host, apiKey.trim());
      const connection = await saveConnection({ name, host, apiKey });
      setConnection(connection);
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not reach that agent server.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.kicker}>OpenHands Mobile</Text>
          <Text style={styles.title}>Connect to a running agent server</Text>
          <Text style={styles.copy}>
            This talks to the OpenHands already running on your laptop or a
            remote host. Same Wi-Fi, Tailscale, or a tunnel all work. Use the
            host and session API key from that machine — not an LLM provider
            key.
          </Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Laptop"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Host</Text>
          <TextInput
            value={host}
            onChangeText={setHost}
            placeholder="http://192.168.1.10:8000"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>Session API key</Text>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="From ~/.openhands/agent-canvas/session-api-key.txt"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            {...pressWebProps("accent")}
            onPress={() => void onConnect()}
            disabled={busy}
            style={(state) => [
              styles.button,
              !busy && isPressHot(state) && styles.buttonHot,
              busy && styles.buttonDisabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.accentForeground} />
            ) : (
              <Text style={styles.buttonText}>Connect</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  body: { flex: 1, padding: space.lg, gap: space.sm },
  kicker: { ...textBase, color: colors.accent, fontSize: 13, fontWeight: "600" },
  title: {
    ...textBase,
    color: colors.text,
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 34,
  },
  copy: {
    ...textBase,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: space.sm,
  },
  label: { ...textBase, color: colors.muted, fontSize: 13, marginTop: space.xs },
  input: {
    ...textBase,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { ...textBase, color: colors.danger, fontSize: 14, marginTop: space.xs },
  button: {
    marginTop: space.md,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonHot: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    ...textBase,
    color: colors.accentForeground,
    fontSize: 16,
    fontWeight: "600",
  },
});
