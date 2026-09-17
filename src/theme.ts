import { Platform, type TextStyle } from "react-native";

/**
 * OpenHands-Neo tokens, ported from Agent Canvas
 * (`src/themes/color-themes.ts` + `src/tailwind.css`).
 *
 * Neo = Neutral cool-grey scale + white primary/accent.
 * Do not wrap Canvas components — copy the tokens, not the tree.
 */
export const COLOR_THEME = "openhands-neo" as const;

export const colors = {
  bg: "#181818",
  surface: "#202020",
  surfaceRaised: "#282828",
  surfaceDeep: "#101010",
  tertiary: "#313131",
  border: "#404040",
  borderSubtle: "#313131",
  text: "#ECECEC",
  textSecondary: "#BEBEBE",
  textTertiary: "#DCDCDC",
  muted: "#979797",
  textDim: "#737373",
  accent: "#ffffff",
  accentForeground: "#181818",
  danger: "#e76a5e",
  statusError: "#FF684E",
  success: "#a5e75e",
  statusSuccess: "#1FBD53",
  timeout: "#eab308",
  alertNote: "#60a5fa",
  alertTip: "#34d399",
  alertImportant: "#c084fc",
  alertWarning: "#facc15",
  alertCaution: "#fb7185",
};

export const monoFont = Platform.select<string>({
  web: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  ios: "Menlo",
  default: "monospace",
});

/**
 * Spacing follows Apple HIG / Material comfort:
 * 8pt grid, 20pt page gutters, 44pt minimum hit targets.
 */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  composer: 20,
  full: 999,
};

export const typeScale = {
  brand: 22,
  title: 17,
  body: 17,
  bodyLine: 26,
  nav: 17,
  meta: 13,
  caption: 12,
};

export const layout = {
  sidebarWidth: 300,
  drawerPeek: 56,
  gutter: 20,
  navInset: 8,
  tap: 44,
  navRowHeight: 48,
  conversationRowHeight: 52,
  headerRowHeight: 56,
  sendButton: 36,
  iconSlot: 22,
  avatar: 36,
};

export const TABLET_MIN_WIDTH = 768;

export const type = {
  // RN-web quotes `fontFamily` as a single face. Put the fallback stack in CSS.
  fontFamily: Platform.select<string>({
    web: "Inter",
    ios: "System",
    default: "sans-serif",
  }),
  letterSpacing: 0,
} as const;

export const textBase: TextStyle =
  Platform.OS === "web"
    ? { letterSpacing: type.letterSpacing }
    : {
        fontFamily: type.fontFamily,
        letterSpacing: type.letterSpacing,
      };

export function applyWebTheme(): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const id = "oh-neo-theme";
  if (!document.getElementById("oh-neo-fonts")) {
    const link = document.createElement("link");
    link.id = "oh-neo-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
  let style = document.getElementById(id) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = id;
    document.head.appendChild(style);
  }
  style.textContent = `
    html, body, #root {
      background: ${colors.bg};
      color: ${colors.text};
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    html, body, #root, #root * {
      letter-spacing: 0 !important;
    }
    input, textarea, button, [contenteditable] {
      font-family: inherit;
    }
    [role="button"]:not([aria-disabled="true"]) {
      cursor: pointer;
    }
    [role="button"][aria-disabled="true"] {
      cursor: default;
    }
    [data-oh-press="surface"]:not([aria-disabled="true"]):hover {
      background-color: ${colors.surfaceRaised};
    }
    [data-oh-press="send"]:not([aria-disabled="true"]):hover {
      background-color: rgba(255, 255, 255, 0.10);
    }
    [data-oh-press="accent"]:not([aria-disabled="true"]):hover {
      opacity: 0.85;
    }
    [data-oh-md-table] {
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      margin: 16px 0;
    }
    [data-oh-md-table] table {
      width: max-content;
      min-width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
      border-radius: 12px;
      border: 1px solid ${colors.border};
      color: ${colors.text};
      font-size: 14px;
      line-height: 20px;
    }
    [data-oh-md-table] th,
    [data-oh-md-table] td {
      white-space: nowrap;
      padding: 8px 12px;
      text-align: left;
      vertical-align: top;
      border-bottom: 1px solid ${colors.border};
      border-right: 1px solid ${colors.border};
    }
    [data-oh-md-table] th {
      background: ${colors.surface};
      color: #ffffff;
      font-weight: 600;
    }
    [data-oh-md-table] td {
      color: ${colors.text};
    }
    [data-oh-md-table] th:last-child,
    [data-oh-md-table] td:last-child {
      border-right: 0;
    }
    [data-oh-md-table] tbody tr:last-child td {
      border-bottom: 0;
    }
    [data-oh-md-table] th *,
    [data-oh-md-table] td * {
      color: inherit;
      font-weight: inherit;
      white-space: nowrap;
    }
    [data-oh-md-table] a {
      color: ${colors.alertNote};
    }
    [data-oh-scrollbar="1"],
    [data-oh-scrollbar="1"] *,
    [data-oh-sidebar="1"] *,
    [data-oh-chat="1"] *,
    .oh-custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, ${colors.muted} 30%, transparent) transparent;
    }
    [data-oh-scrollbar="1"],
    .oh-custom-scrollbar {
      scrollbar-gutter: stable;
    }
    [data-oh-scrollbar="1"]::-webkit-scrollbar,
    [data-oh-scrollbar="1"] *::-webkit-scrollbar,
    [data-oh-sidebar="1"] *::-webkit-scrollbar,
    [data-oh-chat="1"] *::-webkit-scrollbar,
    .oh-custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    [data-oh-scrollbar="1"]::-webkit-scrollbar-track,
    [data-oh-scrollbar="1"] *::-webkit-scrollbar-track,
    [data-oh-sidebar="1"] *::-webkit-scrollbar-track,
    [data-oh-chat="1"] *::-webkit-scrollbar-track,
    .oh-custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    [data-oh-scrollbar="1"]::-webkit-scrollbar-thumb,
    [data-oh-scrollbar="1"] *::-webkit-scrollbar-thumb,
    [data-oh-sidebar="1"] *::-webkit-scrollbar-thumb,
    [data-oh-chat="1"] *::-webkit-scrollbar-thumb,
    .oh-custom-scrollbar::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, ${colors.muted} 30%, transparent);
      border-radius: 3px;
    }
    [data-oh-scrollbar="1"]::-webkit-scrollbar-thumb:hover,
    [data-oh-scrollbar="1"] *::-webkit-scrollbar-thumb:hover,
    [data-oh-sidebar="1"] *::-webkit-scrollbar-thumb:hover,
    [data-oh-chat="1"] *::-webkit-scrollbar-thumb:hover,
    .oh-custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: color-mix(in srgb, ${colors.muted} 50%, transparent);
    }
  `;
}
