import { useEffect, useState } from "react";
import axios from "axios";
import { authHeaders } from "../api/client";

type ProvinceCityOption = { name: string; status?: string };
type ProvinceWithCities = { cities?: ProvinceCityOption[] };

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

/** Fetches the active city catalog (across all provinces) for admin City dropdowns. */
export function useAdminCityOptions(): string[] {
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/admin/provinces`, { headers: authHeaders() });
        if (cancelled) return;
        const provinces: ProvinceWithCities[] = res.data?.data || [];
        const names = new Set<string>();
        for (const province of provinces) {
          for (const c of province.cities || []) {
            if (!c.status || c.status === "Active") names.add(c.name);
          }
        }
        setCityOptions([...names].sort((a, b) => a.localeCompare(b)));
      } catch {
        if (!cancelled) setCityOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return cityOptions;
}

/** Merges the fetched city catalog with the currently-selected city so it's never dropped from the list. */
export function withSelectedCity(cityOptions: string[], selected: string): string[] {
  const names = new Set(cityOptions);
  if (selected.trim()) names.add(selected.trim());
  return [...names].sort((a, b) => a.localeCompare(b));
}
