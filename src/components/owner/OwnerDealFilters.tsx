import { useMemo } from "react";
import {
  dealCityOptions,
  dealMakeOptions,
  dealModelOptions,
  type DealListFilters,
} from "../../lib/carOwnerDeals";
import type { CarOwnerDeal, CarOwnerDealsApiFilters } from "../../types/carOwnerDeals";
import { ownerVehicleSelectClass } from "./ownerVehicleFormUtils";

type OwnerDealFiltersProps = {
  deals: CarOwnerDeal[];
  filters: DealListFilters;
  onChange: (next: DealListFilters) => void;
  apiFilters?: CarOwnerDealsApiFilters;
};

const selectClass = `${ownerVehicleSelectClass} min-w-[7.5rem] flex-1 py-2 text-xs sm:min-w-[8.5rem] sm:text-sm`;

export default function OwnerDealFilters({
  deals,
  filters,
  onChange,
  apiFilters,
}: OwnerDealFiltersProps) {
  const makeOptions = useMemo(() => {
    if (apiFilters?.makes?.length) return [...apiFilters.makes].sort((a, b) => a.localeCompare(b));
    return dealMakeOptions(deals);
  }, [apiFilters?.makes, deals]);

  const modelOptions = useMemo(() => {
    if (!filters.make) return [];
    const fromDeals = dealModelOptions(deals, filters.make);
    if (fromDeals.length) return fromDeals;
    if (apiFilters?.models?.length) {
      return [...apiFilters.models].sort((a, b) => a.localeCompare(b));
    }
    return [];
  }, [apiFilters?.models, deals, filters.make]);

  const cityOptions = useMemo(() => {
    const options = dealCityOptions(deals, filters.make, filters.model);
    const selected = filters.city.trim();
    if (!selected) return options;
    if (options.some((c) => c.toLowerCase() === selected.toLowerCase())) return options;
    return [selected, ...options].sort((a, b) => a.localeCompare(b));
  }, [deals, filters.make, filters.model, filters.city]);

  const hasActiveFilter = Boolean(filters.make || filters.model || filters.city);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
          Filter deals
        </p>
        <p className="mt-0.5 text-xs text-slate-500">Narrow by make, model, or city</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hasActiveFilter ? (
          <button
            type="button"
            onClick={() => onChange({ make: "", model: "", city: "" })}
            className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80 transition hover:bg-slate-200/70"
          >
            Clear
          </button>
        ) : null}

        <select
          value={filters.make}
          aria-label="Make"
          onChange={(e) => {
            const make = e.target.value;
            onChange({ make, model: "", city: filters.city });
          }}
          className={selectClass}
        >
          <option value="">All makes</option>
          {makeOptions.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>

        <select
          value={filters.model}
          aria-label="Model"
          disabled={!filters.make}
          onChange={(e) => {
            const model = e.target.value;
            onChange({ ...filters, model });
          }}
          className={`${selectClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
        >
          <option value="">{filters.make ? "All models" : "Model"}</option>
          {modelOptions.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>

        <select
          value={filters.city}
          aria-label="City"
          onChange={(e) => onChange({ ...filters, city: e.target.value })}
          className={selectClass}
        >
          <option value="">All cities</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
