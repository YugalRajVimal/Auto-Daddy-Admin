import { StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { fetchMyServices, submitEnquiry } from "@/lib/auto-shop-owner-api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ServiceOption = { id: string; name: string };

function extractServices(payload: unknown): ServiceOption[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const raw =
    root.services ??
    (root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>).services
      : null);
  if (!Array.isArray(raw)) return [];
  const out: ServiceOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const nested =
      o.service && typeof o.service === "object"
        ? (o.service as Record<string, unknown>)
        : null;
    const id =
      typeof o.id === "string"
        ? o.id
        : typeof o._id === "string"
          ? o._id
          : typeof nested?.id === "string"
            ? nested.id
            : typeof nested?._id === "string"
              ? nested._id
              : "";
    const name =
      typeof o.name === "string"
        ? o.name.trim()
        : typeof nested?.name === "string"
          ? nested.name.trim()
          : "";
    if (id && name) out.push({ id, name });
  }
  return out;
}

function LanguageBanner() {
  return (
    <SurfaceCard shadow="soft" style={styles.langCard}>
      <View style={styles.langLeft}>
        <Text style={styles.langTitle}>Speak freely</Text>
        <Text style={styles.langBody}>
          You can speak in{" "}
          <Text style={styles.langHighlight}>English</Text>,{" "}
          <Text style={styles.langHighlight}>Hindi</Text> or{" "}
          <Text style={styles.langHighlight}>Punjabi</Text> to explore your enquiry.
        </Text>
      </View>
      <View style={styles.langArt}>
        <Ionicons name="chatbubbles-outline" size={38} color={colors.primary} />
      </View>
    </SurfaceCard>
  );
}

type ServicePickerModalProps = {
  visible: boolean;
  services: ServiceOption[];
  selectedId: string;
  onSelect: (s: ServiceOption) => void;
  onClose: () => void;
};

function ServicePickerModal({ visible, services, selectedId, onSelect, onClose }: ServicePickerModalProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetTitleRow}>
          <Text style={styles.sheetTitle}>Choose a Service</Text>
          <Pressable onPress={onClose} style={styles.sheetClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          style={styles.sheetList}
          renderItem={({ item }) => {
            const selected = item.id === selectedId;
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.sheetRow,
                  selected && styles.sheetRowSelected,
                  pressed && styles.sheetRowPressed,
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  style={[styles.sheetRowText, selected && styles.sheetRowTextSelected]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.sheetEmpty}>
              <Text style={styles.sheetEmptyText}>No services found. Add services in your profile first.</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

export default function InviteHelpScreen() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { recording, audioUri, error: recorderError, hasRecording, toggle, reset } = useVoiceRecorder();

  const loadedRef = useRef(false);

  const loadServices = useCallback(async () => {
    if (!token) return;
    setServicesLoading(true);
    try {
      const res = await fetchMyServices(token);
      const list = extractServices(res.data);
      setServices(list);
      if (!selectedService && list.length > 0) {
        setSelectedService(list[0]);
      }
    } catch {
      showToast("Could not load services.", { type: "error" });
    } finally {
      setServicesLoading(false);
    }
  }, [token, selectedService, showToast]);

  useFocusEffect(
    useCallback(() => {
      if (!loadedRef.current) {
        loadedRef.current = true;
        void loadServices();
      }
      return () => {
        reset();
      };
    }, [loadServices, reset])
  );

  async function handleSubmit() {
    if (!selectedService) {
      Alert.alert("Service required", "Please choose a service before submitting.");
      return;
    }
    if (!audioUri) {
      Alert.alert("Recording required", "Tap the microphone button and record your enquiry first.");
      return;
    }
    if (!token) {
      showToast("Please log in again.", { type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitEnquiry(token, {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        audioUri,
      });
      if (!res.ok || (res.data && typeof res.data === "object" && "success" in res.data && (res.data as any).success === false)) {
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        showToast(msg || "Could not submit your enquiry.", { type: "error" });
        return;
      }
      showToast("Enquiry submitted. Thank you!", { type: "success" });
      reset();
      setSelectedService(services[0] ?? null);
    } catch {
      showToast("Network error. Please try again.", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = Boolean(selectedService) && hasRecording && !submitting && !recording;

  return (
    <StackScreenFrame
      title="Invite Help"
      backgroundColor={colors.bgProfile}
      headerGradient={[colors.tabBarBg, colors.tabBarBg, colors.tabBarBg]}
      contentContainerStyle={styles.content}
    >
      <LanguageBanner />

      {/* Service picker */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          <Text style={styles.sparkle}>✨ </Text>Choose the Service
        </Text>
        {servicesLoading ? (
          <View style={styles.pickerLoadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.mutedText}>Loading services…</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
            onPress={() => setPickerVisible(true)}
          >
            <Text
              style={[styles.pickerText, !selectedService && styles.pickerPlaceholder]}
              numberOfLines={1}
            >
              {selectedService?.name ?? "Select a service…"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Voice recorder */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Record Your Enquiry</Text>
        <View style={styles.voiceRow}>
          <Pressable
            style={({ pressed }) => [
              styles.micBtn,
              recording && styles.micBtnActive,
              pressed && styles.micBtnPressed,
            ]}
            onPress={() => void toggle()}
            accessibilityLabel={recording ? "Stop recording" : "Start recording"}
          >
            <Ionicons
              name={recording ? "stop" : "mic"}
              size={26}
              color={colors.white}
            />
          </Pressable>
          <View style={styles.voiceStatus}>
            {recording ? (
              <>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording… tap to stop</Text>
              </>
            ) : hasRecording ? (
              <>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.readyText}>Recording ready</Text>
                <Pressable onPress={reset} hitSlop={8}>
                  <Text style={styles.resetLink}>Re-record</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.mutedText}>Tap the mic to start</Text>
            )}
          </View>
        </View>
        {recorderError ? (
          <Text style={styles.errorText}>{recorderError}</Text>
        ) : null}
      </View>

      {/* Submit */}
      <Pressable
        style={({ pressed }) => [
          styles.submitBtn,
          !canSubmit && styles.submitBtnDisabled,
          pressed && canSubmit && styles.submitBtnPressed,
        ]}
        onPress={() => void handleSubmit()}
        disabled={!canSubmit}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color={colors.white} />
            <Text style={styles.submitBtnText}>Submit Enquiry</Text>
          </>
        )}
      </Pressable>

      <ServicePickerModal
        visible={pickerVisible}
        services={services}
        selectedId={selectedService?.id ?? ""}
        onSelect={setSelectedService}
        onClose={() => setPickerVisible(false)}
      />
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: 60,
    gap: spacing.xl,
  },

  // Language banner
  langCard: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  langLeft: { flex: 1, gap: spacing.xs },
  langTitle: {
    fontSize: fontSizes.base,
    fontWeight: "900",
    color: colors.text,
  },
  langBody: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
    fontWeight: "600",
  },
  langHighlight: {
    color: colors.primary,
    fontWeight: "800",
  },
  langArt: {
    width: 56,
    height: 56,
    borderRadius: radii.round,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },

  // Sections
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.text,
  },
  sparkle: { fontSize: fontSizes.sm },

  // Service picker row
  pickerLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  pickerRowPressed: { opacity: 0.82 },
  pickerText: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: colors.text,
  },
  pickerPlaceholder: { color: colors.textLight },

  // Voice recorder
  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  micBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive: { backgroundColor: colors.danger },
  micBtnPressed: { opacity: 0.8 },
  voiceStatus: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  recordingText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.danger,
  },
  readyText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.success,
  },
  resetLink: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
    textDecorationLine: "underline",
    marginLeft: spacing.xs,
  },
  mutedText: { ...typography.bodyMuted },
  errorText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.danger,
    marginTop: spacing.xs,
  },

  // Submit button
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg + 2,
    marginTop: spacing.sm,
  },
  submitBtnDisabled: { backgroundColor: colors.textLight },
  submitBtnPressed: { opacity: 0.85 },
  submitBtnText: {
    fontSize: fontSizes.base,
    fontWeight: "900",
    color: colors.white,
  },

  // Service picker modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    maxHeight: "60%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.trackBg,
    marginBottom: spacing.sm,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: colors.text,
  },
  sheetClose: { padding: 6 },
  sheetList: { flexGrow: 0 },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetRowSelected: {
    backgroundColor: colors.primaryMutedBg,
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: radii.md,
  },
  sheetRowPressed: { opacity: 0.82 },
  sheetRowText: {
    ...typography.body,
    flex: 1,
    fontWeight: "700",
    color: colors.text,
  },
  sheetRowTextSelected: { color: colors.primary },
  sheetEmpty: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  sheetEmptyText: {
    ...typography.bodyMuted,
    textAlign: "center",
  },
});
