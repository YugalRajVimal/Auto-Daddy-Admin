import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { useShopOwnerData } from "../context/ShopOwnerDataProvider";
import { fetchMyServices } from "../lib/shopOwnerApi";
import { parseMyServices } from "../lib/shopOwnerParsers";
import type { ShopServiceCategory } from "../types/shopOwner";

export type ShopServicesFilters = {
  make?: string;
  model?: string;
};

/** Stable empty list — avoid `?? []` creating a new array each render (infinite sync loops). */
const EMPTY_CATEGORIES: ShopServiceCategory[] = [];

export function useShopServices(filters?: ShopServicesFilters) {
  const { token } = useAuth();
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.services;

  const make = filters?.make?.trim() ?? "";
  const model = filters?.model?.trim() ?? "";
  const hasFilter = Boolean(make || model);

  const [filteredCategories, setFilteredCategories] = useState<ShopServiceCategory[] | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  useEffect(() => {
    void loadSection("services", { force: true });
  }, [loadSection]);

  const loadFiltered = useCallback(async () => {
    if (!hasFilter) {
      setFilteredCategories(null);
      setFilterLoading(false);
      setFilterError(null);
      return;
    }
    if (!token) {
      setFilteredCategories(EMPTY_CATEGORIES);
      setFilterLoading(false);
      setFilterError(null);
      return;
    }

    setFilterLoading(true);
    setFilterError(null);
    try {
      const res = await fetchMyServices(token, {
        make: make || undefined,
        model: model || undefined,
      });
      if (!res.ok) {
        setFilteredCategories(EMPTY_CATEGORIES);
        setFilterError("Could not load services.");
        return;
      }
      setFilteredCategories(parseMyServices(res.data));
    } catch {
      setFilteredCategories(EMPTY_CATEGORIES);
      setFilterError("Network error.");
    } finally {
      setFilterLoading(false);
    }
  }, [hasFilter, make, model, token]);

  useEffect(() => {
    void loadFiltered();
  }, [loadFiltered]);

  const refresh = useCallback(async () => {
    await refreshSection("services");
    if (hasFilter) {
      await loadFiltered();
    }
  }, [hasFilter, loadFiltered, refreshSection]);

  return {
    categories: hasFilter
      ? (filteredCategories ?? state.data ?? EMPTY_CATEGORIES)
      : (state.data ?? EMPTY_CATEGORIES),
    /** Unfiltered catalog — use for make/model option lists and index resolution. */
    allCategories: state.data ?? EMPTY_CATEGORIES,
    loading: hasFilter ? filterLoading && filteredCategories == null && !state.loaded : state.loading,
    loaded: hasFilter ? filteredCategories != null || state.loaded : state.loaded,
    error: hasFilter ? filterError : state.error,
    refresh,
  };
}
