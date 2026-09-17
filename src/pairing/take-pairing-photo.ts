import * as ImagePicker from "expo-image-picker";
import { connectFromPairingPhoto } from "./decode-pairing-photo";
import type { StoredConnection } from "../storage/connection-store";

async function ensureCameraPermission(): Promise<void> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) {
    return;
  }
  const requested = await ImagePicker.requestCameraPermissionsAsync();
  if (!requested.granted) {
    throw new Error("Camera access is needed to photograph the pairing QR code.");
  }
}

async function connectFromPickerResult(
  result: ImagePicker.ImagePickerResult,
): Promise<StoredConnection> {
  if (result.canceled) {
    throw new Error("PHOTO_CANCELED");
  }
  const uri = result.assets[0]?.uri;
  if (!uri) {
    throw new Error("Could not read that photo.");
  }
  return connectFromPairingPhoto(uri);
}

export async function takePairingQrPhoto(): Promise<StoredConnection> {
  await ensureCameraPermission();
  return connectFromPickerResult(
    await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    }),
  );
}

export async function choosePairingQrPhoto(): Promise<StoredConnection> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library access is needed to pick a pairing QR code.");
  }
  return connectFromPickerResult(
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    }),
  );
}

export function isPhotoCanceled(caught: unknown): boolean {
  return caught instanceof Error && caught.message === "PHOTO_CANCELED";
}
