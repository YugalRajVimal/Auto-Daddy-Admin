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
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import type { UserCity } from "../lib/carOwnerCities";
import { parseUserProfilePayload } from "../lib/carOwnerProfile";
import OwnerCityPicker from "../components/owner/OwnerCityPicker";

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
  openCityPicker: () => void;
};

const OwnerShopCityFilterContext = createContext<OwnerShopCityFilterContextValue | null>(null);

export function OwnerShopCityFilterProvider({ children }: { children: ReactNode }) {
  const { token, profile } = useAuth();
  const profileCityFallback = profile?.city?.trim() || "";
  const [filterCityId, setFilterCityId] = useState<string | null>(null);
  const [filterCityName, setFilterCityName] = useState("");
  const [profileFilterCity, setProfileFilterCity] = useState<FilterCity | null>(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current || !token) return;
    let cancelled = false;
    (async () => {
      let name = profileCityFallback;
      let id = name;
      try {
        const res = await getJson<unknown>("/api/user/profile", token);
        if (cancelled) return;
        const parsed = parseUserProfilePayload(res.data);
        const profileName = parsed?.city?.trim();
        if (profileName) {
          name = profileName;
          id = parsed?.cityId?.trim() || profileName;
        }
      } catch {
        // Fall back to auth session city.
      }
      if (cancelled || seededRef.current) return;
      seededRef.current = true;
      if (name) {
        const seeded = { id: id || name, name };
        setProfileFilterCity(seeded);
        setFilterCityName(seeded.name);
        setFilterCityId(seeded.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, profileCityFallback]);

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
    setFilterCityName(profileCityFallback);
    setFilterCityId(profileCityFallback || null);
  }, [profileFilterCity, profileCityFallback]);

  const openCityPicker = useCallback(() => setCityPickerOpen(true), []);

  const value = useMemo(
    () => ({
      filterCityName,
      filterCityId,
      profileFilterCity,
      setFilterCity,
      setFilterCityName: setFilterCityNameOnly,
      clearFilterCity,
      resetFilterCityToProfile,
      openCityPicker,
    }),
    [
      filterCityName,
      filterCityId,
      profileFilterCity,
      setFilterCity,
      setFilterCityNameOnly,
      clearFilterCity,
      resetFilterCityToProfile,
      openCityPicker,
    ],
  );

  return (
    <OwnerShopCityFilterContext.Provider value={value}>
      {children}
      <OwnerCityPicker
        open={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        token={token}
        selectedId={filterCityId}
        onSelect={(city) => {
          setFilterCity(city);
          setCityPickerOpen(false);
        }}
      />
    </OwnerShopCityFilterContext.Provider>
  );
}

export function useOwnerShopCityFilter() {
  const ctx = useContext(OwnerShopCityFilterContext);
  if (!ctx) {
    throw new Error("useOwnerShopCityFilter must be used within OwnerShopCityFilterProvider");
  }
  return ctx;
}
