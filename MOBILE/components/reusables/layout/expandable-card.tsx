import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "@/constants/autodaddy";
import { SurfaceCard } from "../ui/surface-card";

type Props = {
  title: string;
  headerIcon: keyof typeof Ionicons.glyphMap;
  expanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  editing?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  children?: ReactNode;
};

export function ExpandableCard({ title, headerIcon, expanded, onToggle, onEdit, editing = false, onSave, onCancel, saving = false, children }: Props) {
  return (
    <SurfaceCard shadow="card">
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        onPress={onToggle}
        disabled={saving}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.titleRow}>
            <View style={styles.iconBubble}>
              <Ionicons name={headerIcon} size={18} color={colors.white} />
            </View>
            <Text style={[typography.cardTitle, styles.title]} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <View style={styles.topActions}>
            {!editing && onEdit && expanded ? (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                hitSlop={8}
                disabled={saving}
              >
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onToggle();
              }}
              hitSlop={8}
              disabled={saving}
            >
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {editing ? (
          <View style={styles.editingActionsRow}>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onCancel?.();
              }}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.cancelBtn,
                pressed && styles.actionBtnPressed,
              ]}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onSave?.();
              }}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.saveBtn,
                (saving || pressed) && styles.actionBtnPressed,
              ]}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>
        ) : null}
      </Pressable>
      {expanded && children ? (
        <View style={styles.body}>
          <View pointerEvents={saving ? "none" : "auto"} style={saving ? styles.bodySaving : undefined}>
            {children}
          </View>
          {saving ? (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.savingText}>Saving changes...</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, gap: 10 },
  headerPressed: { backgroundColor: colors.bgAlt },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  title: { flexShrink: 1 },
  iconBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 0 },
  editingActionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" },
  actionBtn: { minHeight: 30, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  actionBtnPressed: { opacity: 0.75 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.primaryMutedBg, alignItems: "center", justifyContent: "center" },
  iconBtnPressed: { opacity: 0.78 },
  cancelBtn: { backgroundColor: colors.bgAlt },
  cancelBtnText: { color: colors.textMuted, fontWeight: "700", fontSize: 12 },
  saveBtn: { backgroundColor: colors.primary },
  saveBtnText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  body: { paddingHorizontal: 16, paddingBottom: 16, position: "relative" },
  bodySaving: { opacity: 0.45 },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  savingText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryDark,
  },
});
