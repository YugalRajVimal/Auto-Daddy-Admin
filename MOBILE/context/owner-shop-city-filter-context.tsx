import { useAuth } from "@/context/auth-provider";
import { getJson, putJson } from "@/lib/api";
import type { UserCity } from "@/types/user-cities";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type FilterCity = { id: string; name: string };

type OwnerShopCityFilterContextValue = {
  /** City used to filter auto shops (defaults to profile city; empty = all cities). */
  filterCityName: string;
  filterCityId: string | null;
  /** Profile city snapshot used when resetting the page filter. */
  profileFilterCity: FilterCity | null;
  setFilterCity: (city: UserCity) => void;
  setFilterCityName: (name: string) => void;
  clearFilterCity: () => void;
  resetFilterCityToProfile: () => void;
  /** Persist selected city to profile (same as schedule-service). */
  persistFilterCity: (city: UserCity) => Promise<{ ok: boolean; message?: string }>;
  refreshFromProfile: () => Promise<void>;
};

const OwnerShopCityFilterContext = createContext<OwnerShopCityFilterContextValue | null>(null);

export function OwnerShopCityFilterProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [filterCityId, setFilterCityId] = useState<string | null>(null);
  const [filterCityName, setFilterCityName] = useState("");
  const [profileFilterCity, setProfileFilterCity] = useState<FilterCity | null>(null);
  const seededRef = useRef(false);

  const refreshFromProfile = useCallback(async () => {
    if (!token) {
      setFilterCityId(null);
      setFilterCityName("");
      setProfileFilterCity(null);
      return;
    }
    const res = await getJson<unknown>("/api/user/profile", { authToken: token });
    const payload = res.data;
    const src =
      payload && typeof payload === "object" && (payload as { data?: unknown }).data &&
      typeof (payload as { data?: unknown }).data === "object"
        ? ((payload as { data: Record<string, unknown> }).data as Record<string, unknown>)
        : (payload as Record<string, unknown> | null);
    const city = typeof src?.city === "string" ? src.city.trim() : "";
    const cityId = typeof src?.cityId === "string" ? src.cityId.trim() : "";
    if (city) {
      const seeded = { id: cityId || city, name: city };
      setProfileFilterCity(seeded);
      setFilterCityName(seeded.name);
      setFilterCityId(seeded.id);
    } else {
      setProfileFilterCity(null);
      setFilterCityName("");
      setFilterCityId(null);
    }
  }, [token]);

  useEffect(() => {
    if (seededRef.current || !token) return;
    seededRef.current = true;
    void refreshFromProfile();
  }, [token, refreshFromProfile]);

  const setFilterCity = useCallback((city: UserCity) => {
    setFilterCityId(city.id);
    setFilterCityName(city.name);
  }, []);

  const setFilterCityNameOnly = useCallback((name: string) => {
    const trimmed = name.trim();
    setFilterCityName(trimmed);
    setFilterCityId(trimmed || null);
  }, []);

  const clearFilterCity = useCallback(() => {
    setFilterCityName("");
    setFilterCityId(null);
  }, []);

  const resetFilterCityToProfile = useCallback(() => {
    if (profileFilterCity) {
      setFilterCityName(profileFilterCity.name);
      setFilterCityId(profileFilterCity.id);
      return;
    }
    setFilterCityName("");
    setFilterCityId(null);
  }, [profileFilterCity]);

  const persistFilterCity = useCallback(
    async (city: UserCity) => {
      if (!token) return { ok: false, message: "Not authenticated." };
      setFilterCity(city);
      const res = await putJson<{ success?: boolean; message?: string }>(
        "/api/user/edit-profile",
        { cityId: city.id, city: city.name },
        { authToken: token }
      );
      if (!res.ok || res.data?.success === false) {
        await refreshFromProfile();
        return { ok: false, message: res.data?.message ?? "Could not update city." };
      }
      setProfileFilterCity({ id: city.id, name: city.name });
      return { ok: true, message: res.data?.message };
    },
    [refreshFromProfile, setFilterCity, token]
  );

  const value = useMemo(
    () => ({
      filterCityName,
      filterCityId,
      profileFilterCity,
      setFilterCity,
      setFilterCityName: setFilterCityNameOnly,
      clearFilterCity,
      resetFilterCityToProfile,
      persistFilterCity,
      refreshFromProfile,
    }),
    [
      filterCityName,
      filterCityId,
      profileFilterCity,
      setFilterCity,
      setFilterCityNameOnly,
      clearFilterCity,
      resetFilterCityToProfile,
      persistFilterCity,
      refreshFromProfile,
    ]
  );

  return (
    <OwnerShopCityFilterContext.Provider value={value}>{children}</OwnerShopCityFilterContext.Provider>
  );
}

export function useOwnerShopCityFilter() {
  const ctx = useContext(OwnerShopCityFilterContext);
  if (!ctx) {
    throw new Error("useOwnerShopCityFilter must be used within OwnerShopCityFilterProvider");
  }
  return ctx;
}

export function useOwnerShopCityFilterOptional() {
  return useContext(OwnerShopCityFilterContext);
}
