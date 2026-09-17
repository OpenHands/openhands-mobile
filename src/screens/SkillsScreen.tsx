import React from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AgentServerError } from "../api/http";
import { getAppSettings, saveSkillEnablement } from "../api/settings";
import { getSkills, type SkillInfo } from "../api/skills";
import { useAppState } from "../context/app-state";
import {
  isPublicSkillSource,
  isSkillEnabled,
  nextSkillEnablement,
  type SkillEnablement,
} from "../customize/skill-enablement";
import {
  getSkillCardDescription,
  skillOriginLabel,
} from "../customize/skill-description";
import { colors, layout, radius, space, textBase, typeScale } from "../theme";
import { ModuleCard } from "../ui/module-card";
import { SearchField } from "../ui/search-field";
import { ToggleSwitch } from "../ui/toggle-switch";
import { ScreenBody, screenScrollProps, screenStyles } from "./screen-body";

export function SkillsScreen({
  onToggleNav,
  navOpen,
}: {
  onToggleNav?: () => void;
  navOpen?: boolean;
}) {
  const { connection, openCustomize } = useAppState();
  const [skills, setSkills] = React.useState<SkillInfo[]>([]);
  const [enablement, setEnablement] = React.useState<SkillEnablement>({
    disabledSkills: [],
  });
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<SkillInfo | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!connection) return;
    setError(null);
    try {
      const [nextSkills, settings] = await Promise.all([
        getSkills(connection.host, connection.apiKey),
        getAppSettings(connection.host, connection.apiKey),
      ]);
      setSkills(nextSkills);
      setEnablement(settings.enablement);
    } catch (caught) {
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not load skills.",
      );
    } finally {
      setLoading(false);
    }
  }, [connection]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const publicNames = React.useMemo(
    () =>
      skills
        .filter((skill) => isPublicSkillSource(skill.source))
        .map((skill) => skill.name),
    [skills],
  );

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return skills;
    return skills.filter((skill) => {
      const description = getSkillCardDescription(skill).toLowerCase();
      return (
        skill.name.toLowerCase().includes(needle) ||
        description.includes(needle)
      );
    });
  }, [query, skills]);

  const toggle = async (skill: SkillInfo, enabled: boolean) => {
    if (!connection) return;
    const next = nextSkillEnablement(
      skill.name,
      isPublicSkillSource(skill.source),
      enabled,
      enablement,
      publicNames,
    );
    const previous = enablement;
    setEnablement(next);
    setSaving(skill.name);
    try {
      await saveSkillEnablement(connection.host, connection.apiKey, next);
    } catch (caught) {
      setEnablement(previous);
      setError(
        caught instanceof AgentServerError
          ? caught.message
          : "Could not update that skill.",
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <ScreenBody
      title="Skills"
      onToggleNav={onToggleNav}
      navOpen={navOpen}
      onBack={() => openCustomize("hub")}
      loading={loading}
      error={error}
    >
      <FlatList
        data={visible}
        keyExtractor={(item) => item.name}
        {...screenScrollProps}
        contentContainerStyle={
          visible.length === 0 ? styles.emptyWrap : screenStyles.content
        }
        ListHeaderComponent={
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search skills"
          />
        }
        ListEmptyComponent={
          <Text style={screenStyles.empty}>
            {query.trim()
              ? "No skills match that search."
              : "No skills on this backend yet."}
          </Text>
        }
        renderItem={({ item }) => {
          const enabled = isSkillEnabled(
            item.name,
            isPublicSkillSource(item.source),
            enablement,
          );
          return (
            <ModuleCard
              title={item.name}
              subtitle={getSkillCardDescription(item)}
              pill={skillOriginLabel(item.source)}
              onPress={() => setSelected(item)}
              trailing={
                <ToggleSwitch
                  value={enabled}
                  disabled={saving === item.name}
                  accessibilityLabel={`${enabled ? "Disable" : "Enable"} ${item.name}`}
                  onValueChange={(next) => void toggle(item, next)}
                />
              }
            />
          );
        }}
      />
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.scrim} onPress={() => setSelected(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            {selected ? (
              <>
                <Text style={styles.sheetTitle}>{selected.name}</Text>
                <Text style={styles.sheetPill}>
                  {skillOriginLabel(selected.source)}
                </Text>
                <Text style={styles.sheetBody}>
                  {getSkillCardDescription(selected) || "No description."}
                </Text>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.md,
    gap: space.md,
  },
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: layout.gutter,
    paddingBottom: 36,
    gap: space.sm,
  },
  sheetTitle: {
    ...textBase,
    color: colors.text,
    fontSize: typeScale.brand,
    lineHeight: 28,
    fontWeight: "600",
  },
  sheetPill: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.caption,
  },
  sheetBody: {
    ...textBase,
    color: colors.textSecondary,
    fontSize: typeScale.meta,
    lineHeight: 20,
  },
});
