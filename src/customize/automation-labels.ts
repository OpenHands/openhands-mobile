export interface AutomationTrigger {
  type: string;
  schedule?: string;
  schedule_human?: string;
  timezone?: string;
  source?: string;
  on?: string | string[];
}

export function isEventTrigger(trigger: AutomationTrigger): boolean {
  return trigger.type === "event";
}

export function automationTriggerLabel(trigger: AutomationTrigger): string {
  if (isEventTrigger(trigger)) {
    const events = Array.isArray(trigger.on)
      ? trigger.on.join(", ")
      : trigger.on?.trim();
    const source = trigger.source?.trim();
    if (source && events) return `${source} · ${events}`;
    return events || source || "Event";
  }
  return trigger.schedule_human?.trim() || trigger.schedule?.trim() || "Schedule";
}
