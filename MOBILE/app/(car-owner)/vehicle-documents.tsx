import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import type { PickedImage } from "@/components/car-owner/my-vehicles/add-vehicle-helpers";
import { styles as vehicleListStyles } from "@/components/car-owner/my-vehicles/my-vehicles-screen-styles";
import { VehicleImageViewerModal } from "@/components/car-owner/my-vehicles/vehicle-image-viewer-modal";
import { VehicleDocumentsAccordion } from "@/components/car-owner/vehicle-documents-accordion";
import { LoadingProgress, useToast } from "@/components/reusables";
import { colors, fontSizes, spacing, typography } from "@/constants/autodaddy";
import { useCarOwnerDocuments } from "@/hooks/use-car-owner-documents";
import type { VehicleDocumentFieldKey } from "@/lib/car-owner-documents";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Documents() {
  const { showToast } = useToast();
  const {
    sections,
    loading,
    error,
    mutating,
    busyField,
    refresh,
    uploadDocumentField,
  } = useCarOwnerDocuments();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ title: string; uris: string[] } | null>(null);

  useFocusEffect(

    useCallback(() => {
      refresh();

      return () => {
        setExpandedId(null);
        setViewer(null);
      };
    }, [])
  );

  useEffect(() => {
    if (Platform.OS === "android") {
      const isNewArch = Boolean((globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager);
      if (!isNewArch) {
        UIManager.setLayoutAnimationEnabledExperimental?.(true);
      }
    }
  }, []);

  const toggle = useCallback((vehicleId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((cur) => (cur === vehicleId ? null : vehicleId));
  }, []);

  const openViewer = useCallback((title: string, paths: (string | null | undefined)[]) => {
    const uris = paths.map((p) => normalizeMediaUrl(p ?? null)).filter(Boolean) as string[];
    if (uris.length === 0) return;
    setViewer({ title, uris });
  }, []);

  const pickImage = useCallback(async (): Promise<PickedImage | null> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Photo library permission is required.", { type: "error" });
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset?.uri) return null;
    return { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName };
  }, [showToast]);

  const handleUploadField = useCallback(
    async (vehicleId: string, field: VehicleDocumentFieldKey) => {
      const picked = await pickImage();
      if (!picked) return;
      const res = await uploadDocumentField(vehicleId, field, picked);
      if (res.ok) {
        showToast(res.message ?? "Document saved.", { type: "success" });
      } else {
        showToast(res.message ?? "Could not upload document.", { type: "error" });
      }
    },
    [pickImage, showToast, uploadDocumentField]
  );

  const headerRight = (
    <Pressable
      hitSlop={10}
      onPress={refresh}
      disabled={loading || mutating}
      style={styles.headerIconBtn}
      accessibilityLabel="Refresh"
    >
      <Ionicons name="refresh" size={20} color={colors.successDark} />
    </Pressable>
  );

  const listHeader = (
    <View style={styles.intro}>
      <Text style={styles.introDesc}>
        Registration, insurance, and license documents saved per vehicle. Tap a row to expand.
      </Text>
    </View>
  );

  return (
    <CarOwnerStackScreenFrame
      title="Documents"
      scroll={false}
      bodyStyle={styles.frameBody}
      contentContainerStyle={styles.frameContent}
      right={headerRight}
    >
      <VehicleImageViewerModal viewer={viewer} onRequestClose={() => setViewer(null)} />

      {loading && sections.length === 0 ? (
        <LoadingProgress />
      ) : error ? (
        <View style={styles.centerBlock}>
          <Ionicons name="cloud-offline-outline" size={44} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Couldn’t load documents</Text>
          <Text style={styles.emptyDesc}>{error}</Text>
          <Pressable onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : sections.length === 0 ? (
        <View style={[styles.centerBlock, styles.emptyWithHeader]}>
          {/* {listHeader} */}
          <Ionicons name="document-text-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptyDesc}>Add a vehicle under My Vehicles to upload documents.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading && !mutating} onRefresh={refresh} tintColor={colors.successDark} />
          }
        >
          {/* {listHeader} */}
          <View style={vehicleListStyles.list}>
            {sections.map((section) => (
              <VehicleDocumentsAccordion
                key={section.vehicleId}
                section={section}
                expanded={expandedId === section.vehicleId}
                onToggle={() => toggle(section.vehicleId)}
                onOpenViewer={openViewer}
                busyField={busyField}
                mutating={mutating}
                onUploadField={(field) => void handleUploadField(section.vehicleId, field)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </CarOwnerStackScreenFrame>
  );
}

const styles = StyleSheet.create({
  frameBody: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  frameContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.lg,
  },
  intro: {
    marginBottom: spacing.xs,
  },
  introDesc: { ...typography.bodyMuted, lineHeight: 22 },
  centerBlock: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyWithHeader: {
    justifyContent: "flex-start",
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screenHorizontal,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  emptyDesc: {
    ...typography.bodyMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.22)",
  },
  retryBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.successDark,
  },
});
