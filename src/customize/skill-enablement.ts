export interface SkillEnablement {
  enabledSkills?: string[];
  disabledSkills: string[];
}

export function isPublicSkillSource(source: string | null | undefined): boolean {
  if (!source) return false;
  return source === "public" || source.includes("public-skills");
}

export function withMembership(
  list: string[],
  name: string,
  present: boolean,
): string[] {
  if (list.includes(name) === present) return list;
  return present ? [...list, name] : list.filter((entry) => entry !== name);
}

export function isSkillEnabled(
  name: string,
  isPublic: boolean,
  enablement: SkillEnablement,
): boolean {
  if (enablement.disabledSkills.includes(name)) return false;
  if (!isPublic) return true;
  if (enablement.enabledSkills === undefined) return true;
  return enablement.enabledSkills.includes(name);
}

export function nextSkillEnablement(
  name: string,
  isPublic: boolean,
  enabled: boolean,
  current: SkillEnablement,
  publicNames: string[],
): SkillEnablement {
  if (isPublic) {
    const base =
      current.enabledSkills ??
      publicNames.filter((entry) => !current.disabledSkills.includes(entry));
    return {
      enabledSkills: withMembership(base, name, enabled),
      disabledSkills: withMembership(current.disabledSkills, name, false),
    };
  }
  return {
    enabledSkills: current.enabledSkills,
    disabledSkills: withMembership(current.disabledSkills, name, !enabled),
  };
}
