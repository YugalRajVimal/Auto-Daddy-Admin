import { InvoiceTemplatePreview } from "@/components/document-templates/invoice-template-preview";
import { SurfaceCard, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useDocumentTemplatePreference } from "@/hooks/use-document-template-preference";
import { updateTemplateSlugs } from "@/lib/autoshopowner-api";
import { getAutoShopOwnerProfile, saveAutoShopOwnerProfile } from "@/lib/auth";
import {
  DUMMY_INVOICE_TEMPLATES,
  resolveTemplateSlug,
  type DocumentTemplate,
} from "@/lib/document-templates";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import {
  DEFAULT_INVOICE_PREVIEW,
  mergeInvoicePreviewShop,
  type InvoicePreviewShop,
} from "@/lib/sample-invoice-data";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function InvoiceTemplateCard({
  template,
  selected,
  previewData,
  cardWidth,
  onSelect,
  onPreview,
}: {
  template: DocumentTemplate;
  selected: boolean;
  previewData: ReturnType<typeof mergeInvoicePreviewShop>;
  cardWidth: number;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <View style={[styles.card, { width: cardWidth }, selected && styles.cardSelected]}>
      <View style={styles.cardPreviewWrap}>
        <InvoiceTemplatePreview
          templateId={template.id}
          data={previewData}
          mode="thumbnail"
        />

        <Pressable
          onPress={onSelect}
          style={styles.selectOverlay}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={`Select ${template.name}`}
        />
        <View pointerEvents="none" style={styles.selectHint}>
          <Text style={styles.selectHintText}>{selected ? "Selected" : "Tap to select"}</Text>
        </View>

        {selected ? (
          <View style={styles.selectedBadge} pointerEvents="none">
            <Ionicons name="checkmark" size={14} color={colors.white} />
          </View>
        ) : null}

        <Pressable
          onPress={onPreview}
          style={({ pressed }) => [styles.previewBtn, pressed && styles.pressed]}
          hitSlop={4}
        >
          <Text style={styles.previewBtnText}>Preview</Text>
        </Pressable>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardName}>{template.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {template.description}
        </Text>
      </View>
    </View>
  );
}

export function InvoiceDocumentTemplatePanel() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { token, refreshSession } = useAuth();
  const { showToast } = useToast();
  const templates = DUMMY_INVOICE_TEMPLATES;
  const { savedId, setSavedId } = useDocumentTemplatePreference("invoice");

  const [selectedId, setSelectedId] = useState(savedId);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [shopPreview, setShopPreview] = useState<Partial<InvoicePreviewShop> | null>(null);

  const loadFromProfile = useCallback(async () => {
    const saved = await getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>();
    const business = saved?.data?.businessProfile;
    if (!business) return;

    const slug = resolveTemplateSlug(
      DUMMY_INVOICE_TEMPLATES,
      business.invoiceTemplateSlug
    );
    setSavedId(slug);
    setSelectedId(slug);

    const address = [business.businessAddress, business.city, business.pincode]
      .filter(Boolean)
      .join(", ");
    setShopPreview({
      name: business.businessName,
      address: address || undefined,
      phone: business.businessPhone,
      email: business.businessEmail,
      logoUrl: normalizeMediaUrl(business.businessLogo ?? null),
    });
  }, [setSavedId]);

  useFocusEffect(
    useCallback(() => {
      void loadFromProfile();
      return undefined;
    }, [loadFromProfile])
  );

  const previewData = useMemo(
    () => mergeInvoicePreviewShop(DEFAULT_INVOICE_PREVIEW, shopPreview),
    [shopPreview]
  );
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [selectedId, templates]
  );
  const hasChanges = selectedId !== savedId;

  const cardWidth = useMemo(() => {
    const horizontalPad = spacing.screenHorizontal * 2;
    const gap = spacing.md;
    const available = windowWidth - horizontalPad;
    if (available >= 640) return Math.min(300, (available - gap * 2) / 3);
    if (available >= 420) return (available - gap) / 2;
    return available;
  }, [windowWidth]);

  const handleSave = async () => {
    if (!selectedId) {
      showToast("Select an invoice template first.", { type: "error" });
      return;
    }
    if (!token) {
      showToast("Please sign in again.", { type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await updateTemplateSlugs(token, { invoiceTemplateSlug: selectedId });
      const msg =
        res.data && typeof res.data === "object" && "message" in res.data
          ? String((res.data as { message?: string }).message ?? "")
          : "";
      if (!res.ok) {
        showToast(msg || "Could not save invoice template.", { type: "error" });
        return;
      }
      setSavedId(selectedId);

      const cached = await getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>();
      if (cached?.data?.businessProfile) {
        await saveAutoShopOwnerProfile({
          ...cached,
          data: {
            ...cached.data,
            businessProfile: {
              ...cached.data.businessProfile,
              invoiceTemplateSlug: selectedId,
            },
          },
        });
      }
      await refreshSession();
      showToast(msg || "Invoice template saved.", { type: "success" });
    } catch {
      showToast("Network error.", { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedId(savedId);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (hasChanges ? 108 : 32) + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Choose Your Invoice Template</Text>
          <Text style={styles.heroSubtitle}>
            Preview a theme, then select and save the template for your shop invoices.
          </Text>
        </View>

        {templates.length === 0 ? (
          <SurfaceCard shadow="soft" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No invoice templates are available right now.</Text>
          </SurfaceCard>
        ) : (
          <View style={styles.cardGrid}>
            {templates.map((template) => (
              <InvoiceTemplateCard
                key={template.id}
                template={template}
                selected={selectedId === template.id}
                previewData={previewData}
                cardWidth={cardWidth}
                onSelect={() => setSelectedId(template.id)}
                onPreview={() => setPreviewTemplate(template)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {hasChanges ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Text style={styles.footerHint}>You are selecting your invoice template</Text>
          <View style={styles.footerActions}>
            <Pressable
              onPress={() => {
                void handleSave();
              }}
              disabled={saving || !selectedId}
              style={({ pressed }) => [
                styles.saveBtn,
                (saving || !selectedId) && styles.saveBtnDisabled,
                pressed && !saving && selectedId && styles.pressed,
              ]}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
            <Text style={styles.orText}>
              or{" "}
              <Text
                onPress={saving ? undefined : handleCancel}
                style={[styles.cancelLink, saving && styles.cancelLinkDisabled]}
              >
                Cancel
              </Text>
            </Text>
          </View>
        </View>
      ) : null}

      <Modal
        visible={previewTemplate != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewTemplate(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalEyebrow}>Invoice Preview</Text>
                <Text style={styles.modalTitle}>{previewTemplate?.name}</Text>
                <Text style={styles.modalDescription}>{previewTemplate?.description}</Text>
              </View>
              <Pressable onPress={() => setPreviewTemplate(null)} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {previewTemplate ? (
                <View style={styles.modalPreviewFrame}>
                  <InvoiceTemplatePreview
                    templateId={previewTemplate.id}
                    data={previewData}
                    mode="full"
                  />
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              {selectedTemplate?.id !== previewTemplate?.id ? (
                <Pressable
                  onPress={() => {
                    if (previewTemplate) {
                      setSelectedId(previewTemplate.id);
                      setPreviewTemplate(null);
                    }
                  }}
                  style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.saveBtnText}>Select this template</Text>
                </Pressable>
              ) : (
                <Text style={styles.alreadySelected}>This template is currently selected</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.lg,
  },
  hero: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  heroTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.purple,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyCard: {
    padding: spacing.xl,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSelected: {
    borderColor: colors.purple,
    borderWidth: 2,
  },
  cardPreviewWrap: {
    position: "relative",
    backgroundColor: colors.white,
  },
  previewBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 4,
    elevation: 4,
    backgroundColor: colors.purple,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  previewBtnText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: "800",
  },
  selectedBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 3,
    elevation: 3,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  selectOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  selectHint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xl,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  selectHintText: {
    textAlign: "center",
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  cardName: {
    fontSize: fontSizes.xs,
    fontWeight: "800",
    color: colors.purple,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  footerHint: {
    fontSize: fontSizes.xs,
    fontStyle: "italic",
    color: colors.textMuted,
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  saveBtn: {
    minWidth: 120,
    minHeight: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: "800",
  },
  orText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  cancelLink: {
    color: colors.primary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  cancelLinkDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.84 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  modalCard: {
    maxHeight: "92%",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalHeaderText: { flex: 1, gap: 2 },
  modalEyebrow: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.purple,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  modalDescription: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  modalScroll: { flexGrow: 0 },
  modalScrollContent: {
    backgroundColor: "#f0f0f0",
    padding: spacing.md,
  },
  modalPreviewFrame: {
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  modalFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: "flex-end",
  },
  alreadySelected: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
});
