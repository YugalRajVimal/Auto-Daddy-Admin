import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getJson, postJson } from "../../api/mobileAuth";
import CarBrandLogo from "../shop/CarBrandLogo";
import { OwnerTitleBar } from "./ownerUi";
import { OwnerShopListRow } from "./OwnerShopListRow";
import { useCarOwnerAutoShops } from "../../hooks/useCarOwnerAutoShops";
import { useCarOwnerFavoriteShops } from "../../hooks/useCarOwnerFavoriteShops";
import type { ServiceCategory } from "../../hooks/useOwnerPortal";
import { isCarOwnerShopOpenToday } from "../../lib/carOwnerAutoShops";
import { getCarBrandId, getCarBrandName } from "../../lib/dummyCarBrands";
import type { OwnerShopType } from "../../lib/serviceCatalog";
import type { ShopCarCompany } from "../shop/forms/ShopProfileEditors";
import OwnerShopExpandedPanel, { ownerShopServiceRequestKey } from "./OwnerShopExpandedPanel";
import { Skeleton } from "../common/Skeleton";

type OwnerDashboardServicePanelProps = {
  service: ServiceCategory;
  selectedSubServiceId?: string | null;
  token: string | null;
  /** « on the make grid (leave the service flow). */
  onExit?: () => void;
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
            className="group flex flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-ad-purple/50 hover:shadow-md"
          >
            <div className="flex h-24 w-full items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-3">
              <CarBrandLogo company={brand} className="max-h-16 max-w-full object-contain transition-transform group-hover:scale-105" />
            </div>
            <span className="border-t border-gray-200 py-2 text-center text-sm font-bold uppercase tracking-wide text-gray-800">{name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function OwnerDashboardServicePanel({
  service,
  selectedSubServiceId,
  token,
  onExit,
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
      const shop = shopsWithFavorites.find((s) => s.id === shopId);
      setFavoriteBusyId(shopId);
      const result = await toggleFavorite(shopId, shop?.isFavorite);
      setFavoriteBusyId(null);
      if (!result.ok) {
        toast.error(result.error ?? "Could not update favorite.");
        return;
      }
      toast.success(result.isFavorite ? "Added to favorites." : "Removed from favorites.");
    },
    [toggleFavorite, shopsWithFavorites]
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
    <div className="flex h-full min-h-0 flex-col">
      <OwnerTitleBar
        title={headerTitle}
        onPrev={
          expandedShop ? handleCollapseShop : selectedBrand ? () => setSelectedBrand(null) : onExit
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {!selectedBrand ? (
          <OwnerVehicleMakeGrid brands={brands} loading={brandsLoading} onSelect={handleBrandSelect} />
        ) : expandedShop ? (
          <div className="m-3 flex min-h-0 flex-1 flex-col rounded-2xl bg-[#d4fcd4] p-3 ring-1 ring-green-200 sm:m-4 sm:p-5">
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
          </div>
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
          <div className="flex flex-col gap-2 p-2 sm:p-3">
            {shopsWithFavorites.map((shop) => (
              <OwnerShopListRow key={shop.id} shop={shop} onExpand={() => handleExpandShop(shop.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
