import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, layout, space, textBase, typeScale } from "../theme";
import { PageHeader } from "../ui/page-header";
import { webScrollbarProps } from "../ui/web-scrollbar";

export function ScreenBody({
  title,
  onToggleNav,
  navOpen,
  onBack,
  trailing,
  loading,
  error,
  children,
}: {
  title: string;
  onToggleNav?: () => void;
  navOpen?: boolean;
  onBack?: () => void;
  trailing?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <PageHeader
        title={title}
        onToggleNav={onToggleNav}
        navOpen={navOpen}
        onBack={onBack}
        trailing={trailing}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

export const screenScrollProps = webScrollbarProps;

export const screenStyles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.gutter,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  empty: {
    ...textBase,
    color: colors.muted,
    fontSize: typeScale.title,
    lineHeight: 24,
  },
  hint: {
    ...textBase,
    color: colors.textSecondary,
    fontSize: typeScale.meta,
    lineHeight: 18,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  error: {
    ...textBase,
    color: colors.danger,
    paddingHorizontal: layout.gutter,
    marginBottom: space.sm,
    fontSize: typeScale.meta,
    lineHeight: 18,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});
