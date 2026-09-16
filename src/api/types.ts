export interface ServerInfo {
  version?: string;
  sdk_version?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  executionStatus: string | null;
}

export interface ConversationPage {
  items: ConversationSummary[];
  nextPageId: string | null;
}

export interface AgentEvent {
  id: string;
  timestamp: string;
  source: string;
  kind?: string;
  llm_message?: {
    role?: string;
    content?: unknown;
  };
  thought?: Array<{ type?: string; text?: string }>;
  action?: { kind?: string; command?: string; path?: string };
  tool_name?: string;
  summary?: string;
  observation?: { kind?: string; content?: unknown };
  content?: string | null;
  detail?: string;
}

export interface EventPage {
  items: AgentEvent[];
  next_page_id: string | null;
}

export interface CreatedConversation {
  id: string;
  title?: string;
}
