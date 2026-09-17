import React from "react";
import { StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";
import {
  AUTOMATIONS_ICON_SVG,
  BLOCK_DRAWER_SVG,
  BROWSER_TAB_SVG,
  COMMITS_TAB_SVG,
  CUSTOMIZE_CUBES_SVG,
  FILES_TAB_SVG,
  LUCIDE_MENU_SVG,
  LUCIDE_PLUS_SVG,
  LUCIDE_SETTINGS_SVG,
  OPENHANDS_LOGO_SVG,
  PLANNER_TAB_SVG,
  TERMINAL_TAB_SVG,
  USAGE_TAB_SVG,
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

export function DrawerIcon({ color = colors.text }: { color?: string }) {
  return (
    <View style={styles.flip}>
      <CanvasIcon xml={BLOCK_DRAWER_SVG} color={color} size={20} />
    </View>
  );
}

export function FilesTabIcon({ color }: { color?: string }) {
  return <CanvasIcon xml={FILES_TAB_SVG} color={color} size={16} />;
}

export function CommitsTabIcon({ color }: { color?: string }) {
  return <CanvasIcon xml={COMMITS_TAB_SVG} color={color} size={16} />;
}

export function PlannerTabIcon({ color }: { color?: string }) {
  return <CanvasIcon xml={PLANNER_TAB_SVG} color={color} size={16} />;
}

export function TerminalTabIcon({ color }: { color?: string }) {
  return <CanvasIcon xml={TERMINAL_TAB_SVG} color={color} size={16} />;
}

export function BrowserTabIcon({ color }: { color?: string }) {
  return <CanvasIcon xml={BROWSER_TAB_SVG} color={color} size={16} />;
}

export function UsageTabIcon({ color }: { color?: string }) {
  return <CanvasIcon xml={USAGE_TAB_SVG} color={color} size={16} />;
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
  flip: { transform: [{ scaleX: -1 }] },
});
