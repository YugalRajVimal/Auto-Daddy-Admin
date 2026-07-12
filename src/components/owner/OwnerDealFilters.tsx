import { useMemo } from "react";
import {
  dealCityOptions,
  dealFiltersUseVehicleCascade,
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

const selectClass = `${ownerVehicleSelectClass} w-[108px] shrink-0 py-1.5 text-xs sm:w-[118px] sm:text-sm`;

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

  const cityOptions = useMemo(
    () => dealCityOptions(deals, filters.make, filters.model),
    [deals, filters.make, filters.model]
  );
  const useVehicleCascade = useMemo(
    () => Boolean(apiFilters?.makes?.length) || dealFiltersUseVehicleCascade(deals),
    [apiFilters?.makes, deals]
  );
  const cityDisabled = useVehicleCascade ? !filters.make || !filters.model : false;

  const hasActiveFilter = Boolean(filters.make || filters.model || filters.city);

  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-2">
      {hasActiveFilter ? (
        <button
          type="button"
          onClick={() => onChange({ make: "", model: "", city: "" })}
          className="shrink-0 whitespace-nowrap text-xs font-semibold text-blue-700 hover:underline"
        >
          Clear
        </button>
      ) : null}

      <select
        value={filters.make}
        aria-label="Make"
        onChange={(e) => {
          const make = e.target.value;
          onChange({ make, model: "", city: "" });
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
          onChange({ ...filters, model, city: "" });
        }}
        className={`${selectClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
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
        disabled={cityDisabled}
        onChange={(e) => onChange({ ...filters, city: e.target.value })}
        className={`${selectClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
      >
        <option value="">
          {useVehicleCascade ? (filters.make && filters.model ? "All cities" : "City") : "All cities"}
        </option>
        {cityOptions.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  );
}
