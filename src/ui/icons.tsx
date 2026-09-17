import React from "react";
import { StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";
import {
  AUTOMATIONS_ICON_SVG,
  CUSTOMIZE_CUBES_SVG,
  LUCIDE_MENU_SVG,
  LUCIDE_PLUS_SVG,
  LUCIDE_SETTINGS_SVG,
  OPENHANDS_LOGO_SVG,
} from "../assets/brand-svgs";
import { colors, layout } from "../theme";

const ICON_SIZE = layout.iconSlot;
const LOGO_WIDTH = 36;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 30) / 46);

function tint(xml: string, color: string): string {
  return xml.replaceAll("currentColor", color);
}

function CanvasIcon({
  xml,
  color = colors.muted,
  size = ICON_SIZE,
}: {
  xml: string;
  color?: string;
  size?: number;
}) {
  return <SvgXml xml={tint(xml, color)} width={size} height={size} />;
}

export function IconSlot({ children }: { children: React.ReactNode }) {
  return <View style={styles.slot}>{children}</View>;
}

export function PlusIcon({ color }: { color?: string }) {
  return <CanvasIcon xml={LUCIDE_PLUS_SVG} color={color} />;
}

export function CubesIcon({ color }: { color?: string }) {
  return <CanvasIcon xml={CUSTOMIZE_CUBES_SVG} color={color} />;
}

export function AutomationsIcon({ color }: { color?: string }) {
  return <CanvasIcon xml={AUTOMATIONS_ICON_SVG} color={color} />;
}

export function SettingsIcon({ color }: { color?: string }) {
  return <CanvasIcon xml={LUCIDE_SETTINGS_SVG} color={color} />;
}

export function MenuIcon({ color = colors.text }: { color?: string }) {
  return <CanvasIcon xml={LUCIDE_MENU_SVG} color={color} size={20} />;
}

export function LogoMark() {
  return (
    <SvgXml xml={OPENHANDS_LOGO_SVG} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
  );
}

const styles = StyleSheet.create({
  slot: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
