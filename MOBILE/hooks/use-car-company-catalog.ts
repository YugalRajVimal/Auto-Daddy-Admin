import { getJson } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

export type CarCompanyCatalogModel = {
  modelName: string;
  years: Array<string | number>;
};

export type CarCompanyCatalogItem = {
  companyName: string;
  models: CarCompanyCatalogModel[];
};

type CarCompaniesResponse = {
  data?: CarCompanyCatalogItem[];
  message?: string;
  success?: boolean;
};

export function useCarCompanyCatalog(authToken: string | null, enabled = true) {
  const [companies, setCompanies] = useState<CarCompanyCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authToken || !enabled) {
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getJson<CarCompaniesResponse>("/api/user/car-companies", { authToken });
        if (cancelled) {
          return;
        }
        const next = Array.isArray(res.data?.data) ? res.data.data : [];
        setCompanies(next.filter((c) => Boolean(c.companyName?.trim())));
      } catch {
        if (!cancelled) {
          setCompanies([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authToken, enabled]);

  const findCompany = useMemo(
    () => (companyName: string) => {
      const n = companyName.trim();
      if (!n) {
        return null;
      }
      return companies.find((c) => (c.companyName ?? "").trim() === n) ?? null;
    },
    [companies]
  );

  const findModel = useMemo(
    () => (companyName: string, modelName: string) => {
      const company = findCompany(companyName);
      const m = modelName.trim();
      if (!company || !m) {
        return null;
      }
      return company.models.find((x) => (x.modelName ?? "").trim() === m) ?? null;
    },
    [findCompany]
  );

  const modelOptionsFor = useMemo(
    () => (companyName: string) => findCompany(companyName)?.models ?? [],
    [findCompany]
  );

  const yearOptionsFor = useMemo(
    () => (companyName: string, modelName: string) => {
      const model = findModel(companyName, modelName);
      const out: string[] = [];
      for (const y of model?.years ?? []) {
        const s = String(y ?? "").trim();
        if (s) {
          out.push(s);
        }
      }
      return Array.from(new Set(out)).sort((a, b) => Number(b) - Number(a));
    },
    [findModel]
  );

  return {
    companies,
    loading,
    findCompany,
    modelOptionsFor,
    yearOptionsFor,
  };
}
