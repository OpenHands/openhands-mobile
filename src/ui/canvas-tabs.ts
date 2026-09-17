export const CANVAS_TABS = [
  "files",
  "commits",
  "planner",
  "terminal",
  "browser",
  "usage",
] as const;

export type CanvasTab = (typeof CANVAS_TABS)[number];

export const DEFAULT_CANVAS_TAB: CanvasTab = "files";
