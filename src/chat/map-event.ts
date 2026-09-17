import { eventText, isAssistantMessage, isUserMessage } from "../api/agent-server";
import type { AgentEvent, CriticResult, TaskItem } from "../api/types";
import {
  getActionDetails,
  getActionThoughtText,
  getActionTitle,
  getObservationDetails,
  getObservationStatus,
  getObservationTitle,
  getReasoningContent,
  isActionEvent,
  isErrorEvent,
  isObservationEvent,
  splitInlineThink,
} from "./event-content";

export type ChatRowKind =
  | "user"
  | "assistant"
  | "thinking"
  | "event"
  | "tasks"
  | "error"
  | "critic";

export type ChatRow =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "assistant"; text: string }
  | { id: string; kind: "thinking"; text: string }
  | {
      id: string;
      kind: "event";
      title: string;
      details: string;
      status?: "success" | "error" | "timeout" | "running";
    }
  | { id: string; kind: "tasks"; title: string; tasks: TaskItem[] }
  | { id: string; kind: "error"; text: string }
  | { id: string; kind: "critic"; result: CriticResult };

function pushCritic(rows: ChatRow[], event: AgentEvent): void {
  if (event.critic_result && typeof event.critic_result.score === "number") {
    rows.push({
      id: `${event.id}-critic`,
      kind: "critic",
      result: event.critic_result,
    });
  }
}

export function mapEventToRows(
  event: AgentEvent,
  options?: { streaming?: boolean },
): ChatRow[] {
  if (event.kind === "ConversationStateUpdateEvent") return [];
  if (event.kind === "StreamingDeltaEvent") {
    const text = eventText(event);
    return text ? [{ id: event.id, kind: "assistant", text }] : [];
  }

  if (isErrorEvent(event) && event.kind === "AgentErrorEvent") {
    return [
      {
        id: event.id,
        kind: "error",
        text: event.error ?? event.detail ?? "Unexpected agent error",
      },
    ];
  }

  if (isUserMessage(event)) {
    const text = eventText(event);
    return text ? [{ id: event.id, kind: "user", text }] : [];
  }

  if (isAssistantMessage(event) && event.kind === "MessageEvent") {
    const parsed = eventText(event);
    const { reasoning, message } = splitInlineThink(parsed, options);
    const rows: ChatRow[] = [];
    if (reasoning) rows.push({ id: `${event.id}-think`, kind: "thinking", text: reasoning });
    if (message) rows.push({ id: event.id, kind: "assistant", text: message });
    pushCritic(rows, event);
    return rows;
  }

  if (event.action?.kind === "ThinkAction" || event.observation?.kind === "ThinkObservation") {
    const text =
      event.action?.thought ??
      getObservationDetails(event) ??
      getActionThoughtText(event);
    return text ? [{ id: event.id, kind: "thinking", text }] : [];
  }

  if (event.action?.kind === "FinishAction") {
    const text = getActionDetails(event);
    const rows: ChatRow[] = text
      ? [{ id: event.id, kind: "assistant", text }]
      : [];
    pushCritic(rows, event);
    return rows;
  }

  if (
    event.observation?.kind === "TaskTrackerObservation" &&
    event.observation.command === "plan" &&
    (event.observation.task_list?.length ?? 0) > 0
  ) {
    return [
      {
        id: event.id,
        kind: "tasks",
        title: getObservationTitle(event),
        tasks: event.observation.task_list ?? [],
      },
    ];
  }

  const reasoning = getReasoningContent(event) || getActionThoughtText(event);
  const rows: ChatRow[] = [];
  if (reasoning && isActionEvent(event) && event.action?.kind !== "ThinkAction") {
    rows.push({ id: `${event.id}-think`, kind: "thinking", text: reasoning });
  }

  if (isObservationEvent(event)) {
    rows.push({
      id: event.id,
      kind: "event",
      title: getObservationTitle(event),
      details: getObservationDetails(event),
      status: getObservationStatus(event),
    });
    return rows;
  }

  if (isActionEvent(event)) {
    rows.push({
      id: event.id,
      kind: "event",
      title: getActionTitle(event),
      details: getActionDetails(event),
      status: "running",
    });
    return rows;
  }

  return rows;
}
