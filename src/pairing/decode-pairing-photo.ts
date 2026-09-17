import { scanFromURLAsync } from "expo-camera";
import { applyMobileConnectPayload } from "./apply-mobile-connect";
import {
  parseMobileConnectUrl,
  type MobileConnectPayload,
} from "./mobile-connect-payload";
import type { StoredConnection } from "../storage/connection-store";

const SCAN_TIMEOUT_MS = 8_000;

function withTimeout<T>(
  work: Promise<T>,
  message: string,
  ms = SCAN_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (caught: unknown) => {
        clearTimeout(timer);
        reject(caught instanceof Error ? caught : new Error(String(caught)));
      },
    );
  });
}

export async function decodePairingPayloadFromPhoto(
  uri: string,
): Promise<MobileConnectPayload> {
  const results = await withTimeout(
    scanFromURLAsync(uri, ["qr"]),
    "Could not read a QR code from that photo. Try again closer to the screen.",
  );
  for (const result of results) {
    const payload = parseMobileConnectUrl(result.data);
    if (payload) {
      return payload;
    }
  }
  throw new Error("That photo is not an OpenHands pairing QR code.");
}

export async function connectFromPairingPhoto(
  uri: string,
): Promise<StoredConnection> {
  return applyMobileConnectPayload(await decodePairingPayloadFromPhoto(uri));
}
