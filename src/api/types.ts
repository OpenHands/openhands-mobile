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

export interface TaskItem {
  title: string;
  notes?: string;
  status?: "todo" | "in_progress" | "done" | string;
}

export interface AgentAction {
  kind?: string;
  command?: string;
  path?: string;
  thought?: string;
  message?: string;
  url?: string;
  pattern?: string;
  name?: string;
  file_text?: string;
  data?: unknown;
  task_list?: TaskItem[];
  index?: number;
  text?: string;
  direction?: string;
  tab_id?: string;
  include?: string;
  new_tab?: boolean;
  include_screenshot?: boolean;
  extract_links?: boolean;
  start_from_char?: number;
}

export interface AgentObservation {
  kind?: string;
  content?: unknown;
  command?: string;
  path?: string;
  output?: string;
  error?: string;
  is_error?: boolean;
  exit_code?: number;
  timeout?: boolean;
  metadata?: { exit_code?: number };
  tool_name?: string;
  skill_name?: string;
  profile_name?: string;
  active_model?: string;
  reason?: string;
  pattern?: string;
  search_path?: string;
  include_pattern?: string;
  files?: string[];
  matches?: string[];
  truncated?: boolean;
  task_list?: TaskItem[];
}

export interface CriticResult {
  score?: number;
  metadata?: {
    categorized_features?: {
      agent_behavioral_issues?: Array<{
        name?: string;
        display_name?: string;
        probability?: number;
      }>;
      infrastructure_issues?: Array<{
        name?: string;
        display_name?: string;
        probability?: number;
      }>;
      user_followup_patterns?: Array<{
        name?: string;
        display_name?: string;
        probability?: number;
      }>;
      other?: Array<{
        name?: string;
        display_name?: string;
        probability?: number;
      }>;
    };
  };
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
  reasoning_content?: string;
  thinking_blocks?: Array<{ type?: string; thinking?: string }>;
  action?: AgentAction;
  tool_name?: string;
  summary?: string;
  observation?: AgentObservation;
  content?: string | null;
  detail?: string;
  delta?: string;
  error?: string;
  security_risk?: string;
  critic_result?: CriticResult;
}

export interface EventPage {
  items: AgentEvent[];
  next_page_id: string | null;
}

export interface CreatedConversation {
  id: string;
  title?: string;
}
