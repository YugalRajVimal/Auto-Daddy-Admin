import { LoadingProgress, StackScreenFrame, useToast } from "@/components/reusables";
import {
  ShopDealEditorForm,
  formModeForSection,
  formSectionForActive,
} from "@/components/shop-owner/shop-deal-editor-form";
import { colors, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { dealId, useMyDeals } from "@/hooks/use-my-deals";
import { dealModeOf, type DealBoardSectionId, type DealFormMode } from "@/lib/shop-deal-form";
import type { ShopDeal } from "@/types/auto-shop-owner-endpoints";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

/**
 * Standalone add/edit screen — same autoshop-deals create/edit API as web ShopDealFormDialog.
 * Params: `dealId`, optional `section` (service|parts|salvage), optional `mode` (service|parts).
 */
export default function DealEditorPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    dealId?: string;
    section?: string;
    mode?: string;
  }>();
  const editId = typeof params.dealId === "string" ? params.dealId : undefined;
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const { deals, loading: dealsLoading, loadDeals } = useMyDeals(token, isOwner, (m, o) =>
    showToast(m, o)
  );

  const [deal, setDeal] = useState<ShopDeal | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const sectionParam = (params.section ?? "").toLowerCase();
  const modeParam = (params.mode ?? "").toLowerCase();

  const section: DealBoardSectionId = useMemo(() => {
    if (sectionParam === "service" || sectionParam === "parts" || sectionParam === "salvage") {
      return sectionParam;
    }
    return formSectionForActive("parts", deal);
  }, [deal, sectionParam]);

  const mode: DealFormMode = useMemo(() => {
    if (modeParam === "service" || modeParam === "parts") return modeParam;
    if (deal) return dealModeOf(deal);
    return formModeForSection(section);
  }, [deal, modeParam, section]);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  useFocusEffect(
    useCallback(() => {
      if (!editId) {
        setDeal(null);
        setPrefilled(true);
      } else {
        setPrefilled(false);
      }
      return undefined;
    }, [editId])
  );

  useEffect(() => {
    if (!editId || prefilled || deals.length === 0) return;
    const found = deals.find((x) => dealId(x) === editId) ?? null;
    setDeal(found);
    setPrefilled(true);
  }, [deals, editId, prefilled]);

  const dealsBackTo = "/(shop-owner)/deals";
  const showHydrating = Boolean(editId && !prefilled && dealsLoading);

  return (
    <StackScreenFrame
      title={editId ? "Edit deal" : "New deal"}
      backgroundColor={colors.bgDeals}
      scroll={false}
    >
      {showHydrating ? (
        <View style={styles.hydrating}>
          <LoadingProgress />
        </View>
      ) : (
        <View style={styles.content}>
          <ShopDealEditorForm
            embedded
            mode={mode}
            section={section}
            deal={deal}
            onCancel={() => router.back()}
            onSaved={() => {
              void loadDeals();
            }}
            onNeedServices={() =>
              router.push({
                pathname: "/(shop-owner)/services-selection",
                params: { backTo: dealsBackTo },
              })
            }
            onNeedVehicles={() =>
              router.push({
                pathname: "/(shop-owner)/car-companies",
                params: { backTo: dealsBackTo, from: "profile" },
              })
            }
          />
        </View>
      )}
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  hydrating: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
});
