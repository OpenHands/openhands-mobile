import { createConversation } from "../api/agent-server";
import type { ConversationSummary } from "../api/types";

export async function launchAutomationChat(
  host: string,
  apiKey: string,
  prompt: string,
): Promise<ConversationSummary> {
  const created = await createConversation(host, apiKey, prompt);
  const now = new Date().toISOString();
  return {
    id: created.id,
    title: created.title ?? "Create an automation",
    createdAt: now,
    updatedAt: now,
    executionStatus: null,
  };
}
