import { SurfaceCard, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useDocumentTemplatePreference } from "@/hooks/use-document-template-preference";
import { updateTemplateSlugs } from "@/lib/autoshopowner-api";
import {
  type DocumentTemplate,
  type DocumentTemplateKind,
  templateKindLabel,
  templatesForKind,
} from "@/lib/document-templates";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DocumentTemplatePanelProps = {
  kind: DocumentTemplateKind;
};

function TemplatePreviewMock({
  template,
  kind,
}: {
  template: DocumentTemplate | null;
  kind: DocumentTemplateKind;
}) {
  const isInvoice = kind === "invoice";

  if (!template) {
    return (
      <Text style={styles.previewEmpty}>
        Select a template to preview it here.
      </Text>
    );
  }

  return (
    <View style={styles.previewBody}>
      <View style={styles.previewHeader}>
        <View style={styles.previewHeaderText}>
          <Text style={styles.previewEyebrow}>
            {isInvoice ? "Invoice Preview" : "Job Card Preview"}
          </Text>
          <Text style={styles.previewTitle}>{template.name}</Text>
          <Text style={styles.previewDescription}>{template.description}</Text>
        </View>
        <View style={styles.previewLogoPlaceholder} />
      </View>

      <View style={styles.previewGrid}>
        <View style={styles.previewInfoBlock}>
          <View style={styles.previewLineWide} />
          <View style={styles.previewLineFull} />
          <View style={styles.previewLineMedium} />
        </View>
        <View style={styles.previewInfoBlock}>
          <View style={styles.previewLineMedium} />
          <View style={styles.previewLineFull} />
          <View style={styles.previewLineShort} />
        </View>
      </View>

      <View style={styles.previewTable}>
        <View style={styles.previewTableHead}>
          <Text style={styles.previewTableHeadText}>{isInvoice ? "Service / Part" : "Service"}</Text>
          <Text style={styles.previewTableHeadText}>Amount</Text>
        </View>
        {[1, 2, 3].map((row) => (
          <View key={row} style={styles.previewTableRow}>
            <View style={styles.previewTableCell} />
            <View style={styles.previewTableAmount} />
          </View>
        ))}
      </View>

      {!isInvoice ? (
        <View style={styles.previewPhotoRow}>
          {[1, 2, 3].map((slot) => (
            <View key={slot} style={styles.previewPhotoSlot} />
          ))}
        </View>
      ) : null}

      <View style={styles.previewTotalRow}>
        <View style={styles.previewTotalLines}>
          <View style={styles.previewLineShort} />
          <View style={styles.previewLineWide} />
        </View>
      </View>
    </View>
  );
}

export function DocumentTemplatePanel({ kind }: DocumentTemplatePanelProps) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();
  const templates = templatesForKind(kind);
  const label = templateKindLabel(kind);
  const { savedId, isActive, setSavedId, setIsActive } = useDocumentTemplatePreference(kind);

  const [selectedId, setSelectedId] = useState(savedId);
  const [active, setActive] = useState(isActive);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setSelectedId(savedId);
      setActive(isActive);
      return undefined;
    }, [isActive, savedId])
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [selectedId, templates]
  );
  const hasChanges = selectedId !== savedId || active !== isActive;

  const handleSave = async () => {
    if (!selectedId) {
      showToast(`Select a ${label.toLowerCase()} first.`, { type: "error" });
      return;
    }
    if (!token) {
      showToast("Please sign in again.", { type: "error" });
      return;
    }
    setSaving(true);
    try {
      const fields =
        kind === "invoice"
          ? { invoiceTemplateSlug: selectedId }
          : { jobCardTemplateSlug: selectedId };
      const res = await updateTemplateSlugs(token, fields);
      const msg =
        res.data && typeof res.data === "object" && "message" in res.data
          ? String((res.data as { message?: string }).message ?? "")
          : "";
      if (!res.ok) {
        showToast(msg || `Could not save ${label.toLowerCase()}.`, { type: "error" });
        return;
      }
      setSavedId(selectedId);
      setIsActive(active);
      showToast(msg || `${label} saved.`, { type: "success" });
    } catch {
      showToast("Network error.", { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.controlsRow}>
          <View style={styles.selectedToggle}>
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{ false: colors.border, true: colors.primaryMutedBg }}
              thumbColor={active ? colors.primary : colors.white}
            />
            <Text style={styles.selectedLabel}>Selected</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose template</Text>
        <View style={styles.templateList}>
          {templates.map((template) => {
            const selected = template.id === selectedId;
            return (
              <Pressable
                key={template.id}
                onPress={() => setSelectedId(template.id)}
                style={({ pressed }) => [pressed && styles.templateRowPressed]}
              >
                <SurfaceCard shadow="soft" style={[styles.templateRow, selected && styles.templateRowSelected] as never}>
                  <View style={styles.templateRowLeft}>
                    <View style={[styles.templateRadio, selected && styles.templateRadioSelected]}>
                      {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                    </View>
                    <View style={styles.templateText}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateDescription} numberOfLines={2}>
                        {template.description}
                      </Text>
                    </View>
                  </View>
                </SurfaceCard>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Preview</Text>
        <SurfaceCard shadow="card" style={styles.previewCard}>
          {!active || !selectedTemplate ? (
            <Text style={styles.previewEmpty}>
              {active
                ? "Select a template to preview it here."
                : `Turn on Selected to preview your ${label.toLowerCase()}.`}
            </Text>
          ) : (
            <TemplatePreviewMock template={selectedTemplate} kind={kind} />
          )}
        </SurfaceCard>

        <Text style={styles.footerHint}>You are selecting a &lsquo;{label}&rsquo;</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          onPress={() => {
            void handleSave();
          }}
          disabled={!hasChanges || !selectedId || saving}
          style={({ pressed }) => [
            styles.saveBtn,
            (!hasChanges || !selectedId || saving) && styles.saveBtnDisabled,
            pressed && hasChanges && selectedId && !saving && styles.saveBtnPressed,
          ]}
        >
          <Ionicons name="save-outline" size={18} color={colors.white} />
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : hasChanges ? "Save" : "Saved"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.md,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  selectedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.text,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: colors.text,
  },
  templateList: { gap: spacing.sm },
  templateRowPressed: { opacity: 0.84 },
  templateRow: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMutedBg,
  },
  templateRowLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  templateRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  templateRadioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  templateText: { flex: 1 },
  templateName: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: colors.text,
  },
  templateDescription: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  previewCard: {
    minHeight: 280,
    overflow: "hidden",
  },
  previewEmpty: {
    padding: spacing.xl,
    textAlign: "center",
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  previewBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  previewHeaderText: { flex: 1 },
  previewEyebrow: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.purple,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  previewTitle: {
    marginTop: 2,
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  previewDescription: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  previewLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  previewGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  previewInfoBlock: {
    flex: 1,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  previewLineWide: {
    width: 96,
    height: 10,
    borderRadius: radii.round,
    backgroundColor: colors.border,
  },
  previewLineFull: {
    width: "100%",
    height: 8,
    borderRadius: radii.round,
    backgroundColor: colors.border,
  },
  previewLineMedium: {
    width: "80%",
    height: 8,
    borderRadius: radii.round,
    backgroundColor: colors.border,
  },
  previewLineShort: {
    width: "60%",
    height: 8,
    borderRadius: radii.round,
    backgroundColor: colors.border,
  },
  previewTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  previewTableHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  previewTableHeadText: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.textMuted,
  },
  previewTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  previewTableCell: {
    flex: 1,
    height: 8,
    borderRadius: radii.round,
    backgroundColor: colors.bgAlt,
  },
  previewTableAmount: {
    width: 64,
    height: 8,
    borderRadius: radii.round,
    backgroundColor: colors.bgAlt,
  },
  previewPhotoRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  previewPhotoSlot: {
    flex: 1,
    aspectRatio: 4 / 3,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  previewTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    alignItems: "flex-end",
  },
  previewTotalLines: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  footerHint: {
    fontSize: fontSizes.xs,
    fontStyle: "italic",
    color: colors.textMuted,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    backgroundColor: colors.bgProfile,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnPressed: { opacity: 0.88 },
  saveBtnText: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: colors.white,
  },
});
