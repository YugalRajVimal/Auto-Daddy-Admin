import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { MyVehiclesHero } from "@/components/car-owner/my-vehicles/my-vehicles-hero";
import { styles } from "@/components/car-owner/my-vehicles/my-vehicles-screen-styles";
import { normalizeVehicleList, type UserVehiclesResponse, type Vehicle } from "@/components/car-owner/my-vehicles/user-vehicles";
import { VehicleAccordion } from "@/components/car-owner/my-vehicles/vehicle-accordion";
import { VehicleImageViewerModal } from "@/components/car-owner/my-vehicles/vehicle-image-viewer-modal";
import { useToast } from "@/components/reusables";
import { colors } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { getJson } from "@/lib/api";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { putUserVehicleDisabled, userVehiclePutMessage } from "@/lib/user-vehicle-api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from "react-native";

export default function CarOwnerMyVehicles() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ title: string; uris: string[] } | null>(null);
  const [busyVehicleId, setBusyVehicleId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setExpandedId(null);
        setViewer(null);
        setBusyVehicleId(null);
      };
    }, [])
  );

  useEffect(() => {
    if (Platform.OS === "android") {
      const isNewArch = Boolean((globalThis as any)?.nativeFabricUIManager);
      if (!isNewArch) {
        UIManager.setLayoutAnimationEnabledExperimental?.(true);
      }
    }
  }, []);

  const load = useCallback(async () => {
    if (!token) {
      setError("Please login again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await getJson<UserVehiclesResponse>("/api/user/vehicles", { authToken: token });
    if (!res.ok || !res.data) {
      setError("Could not load vehicles.");
      setVehicles([]);
      setLoading(false);
      return;
    }
    const list = normalizeVehicleList(res.data);
    setVehicles(list);
    setLoading(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const visibleVehicles = useMemo(() => vehicles.filter((v) => !v.disabled), [vehicles]);

  const subtitle = useMemo(() => {
    if (loading) return "";
    if (error) return error;
    if (visibleVehicles.length === 0) {
      return vehicles.length > 0 ? "No enabled vehicles." : "No vehicles added yet.";
    }
    return `${visibleVehicles.length} vehicle${visibleVehicles.length === 1 ? "" : "s"} found`;
  }, [error, loading, vehicles.length, visibleVehicles.length]);

  const toggle = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((cur) => (cur === id ? null : id));
  }, []);

  const openViewer = useCallback((title: string, paths: (string | null | undefined)[]) => {
    const uris = paths.map((p) => normalizeMediaUrl(p ?? null)).filter(Boolean) as string[];
    if (uris.length === 0) return;
    setViewer({ title, uris });
  }, []);

  const pushAddVehicle = useCallback(() => {
    router.push("/(car-owner)/my-vehicles/add-vehicle" as never);
  }, []);

  const setVehicleDisabled = useCallback(
    async (id: string, disabled: boolean) => {
      if (!token) {
        showToast("Please login again.", { type: "error" });
        return;
      }
      setBusyVehicleId(id);
      try {
        const res = await putUserVehicleDisabled(id, disabled, token);
        const msg = userVehiclePutMessage(res.data);
        if (!res.ok) {
          showToast(msg || "Could not update vehicle.", { type: "error" });
          return;
        }
        setVehicles((prev) => prev.map((x) => (x.id === id ? { ...x, disabled } : x)));
        showToast(disabled ? "Vehicle disabled." : "Vehicle enabled.", { type: "success" });
      } catch {
        showToast("Network error while updating vehicle.", { type: "error" });
      } finally {
        setBusyVehicleId(null);
      }
    },
    [showToast, token]
  );

  const requestDisableVehicle = useCallback(
    (id: string) => {
      Alert.alert(
        "Delete this vehicle?",
        "It will not be available for new bookings until you enable it again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => void setVehicleDisabled(id, true) },
        ]
      );
    },
    [setVehicleDisabled]
  );

  return (
    <CarOwnerStackScreenFrame
      title="My Vehicles"
      contentContainerStyle={styles.screenContent}
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <MyVehiclesHero subtitle={subtitle} onRefresh={load} onAddVehicle={pushAddVehicle} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.successDark} />
        </View>
      ) : visibleVehicles.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="car-sport-outline" size={28} color={colors.successDark} />
          </View>
          <Text style={styles.emptyTitle}>{vehicles.length > 0 ? "No enabled vehicles" : "No vehicles yet"}</Text>
          <Text style={styles.emptySub}>
            {vehicles.length > 0
              ? "Disabled vehicles are hidden from this list."
              : "Add your first vehicle to start booking services."}
          </Text>
          <Pressable
            onPress={pushAddVehicle}
            style={styles.emptyBtn}
            android_ripple={{ color: "rgba(255,255,255,0.18)" }}
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.emptyBtnText}>Add Vehicle</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved vehicles</Text>
            <Text style={styles.sectionCount}>{visibleVehicles.length} total</Text>
          </View>
          <View style={styles.list}>
            {visibleVehicles.map((v) => (
              <VehicleAccordion
                key={v.id}
                vehicle={v}
                expanded={expandedId === v.id}
                onToggle={() => toggle(v.id)}
                onOpenViewer={openViewer}
                busyVehicleId={busyVehicleId}
                onRequestDisable={() => requestDisableVehicle(v.id)}
                onEdit={() => {
                  router.push({
                    pathname: "/(car-owner)/my-vehicles/add-vehicle",
                    params: {
                      mode: "edit",
                      vehicleId: v.id,
                      vehicle: encodeURIComponent(JSON.stringify(v)),
                    },
                  } as never);
                }}
              />
            ))}
          </View>
        </>
      )}

      <VehicleImageViewerModal viewer={viewer} onRequestClose={() => setViewer(null)} />
    </CarOwnerStackScreenFrame>
  );
}
