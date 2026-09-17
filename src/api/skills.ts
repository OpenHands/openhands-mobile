import { isRecord, request } from "./http";

export interface SkillInfo {
  name: string;
  type?: string;
  source: string | null;
  description?: string | null;
  content?: string | null;
  triggers?: string[];
}

export async function getSkills(
  host: string,
  apiKey: string,
): Promise<SkillInfo[]> {
  const data = await request<Record<string, unknown>>(host, apiKey, "/api/skills", {
    method: "POST",
    body: JSON.stringify({
      load_public: true,
      load_user: true,
      load_project: true,
      load_org: false,
    }),
  });
  const raw = Array.isArray(data.skills) ? data.skills : [];
  return raw.flatMap((item) => {
    if (!isRecord(item) || typeof item.name !== "string" || !item.name.trim()) {
      return [];
    }
    return [
      {
        name: item.name,
        type: typeof item.type === "string" ? item.type : undefined,
        source: typeof item.source === "string" ? item.source : null,
        description:
          typeof item.description === "string" ? item.description : null,
        content: typeof item.content === "string" ? item.content : null,
        triggers: Array.isArray(item.triggers)
          ? item.triggers.filter((value): value is string => typeof value === "string")
          : undefined,
      },
    ];
  });
}
