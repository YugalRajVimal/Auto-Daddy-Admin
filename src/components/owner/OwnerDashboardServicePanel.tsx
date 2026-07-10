import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import { getJson, postJson } from "../../api/mobileAuth";
import DashboardPanelCard from "../COMP";
import CarBrandLogo from "../shop/CarBrandLogo";
import { shopMainContentFillClass, shopMainContentShellClass } from "../shop/shopLayoutStyles";
import { useCarOwnerAutoShops } from "../../hooks/useCarOwnerAutoShops";
import { useCarOwnerFavoriteShops } from "../../hooks/useCarOwnerFavoriteShops";
import type { ServiceCategory } from "../../hooks/useOwnerPortal";
import { isCarOwnerShopOpenToday } from "../../lib/carOwnerAutoShops";
import { getCarBrandId, getCarBrandName } from "../../lib/dummyCarBrands";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import type { OwnerShopType } from "../../lib/serviceCatalog";
import type { CarOwnerAutoShopListItem } from "../../types/carOwnerAutoShops";
import type { ShopCarCompany } from "../shop/forms/ShopProfileEditors";
import OwnerShopExpandedPanel, { ownerShopServiceRequestKey } from "./OwnerShopExpandedPanel";
import { Skeleton } from "../common/Skeleton";

type OwnerDashboardServicePanelProps = {
  service: ServiceCategory;
  selectedSubServiceId?: string | null;
  token: string | null;
};

function serviceShopTypeParam(shopType?: OwnerShopType): string | null {
  switch (shopType) {
    case "autoShop":
    case "tyreShop":
    case "carWash":
    case "towTruck":
      return shopType;
    default:
      return null;
  }
}

/** Backend filters `service` by main category id (not sub-service id). */
function resolveServiceFilterId(service: ServiceCategory): string | null {
  if (service.id?.trim()) return service.id.trim();
  return null;
}

function OwnerPanelSectionHeader({ title }: { title: string }) {
  return (
    <div className="shrink-0 bg-ad-purple px-4 py-2.5 text-center text-sm font-bold text-white">{title}</div>
  );
}

function OwnerVehicleMakeGrid({
  brands,
  loading,
  onSelect,
}: {
  brands: ShopCarCompany[];
  loading?: boolean;
  onSelect: (brand: ShopCarCompany) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 15 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
        No vehicle makes available yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {brands.map((brand) => {
        const id = getCarBrandId(brand);
        const name = getCarBrandName(brand);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(brand)}
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-3 shadow-sm transition-all hover:border-ad-purple/40 hover:shadow-md"
          >
            <div className="flex h-14 w-full items-center justify-center">
              <CarBrandLogo company={brand} className="max-h-12 max-w-full object-contain" />
            </div>
            <span className="text-center text-[11px] font-bold uppercase tracking-wide text-gray-800">{name}</span>
          </button>
        );
      })}
    </div>
  );
}

function OwnerDashboardShopRow({
  shop,
  onExpand,
}: {
  shop: CarOwnerAutoShopListItem;
  onExpand: () => void;
}) {
  const openToday = isCarOwnerShopOpenToday(shop);
  const logoUri = normalizeMediaUrl(shop.logoUrl);
  const phone = shop.phone.trim() || "Phone not listed";

  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex w-full items-center gap-3 border-b border-[#b2e0a0]/60 bg-ad-green-light/50 px-3 py-3 text-left transition-colors hover:bg-ad-green-light/70 last:border-b-0"
      aria-label={`View ${shop.name}`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
        {logoUri ? <img src={logoUri} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-900">{shop.name}</p>
        <p className="truncate text-sm font-medium text-blue-600">{phone}</p>
      </div>
      <span
        className={`shrink-0 rounded px-3 py-1 text-xs font-bold text-white ${
          openToday ? "bg-ad-green" : "bg-gray-400"
        }`}
      >
        {openToday ? "Shop is Open" : "Shop is Closed"}
      </span>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-ad-purple text-lg font-bold leading-none text-white shadow-sm"
        aria-hidden
      >
        <FiPlus aria-hidden />
      </span>
    </button>
  );
}

export default function OwnerDashboardServicePanel({
  service,
  selectedSubServiceId,
  token,
}: OwnerDashboardServicePanelProps) {
  const [brands, setBrands] = useState<ShopCarCompany[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<ShopCarCompany | null>(null);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [connectingServiceKey, setConnectingServiceKey] = useState<string | null>(null);
  const [sentServiceKeys, setSentServiceKeys] = useState<Record<string, boolean>>({});

  const serviceFilterId = resolveServiceFilterId(service);
  const serviceLabel = service.name.trim() || "Service";
  const brandId = selectedBrand ? getCarBrandId(selectedBrand) : null;
  const brandLabel = selectedBrand ? getCarBrandName(selectedBrand) : "";

  const searchLabel = useMemo(() => {
    if (selectedSubServiceId?.trim()) {
      const sub = service.subServices.find(
        (item) => (item.id ?? item.name) === selectedSubServiceId.trim()
      );
      if (sub?.name?.trim()) return sub.name.trim();
    }
    return service.name.trim() || null;
  }, [selectedSubServiceId, service.name, service.subServices]);

  // GET /api/user/auto-shops?search=&service=&carCompanies=&shopType=
  const shopFilters = useMemo(
    () => ({
      serviceIds: serviceFilterId ? [serviceFilterId] : [],
      carCompanyIds: brandId ? [brandId] : [],
      shopType: serviceShopTypeParam(service.shopType),
      search: searchLabel,
      enabled: Boolean(brandId),
    }),
    [brandId, searchLabel, service.shopType, serviceFilterId]
  );

  const { shops, loading: shopsLoading, error: shopsError, refresh } = useCarOwnerAutoShops(shopFilters);
  const { isFavorite, toggleFavorite } = useCarOwnerFavoriteShops();
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);

  const shopsWithFavorites = useMemo(
    () => shops.map((shop) => ({ ...shop, isFavorite: isFavorite(shop.id) })),
    [shops, isFavorite]
  );
  const expandedShop = shopsWithFavorites.find((shop) => shop.id === expandedShopId) ?? null;

  const handleToggleFavorite = useCallback(
    async (shopId: string) => {
      setFavoriteBusyId(shopId);
      const result = await toggleFavorite(shopId);
      setFavoriteBusyId(null);
      if (!result.ok) {
        toast.error(result.error ?? "Could not update favorite.");
        return;
      }
      toast.success(result.isFavorite ? "Added to favorites." : "Removed from favorites.");
    },
    [toggleFavorite]
  );

  useEffect(() => {
    setSelectedBrand(null);
    setExpandedShopId(null);
    setStatusMessage(null);
    setSentServiceKeys({});
    setConnectingServiceKey(null);
  }, [service.id, service.name, selectedSubServiceId]);

  useEffect(() => {
    if (!token) {
      setBrands([]);
      setBrandsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setBrandsLoading(true);
      try {
        // GET /api/user/car-companies (optional ?companyName=)
        const res = await getJson<{
          success?: boolean;
          data?: Array<{
            _id?: string;
            companyName?: string;
            brandLogo?: string | null;
            logoUrl?: string | null;
          }>;
        }>("/api/user/car-companies", token);

        if (cancelled) return;

        if (!res.ok || res.data?.success === false) {
          setBrands([]);
          return;
        }

        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const catalog = rows
          .filter((row) => Boolean(row._id?.trim()) && Boolean(row.companyName?.trim()))
          .map(
            (row): ShopCarCompany => ({
              _id: row._id,
              companyName: row.companyName,
              brandLogo: row.brandLogo,
              logoUrl: row.logoUrl,
            })
          )
          .sort((a, b) =>
            getCarBrandName(a).localeCompare(getCarBrandName(b), undefined, { sensitivity: "base" })
          );
        setBrands(catalog);
      } catch {
        if (!cancelled) setBrands([]);
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleBrandSelect = useCallback((brand: ShopCarCompany) => {
    setSelectedBrand(brand);
    setExpandedShopId(null);
    setStatusMessage(null);
    setSentServiceKeys({});
    setConnectingServiceKey(null);
  }, []);

  const handleExpandShop = useCallback((shopId: string) => {
    setExpandedShopId(shopId);
    setStatusMessage(null);
  }, []);

  const handleCollapseShop = useCallback(() => {
    setExpandedShopId(null);
    setStatusMessage(null);
  }, []);

  const handleConnect = useCallback(
    async (serviceId: string, serviceName: string) => {
      setStatusMessage(null);

      if (!expandedShopId) {
        setStatusMessage("Select a shop from the list.");
        return;
      }
      if (!token) {
        setStatusMessage("You are not signed in.");
        return;
      }

      const shop = shops.find((item) => item.id === expandedShopId);
      if (!shop) {
        setStatusMessage("Selected shop could not be found.");
        return;
      }

      if (!isCarOwnerShopOpenToday(shop)) {
        setStatusMessage("This shop is closed right now.");
        return;
      }

      const requestKey = ownerShopServiceRequestKey(expandedShopId, serviceId, serviceName);
      setConnectingServiceKey(requestKey);
      try {
        const res = await postJson<{ success?: boolean; message?: string }>(
          "/api/user/connect-autoshopowner",
          { businessId: expandedShopId, serviceId },
          token
        );
        if (!res.ok || res.data?.success === false) {
          setStatusMessage(res.data?.message ?? "Could not connect to this service.");
          return;
        }
        setSentServiceKeys((prev) => ({ ...prev, [requestKey]: true }));
        setStatusMessage(res.data?.message ?? `Request sent to ${shop.name}!`);
      } catch {
        setStatusMessage("Network error while connecting.");
      } finally {
        setConnectingServiceKey(null);
      }
    },
    [expandedShopId, shops, token]
  );

  const headerTitle = selectedBrand
    ? `${brandLabel} - ${serviceLabel} Shops near by`
    : "Select Vehicle Make";

  return (
    <div className={`${shopMainContentShellClass} ${shopMainContentFillClass} bg-white`}>
      <OwnerPanelSectionHeader title={headerTitle} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {!selectedBrand ? (
          <OwnerVehicleMakeGrid brands={brands} loading={brandsLoading} onSelect={handleBrandSelect} />
        ) : expandedShop ? (
          <DashboardPanelCard variant="form" className="m-2 mb-0 flex min-h-0 flex-1 flex-col">
            <OwnerShopExpandedPanel
              shop={expandedShop}
              connectingServiceKey={connectingServiceKey}
              sentServiceKeys={sentServiceKeys}
              statusMessage={statusMessage}
              isFavorite={expandedShop.isFavorite}
              favoriteBusy={favoriteBusyId === expandedShop.id}
              onToggleFavorite={() => void handleToggleFavorite(expandedShop.id)}
              onCollapse={handleCollapseShop}
              onConnect={(serviceId, serviceName) => void handleConnect(serviceId, serviceName)}
              onRated={() => void refresh()}
            />
          </DashboardPanelCard>
        ) : shopsLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
          </div>
        ) : shopsError ? (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-semibold text-gray-800">{shopsError}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : shopsWithFavorites.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
            No shops found for {brandLabel} and {serviceLabel} in your area yet.
          </div>
        ) : (
          <div className="flex flex-col">
            {shopsWithFavorites.map((shop) => (
              <OwnerDashboardShopRow key={shop.id} shop={shop} onExpand={() => handleExpandShop(shop.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
