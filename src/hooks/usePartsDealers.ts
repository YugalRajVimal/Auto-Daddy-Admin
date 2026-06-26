import { useCallback, useEffect, useMemo } from "react";
import {
  FALLBACK_PARTS_DEALERS,
  useShopOwnerData,
  type PartsDealerCard,
} from "../context/ShopOwnerDataProvider";
import { resolvePartsDealersFromPayload } from "../lib/shopPartsDealers";

export type { PartsDealerCard };

/** Dealer ads for shop home sidebar — instant fallbacks, upgraded when dashboard loads. */
export function usePartsDealers() {
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.partsDealers;
  const portalDashboard = sections.portal.data?.dashboard;

  useEffect(() => {
    void loadSection("partsDealers");
  }, [loadSection]);

  const dealers = useMemo(() => {
    if (portalDashboard) {
      return resolvePartsDealersFromPayload(portalDashboard);
    }
    return state.data ?? FALLBACK_PARTS_DEALERS;
  }, [portalDashboard, state.data]);

  const refresh = useCallback(async () => {
    await refreshSection("portal");
    await loadSection("partsDealers", { force: true });
  }, [loadSection, refreshSection]);

  return {
    dealers,
    loading: false,
    refresh,
  };
}
