import type {
  AgentAction,
  AgentEvent,
  AgentObservation,
  TaskItem,
} from "../api/types";

export const MAX_CONTENT_LENGTH = 1000;

export type EventStatus = "success" | "error" | "timeout" | "running";

function trimTitle(text: string, maxLength: number): string {
  const compact = text.trim().replace(/\s+/g, " ");
  if (!compact) return "";
  return compact.length > maxLength
    ? `${compact.slice(0, maxLength)}...`
    : compact;
}

function isServerFallbackSummary(summary: string): boolean {
  return /^[a-z][a-z0-9_]*\s*:\s*[[{]/i.test(summary);
}

function textBlocks(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter(
      (block): block is { type?: string; text?: string } =>
        typeof block === "object" && block !== null,
    )
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n")
    .trim();
}

function clip(value: string): string {
  return value.length > MAX_CONTENT_LENGTH
    ? `${value.slice(0, MAX_CONTENT_LENGTH)}...`
    : value;
}

function actionKind(event: AgentEvent): string {
  return event.action?.kind ?? "";
}

function observationKind(event: AgentEvent): string {
  return event.observation?.kind ?? "";
}

export function splitInlineThink(
  content: string,
  options?: { streaming?: boolean },
): { reasoning: string; message: string } {
  const open = "<think>";
  const close = "</think>";
  if (!content.startsWith(open)) return { reasoning: "", message: content };
  const end = content.indexOf(close, open.length);
  if (end === -1) {
    return options?.streaming
      ? { reasoning: content.slice(open.length), message: "" }
      : { reasoning: "", message: content };
  }
  return {
    reasoning: content.slice(open.length, end).trim(),
    message: content.slice(end + close.length).trimStart(),
  };
}

export function getActionThoughtText(event: AgentEvent): string {
  if (Array.isArray(event.thought)) {
    return event.thought
      .map((block) => block.text ?? "")
      .join("\n")
      .trim();
  }
  return "";
}

export function getReasoningContent(event: AgentEvent): string {
  if (event.reasoning_content?.trim()) return event.reasoning_content.trim();
  if (event.thinking_blocks?.length) {
    return event.thinking_blocks
      .filter((block) => block.type === "thinking")
      .map((block) => block.thinking ?? "")
      .join("\n\n")
      .trim();
  }
  return "";
}

function summaryTitle(event: AgentEvent): string | null {
  const summary = event.summary?.trim().replace(/\s+/g, " ") || "";
  return !summary || isServerFallbackSummary(summary) ? null : summary;
}

export function getActionTitle(event: AgentEvent): string {
  const summary = summaryTitle(event);
  if (summary) return summary;
  const action = event.action ?? {};
  switch (action.kind) {
    case "ExecuteBashAction":
    case "TerminalAction":
      return `Running ${trimTitle(action.command ?? "", 80)}`;
    case "FileEditorAction":
    case "StrReplaceEditorAction":
      if (action.command === "view") return `Reading ${action.path ?? ""}`;
      if (action.command === "create") return `Writing to ${action.path ?? ""}`;
      return `Editing ${action.path ?? ""}`;
    case "MCPToolAction":
      return `Calling MCP Tool: ${event.tool_name ?? ""}`;
    case "InvokeSkillAction":
      return `Invoking skill ${action.name ?? ""}`;
    case "ThinkAction":
      return "Thinking";
    case "FinishAction":
      return "Finished";
    case "TaskTrackerAction":
      return "Managing tasks";
    case "GrepAction":
      return `Search in files: ${trimTitle(action.pattern ?? "", 50)}`;
    case "GlobAction":
      return `Search files: ${trimTitle(action.pattern ?? "", 50)}`;
    case "BrowserNavigateAction":
    case "BrowserClickAction":
    case "BrowserTypeAction":
    case "BrowserGetStateAction":
    case "BrowserGetContentAction":
    case "BrowserScrollAction":
    case "BrowserGoBackAction":
    case "BrowserListTabsAction":
    case "BrowserSwitchTabAction":
    case "BrowserCloseTabAction":
      return "Browsing the web";
    default:
      return (action.kind ?? event.tool_name ?? "Action").replace(/Action$/, "");
  }
}

export function getObservationTitle(event: AgentEvent): string {
  const observation = event.observation ?? {};
  switch (observation.kind) {
    case "ExecuteBashObservation":
    case "TerminalObservation":
      return `Ran ${trimTitle(observation.command ?? "", 80)}`;
    case "FileEditorObservation":
    case "StrReplaceEditorObservation":
      if (observation.command === "view") return `Read ${observation.path ?? ""}`;
      if (observation.command === "create")
        return `Wrote ${observation.path ?? ""}`;
      return `Edited ${observation.path ?? ""}`;
    case "MCPToolObservation":
      return `Called MCP Tool: ${observation.tool_name ?? event.tool_name ?? ""}`;
    case "InvokeSkillObservation":
      return `Invoked skill ${observation.skill_name ?? ""}`;
    case "BrowserObservation":
      return "Browsed the web";
    case "TaskTrackerObservation":
      return observation.command === "plan"
        ? "Updated task list"
        : "Viewed task list";
    case "ThinkObservation":
      return "Thought";
    case "GlobObservation":
      return `Searched files: ${trimTitle(observation.pattern ?? "", 50)}`;
    case "GrepObservation":
      return `Searched in files: ${trimTitle(observation.pattern ?? "", 50)}`;
    case "SwitchLLMObservation":
      return observation.is_error
        ? `Failed to switch model ${observation.profile_name ?? ""}`
        : `Switched to ${observation.profile_name ?? ""}`;
    default:
      return (observation.kind ?? event.tool_name ?? "Observation").replace(
        /Observation$/,
        "",
      );
  }
}

export function getObservationStatus(event: AgentEvent): EventStatus {
  const observation = event.observation;
  if (!observation) return "running";
  const kind = observation.kind;
  if (kind === "ExecuteBashObservation") {
    const exit = observation.exit_code ?? observation.metadata?.exit_code;
    if (exit === -1) return "timeout";
    if (exit === 0) return "success";
    return "error";
  }
  if (kind === "TerminalObservation") {
    const exit = observation.exit_code ?? observation.metadata?.exit_code;
    if (observation.timeout || exit === -1) return "timeout";
    if (exit === 0) return "success";
    if (observation.is_error) return "error";
    return "success";
  }
  if (observation.error || observation.is_error) return "error";
  return "success";
}

function actionDetails(action: AgentAction, event: AgentEvent): string {
  switch (action.kind) {
    case "ExecuteBashAction":
    case "TerminalAction": {
      let content = `Command:\n\`${action.command ?? ""}\``;
      if (event.security_risk === "HIGH" || event.security_risk === "MEDIUM") {
        content += `\n\n${event.security_risk} risk`;
      }
      return content;
    }
    case "FileEditorAction":
    case "StrReplaceEditorAction":
      if (action.command === "create" && action.file_text) {
        return `${action.path ?? ""}\n${clip(action.file_text)}`;
      }
      return "";
    case "MCPToolAction":
      return `**MCP Tool Call**\n\n**Arguments:**\n\`\`\`json\n${JSON.stringify(action.data ?? {}, null, 2)}\n\`\`\``;
    case "ThinkAction":
      return action.thought ?? "";
    case "FinishAction":
      return (action.message ?? "").trim();
    case "TaskTrackerAction":
      return formatTaskList(action.command ?? "", action.task_list ?? []);
    case "BrowserNavigateAction":
      return `Browsing ${action.url ?? ""}${action.new_tab ? "\n**New Tab:** Yes" : ""}`;
    case "BrowserClickAction":
      return `**Element Index:** ${action.index ?? ""}${action.new_tab ? "\n**New Tab:** Yes" : ""}`;
    case "BrowserTypeAction":
      return `**Element Index:** ${action.index ?? ""}\n**Text:** ${trimTitle(action.text ?? "", 50)}`;
    case "BrowserScrollAction":
      return `**Direction:** ${action.direction ?? ""}`;
    case "BrowserSwitchTabAction":
    case "BrowserCloseTabAction":
      return `**Tab ID:** ${action.tab_id ?? ""}`;
    case "GrepAction":
    case "GlobAction": {
      const parts = [];
      if (action.pattern) parts.push(`**Pattern:** \`${action.pattern}\``);
      if (action.path) parts.push(`**Path:** \`${action.path}\``);
      if (action.include) parts.push(`**Include:** \`${action.include}\``);
      return parts.join("\n");
    }
    case "InvokeSkillAction":
      return action.name ? `**Skill:** \`${action.name}\`` : "";
    default:
      return "";
  }
}

function formatTaskList(command: string, tasks: TaskItem[]): string {
  let content = `**Command:** \`${command}\``;
  if (command !== "plan") return content;
  if (!tasks.length) return `${content}\n\n**Task List:** Empty`;
  content += `\n\n**Task List (${tasks.length} ${tasks.length === 1 ? "item" : "items"}):**\n`;
  tasks.forEach((task, index) => {
    const icon =
      task.status === "done" ? "✅" : task.status === "in_progress" ? "🔄" : "⏳";
    content += `\n${index + 1}. ${icon} **[${(task.status ?? "todo").toUpperCase().replace("_", " ")}]** ${task.title}`;
    if (task.notes) content += `\n   *Notes: ${task.notes}*`;
  });
  return content;
}

function observationDetails(observation: AgentObservation): string {
  const text = textBlocks(observation.content) || observation.output || "";
  switch (observation.kind) {
    case "ExecuteBashObservation":
    case "TerminalObservation": {
      let output = "";
      if (observation.command) output += `Command: \`${observation.command}\`\n\n`;
      output += `Output:\n\`\`\`sh\n${clip(text) || "(no output)"}\n\`\`\``;
      return output;
    }
    case "FileEditorObservation":
    case "StrReplaceEditorObservation":
      if (observation.error) return `**Error:**\n${observation.error}`;
      return text ? `\`\`\`\n${clip(text)}\n\`\`\`` : "";
    case "BrowserObservation":
      if (observation.error) return `**Error:**\n${observation.error}`;
      return text ? `**Output:**\n${clip(text)}` : "Browser action completed successfully.";
    case "MCPToolObservation":
      return clip(
        `**Tool:** ${observation.tool_name ?? ""}\n\n${observation.is_error ? "**Error:**" : "**Result:**"}\n${text}`,
      );
    case "InvokeSkillObservation": {
      const header = observation.skill_name
        ? `**Skill:** \`${observation.skill_name}\`\n\n`
        : "";
      return clip(
        `${header}${observation.is_error ? `**Error:**\n${text}` : text}`,
      );
    }
    case "TaskTrackerObservation":
      return formatTaskList(observation.command ?? "", observation.task_list ?? []);
    case "ThinkObservation":
      return text;
    case "FinishObservation":
      return observation.is_error ? `**Error:**\n${text}` : text;
    case "GlobObservation": {
      let content = `**Pattern:** \`${observation.pattern ?? ""}\`\n**Search Path:** \`${observation.search_path ?? ""}\`\n\n`;
      if (observation.is_error) content += `**Error:**\n${text}`;
      else if (!observation.files?.length) content += "**Result:** No files found.";
      else {
        content += `**Files Found (${observation.files.length}${observation.truncated ? "+, truncated" : ""}):**\n`;
        content += observation.files.map((file) => `- \`${file}\``).join("\n");
      }
      return clip(content);
    }
    case "GrepObservation": {
      let content = `**Pattern:** \`${observation.pattern ?? ""}\`\n**Search Path:** \`${observation.search_path ?? ""}\`\n`;
      if (observation.include_pattern)
        content += `**Include:** \`${observation.include_pattern}\`\n`;
      content += "\n";
      if (observation.is_error) content += `**Error:**\n${text}`;
      else if (!observation.matches?.length)
        content += "**Result:** No matches found.";
      else {
        content += `**Matches (${observation.matches.length}${observation.truncated ? "+, truncated" : ""}):**\n`;
        content += observation.matches.map((file) => `- \`${file}\``).join("\n");
      }
      return clip(content);
    }
    case "SwitchLLMObservation":
      if (observation.is_error) {
        return text
          ? `**Error:**\n${text}`
          : `**Error:**\nFailed to switch LLM profile \`${observation.profile_name ?? ""}\`.`;
      }
      return [
        `**Profile:** \`${observation.profile_name ?? ""}\``,
        observation.active_model
          ? `**Active model:** \`${observation.active_model}\``
          : "",
        observation.reason ? `**Reason:** ${observation.reason}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    default:
      return text || (observation.error ? `**Error:**\n${observation.error}` : "");
  }
}

export function getActionDetails(event: AgentEvent): string {
  return event.action ? actionDetails(event.action, event) : "";
}

export function getObservationDetails(event: AgentEvent): string {
  return event.observation ? observationDetails(event.observation) : "";
}

export function isActionEvent(event: AgentEvent): boolean {
  return event.kind === "ActionEvent" || Boolean(event.action && !event.observation);
}

export function isObservationEvent(event: AgentEvent): boolean {
  return event.kind === "ObservationEvent" || Boolean(event.observation);
}

export function isErrorEvent(event: AgentEvent): boolean {
  return event.kind === "AgentErrorEvent" || Boolean(event.error);
}

export { actionKind, observationKind, textBlocks };
