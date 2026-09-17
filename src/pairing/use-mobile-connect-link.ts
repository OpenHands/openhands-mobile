import React from "react";
import { Linking } from "react-native";
import type { StoredConnection } from "../storage/connection-store";
import { applyMobileConnectPayload } from "./apply-mobile-connect";
import {
  parseMobileConnectUrl,
  type MobileConnectPayload,
} from "./mobile-connect-payload";

export async function connectionFromConnectUrl(
  url: string | null,
): Promise<StoredConnection | null> {
  if (!url) {
    return null;
  }
  const payload = parseMobileConnectUrl(url);
  if (!payload) {
    return null;
  }
  return applyMobileConnectPayload(payload);
}

export function payloadFromConnectUrl(
  url: string | null,
): MobileConnectPayload | null {
  return url ? parseMobileConnectUrl(url) : null;
}

export function useMobileConnectLink(
  setConnection: (connection: StoredConnection) => void,
  onError?: (message: string) => void,
): void {
  const setConnectionRef = React.useRef(setConnection);
  const onErrorRef = React.useRef(onError);
  setConnectionRef.current = setConnection;
  onErrorRef.current = onError;

  React.useEffect(() => {
    const handleUrl = (url: string) => {
      if (!parseMobileConnectUrl(url)) {
        return;
      }
      void connectionFromConnectUrl(url)
        .then((connection) => {
          if (connection) {
            setConnectionRef.current(connection);
          }
        })
        .catch((caught: unknown) => {
          const message =
            caught instanceof Error
              ? caught.message
              : "Could not connect from that QR code.";
          onErrorRef.current?.(message);
        });
    };

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });
    return () => {
      subscription.remove();
    };
  }, []);
}
