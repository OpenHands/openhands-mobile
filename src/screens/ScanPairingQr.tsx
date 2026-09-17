import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { connectFromPairingPhoto } from "../pairing/decode-pairing-photo";
import { applyMobileConnectPayload } from "../pairing/apply-mobile-connect";
import {
  choosePairingQrPhoto,
  isPhotoCanceled,
} from "../pairing/take-pairing-photo";
import { parseMobileConnectUrl } from "../pairing/mobile-connect-payload";
import type { StoredConnection } from "../storage/connection-store";
import { colors, radius, space, textBase } from "../theme";
import { isPressHot, pressWebProps } from "../ui/press-style";

interface ScanPairingQrProps {
  onConnected: (connection: StoredConnection) => void;
  onCancel: () => void;
}

export function ScanPairingQr({ onConnected, onCancel }: ScanPairingQrProps) {
  const cameraRef = React.useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [cameraOn, setCameraOn] = React.useState(true);
  const handledRef = React.useRef(false);

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const finishWithError = (caught: unknown, fallback: string) => {
    handledRef.current = false;
    setBusy(false);
    setStatus(null);
    setCameraOn(true);
    if (isPhotoCanceled(caught)) {
      return;
    }
    setError(caught instanceof Error ? caught.message : fallback);
  };

  const connectFromPayloadUrl = (data: string) => {
    if (handledRef.current || busy) {
      return;
    }
    const payload = parseMobileConnectUrl(data);
    if (!payload) {
      return;
    }
    handledRef.current = true;
    setBusy(true);
    setError(null);
    setCameraOn(false);
    setStatus(`Connecting to ${payload.host}…`);
    void applyMobileConnectPayload(payload)
      .then(onConnected)
      .catch((caught: unknown) => {
        finishWithError(caught, "Could not connect from that QR code.");
      });
  };

  const connectFromUri = (work: () => Promise<StoredConnection>) => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Reading QR code…");
    void work()
      .then(onConnected)
      .catch((caught: unknown) => {
        finishWithError(
          caught,
          "Could not read a pairing QR code from that photo.",
        );
      });
  };

  const onTakePhoto = () => {
    connectFromUri(async () => {
      setCameraOn(true);
      const picture = await cameraRef.current?.takePictureAsync({
        quality: 1,
        shutterSound: false,
      });
      if (!picture?.uri) {
        throw new Error("Could not take that photo.");
      }
      setCameraOn(false);
      setStatus("Reading QR code…");
      return connectFromPairingPhoto(picture.uri);
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Photograph the pairing QR</Text>
        <Text style={styles.copy}>
          Point the camera at the QR code in Agent Canvas Settings → Mobile,
          then take a photo. Live detection will also try to connect.
        </Text>
      </View>

      <View style={styles.preview}>
        {!permission ? (
          <ActivityIndicator color={colors.accent} />
        ) : !permission.granted ? (
          <View style={styles.permission}>
            <Text style={styles.copy}>
              Camera access is needed to photograph the pairing code.
            </Text>
            <Pressable
              {...pressWebProps("accent")}
              onPress={() => void requestPermission()}
              style={(state) => [
                styles.button,
                isPressHot(state) && styles.buttonHot,
              ]}
            >
              <Text style={styles.buttonText}>Allow camera</Text>
            </Pressable>
          </View>
        ) : cameraOn ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={
              busy ? undefined : ({ data }) => connectFromPayloadUrl(data)
            }
          />
        ) : (
          <View style={styles.permission}>
            <ActivityIndicator color={colors.accent} />
            {status ? <Text style={styles.copy}>{status}</Text> : null}
          </View>
        )}
      </View>

      {status && cameraOn ? <Text style={styles.copy}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        {...pressWebProps("accent")}
        onPress={onTakePhoto}
        disabled={!permission?.granted || busy}
        style={(state) => [
          styles.button,
          isPressHot(state) && styles.buttonHot,
          (!permission?.granted || busy) && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonText}>Take photo</Text>
      </Pressable>

      <Pressable
        {...pressWebProps("surface")}
        onPress={() => connectFromUri(choosePairingQrPhoto)}
        disabled={busy}
        style={(state) => [
          styles.cancel,
          isPressHot(state) && styles.buttonHot,
          busy && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.cancelText}>Choose photo</Text>
      </Pressable>

      <Pressable
        {...pressWebProps("surface")}
        onPress={onCancel}
        style={(state) => [
          styles.cancel,
          isPressHot(state) && styles.buttonHot,
        ]}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: space.lg, gap: space.md },
  header: { gap: space.xs },
  title: {
    ...textBase,
    color: colors.text,
    fontSize: 24,
    fontWeight: "600",
  },
  copy: {
    ...textBase,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  preview: {
    flex: 1,
    minHeight: 280,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  permission: {
    padding: space.lg,
    gap: space.md,
    alignItems: "center",
  },
  error: { ...textBase, color: colors.danger, fontSize: 14 },
  button: {
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
  cancel: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    ...textBase,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
