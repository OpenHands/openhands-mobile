import { Platform } from "react-native";

export type PressHotKind = "surface" | "send" | "accent";

/** RN-web Pressable reports `hovered`; native only has `pressed`. */
export function isPressHot(state: { pressed: boolean; hovered?: boolean }): boolean {
  return Boolean(state.pressed || state.hovered);
}

/** Web CSS `:hover` backup — RN-web hover only fires on real pointer hover. */
export function pressWebProps(kind: PressHotKind = "surface") {
  return Platform.OS === "web" ? { dataSet: { ohPress: kind } } : {};
}
