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
import {
  isPhotoCanceled,
  takePairingQrPhoto,
} from "../pairing/take-pairing-photo";
import { ScanPairingQr } from "./ScanPairingQr";

export function ConnectScreen() {
  const { setConnection, pairingError } = useAppState();
  const [name, setName] = React.useState("Laptop");
  const [host, setHost] = React.useState("http://");
  const [apiKey, setApiKey] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);

  const onTakePhoto = async () => {
    setError(null);
    setBusy(true);
    try {
      setConnection(await takePairingQrPhoto());
    } catch (caught) {
      if (!isPhotoCanceled(caught)) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not read a pairing QR code from that photo.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

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

  if (scanning && Platform.OS !== "web") {
    return (
      <ScanPairingQr
        onConnected={(connection) => {
          setScanning(false);
          setConnection(connection);
        }}
        onCancel={() => setScanning(false)}
      />
    );
  }

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
            Photograph the pairing QR from Agent Canvas Settings → Mobile.
            You can still type a host and session API key if you prefer.
          </Text>

          {Platform.OS !== "web" ? (
            <>
              <Pressable
                {...pressWebProps("accent")}
                onPress={() => void onTakePhoto()}
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
                  <Text style={styles.buttonText}>Take photo of QR</Text>
                )}
              </Pressable>
              <Pressable
                {...pressWebProps("surface")}
                onPress={() => {
                  setError(null);
                  setScanning(true);
                }}
                disabled={busy}
                style={(state) => [
                  styles.secondary,
                  !busy && isPressHot(state) && styles.buttonHot,
                  busy && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.secondaryText}>Open camera scanner</Text>
              </Pressable>
            </>
          ) : null}

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

          {pairingError || error ? (
            <Text style={styles.error}>{pairingError ?? error}</Text>
          ) : null}

          <Pressable
            {...pressWebProps(Platform.OS === "web" ? "accent" : "surface")}
            onPress={() => void onConnect()}
            disabled={busy}
            style={(state) => [
              Platform.OS === "web" ? styles.button : styles.secondary,
              !busy && isPressHot(state) && styles.buttonHot,
              busy && styles.buttonDisabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator
                color={
                  Platform.OS === "web" ? colors.accentForeground : colors.text
                }
              />
            ) : (
              <Text
                style={
                  Platform.OS === "web" ? styles.buttonText : styles.secondaryText
                }
              >
                Connect
              </Text>
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
    marginTop: space.xs,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    marginTop: space.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
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
  secondaryText: {
    ...textBase,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
