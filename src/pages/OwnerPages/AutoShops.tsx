import { Link } from "react-router";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  FiChevronDown,
  FiClock,
  FiExternalLink,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiStar,
  FiTool,
} from "react-icons/fi";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import OwnerVehiclePlateSidebar from "../../components/owner/OwnerVehiclePlateSidebar";
import { postJson } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { useCarOwnerAutoShops } from "../../hooks/useCarOwnerAutoShops";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";
import { isCarOwnerShopOpenToday } from "../../lib/carOwnerAutoShops";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import type { CarOwnerAutoShopListItem } from "../../types/carOwnerAutoShops";

const SELECT_VEHICLE_PROMPT = "Choose a vehicle from the sidebar to find matching auto shops.";

function TypingText({ text, className = "" }: { text: string; className?: string }) {
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    setCharIndex(0);
  }, [text]);

  useEffect(() => {
    if (charIndex >= text.length) return;

    const timer = window.setTimeout(() => setCharIndex((index) => index + 1), 42);
    return () => window.clearTimeout(timer);
  }, [charIndex, text]);

  const isComplete = charIndex >= text.length;

  return (
    <p className={className}>
      {text.slice(0, charIndex)}
      {!isComplete ? (
        <span className="ml-0.5 inline-block animate-pulse text-ad-purple" aria-hidden>
          |
        </span>
      ) : null}
    </p>
  );
}

function mapsUrl(shop: CarOwnerAutoShopListItem): string | null {
  if (shop.mapLat != null && shop.mapLng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${shop.mapLat},${shop.mapLng}`;
  }
  const addr = shop.address.trim();
  if (addr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }
  return null;
}

function websiteUrl(shop: CarOwnerAutoShopListItem): string | null {
  const raw = shop.website.trim();
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function CompactStarRating({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(0, rating));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          size={14}
          className={star <= Math.round(clamped) ? "fill-blue-500 text-blue-500" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

function ContactActionButton({
  href,
  disabled,
  label,
  icon: Icon,
}: {
  href?: string;
  disabled?: boolean;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  const className =
    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-ad-green/40 hover:bg-ad-green-light/30 disabled:cursor-not-allowed disabled:opacity-50";

  if (disabled || !href) {
    return (
      <span className={className} aria-disabled>
        <Icon size={14} className="shrink-0 text-gray-400" />
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={href.startsWith("tel:") ? undefined : "_blank"}
      rel={href.startsWith("tel:") ? undefined : "noopener noreferrer"}
      className={className}
    >
      <Icon size={14} className="shrink-0 text-ad-green-dark" />
      {label}
    </a>
  );
}

function ShopListRow({
  shop,
  onExpand,
}: {
  shop: CarOwnerAutoShopListItem;
  onExpand: () => void;
}) {
  const openToday = isCarOwnerShopOpenToday(shop);
  const logoUri = normalizeMediaUrl(shop.logoUrl);
  const phone = shop.phone.trim();

  return (
    <button
      type="button"
      onClick={onExpand}
      className="mb-3 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#b2e0a0] bg-gradient-to-r from-[#e8ffe8] to-[#f4fff0] px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-ad-green hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ad-purple/40"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white bg-white shadow-sm ring-1 ring-gray-200/80">
        {logoUri ? <img src={logoUri} alt="" className="h-full w-full object-cover" /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-900">{shop.name}</p>
        <p className="truncate text-sm text-blue-600">{phone || "Phone not listed"}</p>
      </div>

      <span
        className={`shrink-0 rounded-full px-4 py-1 text-xs font-bold text-white shadow-sm ${
          openToday ? "bg-ad-green" : "bg-gray-400"
        }`}
      >
        {openToday ? "Open" : "Closed"}
      </span>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-2xl font-bold leading-none text-ad-purple">
        <FiPlus aria-hidden />
      </span>
    </button>
  );
}

function serviceRequestKey(shopId: string, serviceId: string, serviceName: string): string {
  return `${shopId}:${serviceId}:${serviceName}`;
}

function ShopExpandedPanel({
  shop,
  connectingServiceKey,
  sentServiceKeys,
  statusMessage,
  onCollapse,
  onConnect,
}: {
  shop: CarOwnerAutoShopListItem;
  connectingServiceKey: string | null;
  sentServiceKeys: Record<string, boolean>;
  statusMessage: string | null;
  onCollapse: () => void;
  onConnect: (serviceId: string, serviceName: string) => void;
}) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);

  const openToday = isCarOwnerShopOpenToday(shop);
  const phone = shop.phone.trim();
  const directions = mapsUrl(shop);
  const website = websiteUrl(shop);
  const hoursText = shop.openHoursText?.trim() || shop.timing || "Hours not listed";
  const addressLine = [shop.address, shop.city].filter(Boolean).join(", ") || "Address not available";
  const carBrands = shop.carCompanies;
  const services = shop.mainServiceItems;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#9fd48f] bg-gradient-to-br from-[#e8ffe8] via-[#f0fff4] to-white shadow-lg ring-1 ring-white/80">
      <div className="flex items-start gap-4 border-b border-[#b2e0a0]/70 bg-white/40 px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-gray-900">{shop.name}</p>
          <p className="mt-0.5 text-sm font-medium text-blue-600">{phone || "Phone not listed"}</p>
          {shop.city ? <p className="mt-1 text-xs text-gray-500">{shop.city}</p> : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${
              openToday ? "bg-ad-green" : "bg-gray-400"
            }`}
          >
            {openToday ? "Open" : "Closed"}
          </span>
          <CompactStarRating rating={shop.rating} />
        </div>

        <button
          type="button"
          onClick={onCollapse}
          aria-label="Close shop details"
          className="flex h-9 w-9 shrink-0 rotate-45 items-center justify-center rounded-full bg-white/80 text-2xl font-bold leading-none text-ad-purple shadow-sm ring-1 ring-ad-purple/20 transition-colors hover:bg-white"
        >
          <FiPlus aria-hidden />
        </button>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
          <p className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
            <FiMapPin size={15} className="text-ad-purple" />
            Contact Info
          </p>

          <div className="space-y-3">
            <div>
              <button
                type="button"
                onClick={() => setHoursOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-ad-green/30"
              >
                <span className="flex items-center gap-2">
                  <FiClock size={15} className="text-ad-green-dark" />
                  Open Hours
                </span>
                <FiChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform ${hoursOpen ? "rotate-180" : ""}`}
                />
              </button>
              {hoursOpen ? (
                <div className="mt-2 rounded-lg border border-gray-100 bg-white px-3 py-2.5 text-xs leading-relaxed text-gray-700 shadow-inner">
                  <p>{hoursText}</p>
                  {shop.openDaysText ? <p className="mt-1 text-ad-green-dark">Open: {shop.openDaysText}</p> : null}
                  {shop.closedScheduleText ? (
                    <p className="mt-1 text-gray-500">Closed: {shop.closedScheduleText}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-gray-700 shadow-sm">
              <span className="font-semibold text-gray-900">Contact :</span> {addressLine}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setBrandsOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-ad-green/30"
              >
                <span>Specialist of Car Brands</span>
                <FiChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform ${brandsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {brandsOpen ? (
                <div className="mt-2 rounded-lg border border-gray-100 bg-white px-3 py-3 shadow-inner">
                  {carBrands.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {carBrands.map((brand) => (
                        <span
                          key={brand}
                          className="rounded-full border border-ad-green/30 bg-ad-green-light/60 px-3 py-1 text-xs font-semibold text-ad-green-dark"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No car brands listed for this shop yet.</p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex gap-2 pt-1">
              <ContactActionButton
                href={openToday && phone ? `tel:${phone.replace(/\s/g, "")}` : undefined}
                disabled={!openToday || !phone}
                label="Call"
                icon={FiPhone}
              />
              <ContactActionButton
                href={openToday && directions ? directions : undefined}
                disabled={!openToday || !directions}
                label="Directions"
                icon={FiMapPin}
              />
              <ContactActionButton
                href={openToday && website ? website : undefined}
                disabled={!openToday || !website}
                label="Website"
                icon={FiExternalLink}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
            <FiTool size={15} className="text-ad-purple" />
            Services Offered
          </p>
          <div className="space-y-2.5">
            {services.map((service) => {
              const requestKey = serviceRequestKey(shop.id, service.id, service.name);
              const sent = Boolean(sentServiceKeys[requestKey]);
              const canConnect = openToday && Boolean(service.id);
              const busy = connectingServiceKey === requestKey;

              return (
                <div
                  key={requestKey}
                  className="flex items-center gap-3 rounded-xl border border-[#b2e0a0] bg-white px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ad-green/20 bg-ad-green-light/40">
                    <FiTool size={16} className="text-ad-green-dark" />
                  </div>
                  <p className="min-w-0 flex-1 text-sm font-semibold text-ad-green-dark">{service.name}</p>
                  <button
                    type="button"
                    disabled={!canConnect || busy || sent}
                    onClick={() => onConnect(service.id, service.name)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm transition-all disabled:cursor-not-allowed ${
                      sent
                        ? "bg-gray-300 text-gray-600"
                        : "bg-ad-green text-white hover:bg-ad-green-dark hover:shadow disabled:opacity-50"
                    }`}
                  >
                    {sent ? "Request sent" : busy ? "Connecting…" : "Connect"}
                  </button>
                </div>
              );
            })}
            {services.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white/60 px-3 py-4 text-center text-sm text-gray-500">
                This shop has not listed any services yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {statusMessage ? (
        <p
          className={`border-t border-[#b2e0a0]/60 px-4 py-3 text-center text-xs font-semibold sm:px-5 ${
            statusMessage.includes("sent") || statusMessage.includes("Connected") || statusMessage.includes("Request")
              ? "text-ad-green"
              : "text-red-600"
          }`}
        >
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}

export default function OwnerAutoShopsPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [connectingServiceKey, setConnectingServiceKey] = useState<string | null>(null);
  const [sentServiceKeys, setSentServiceKeys] = useState<Record<string, boolean>>({});

  const shopFilters = useMemo(
    () => ({
      serviceIds: [] as string[],
      shopType: "autoShops" as const,
    }),
    []
  );

  const { shops, loading, error, refresh } = useCarOwnerAutoShops(shopFilters);
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useCarOwnerVehicles();

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  const expandedShop = shops.find((s) => s.id === expandedShopId) ?? null;

  const vehicleMakeLabel = useMemo(() => {
    const make = selectedVehicle?.make?.name?.trim();
    if (make) return make;
    const plate = selectedVehicle?.licensePlateNo?.trim().toUpperCase();
    if (plate) return plate;
    return "Your vehicle";
  }, [selectedVehicle]);

  const showShopList = Boolean(selectedVehicleId);

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicleId((prev) => (prev === vehicleId ? null : vehicleId));
    setExpandedShopId(null);
    setStatusMessage(null);
    setSentServiceKeys({});
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

      if (!selectedVehicleId) {
        setStatusMessage("Select a vehicle from the sidebar first.");
        return;
      }
      if (!expandedShopId) {
        setStatusMessage("Select a shop from the list.");
        return;
      }
      if (!token) {
        setStatusMessage("You are not signed in.");
        return;
      }

      const shop = shops.find((s) => s.id === expandedShopId);
      if (!shop) {
        setStatusMessage("Selected shop could not be found.");
        return;
      }

      if (!isCarOwnerShopOpenToday(shop)) {
        setStatusMessage("This shop is closed right now.");
        return;
      }

      const requestKey = serviceRequestKey(expandedShopId, serviceId, serviceName);
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
    [expandedShopId, selectedVehicleId, shops, token]
  );

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Auto Shops | AutoDaddy" description="Find auto shops near you" />

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
        <aside className="relative flex w-full shrink-0 flex-col gap-3 overflow-visible lg:w-[220px] xl:w-[260px] lg:min-h-[calc(100vh-220px)]">
          <h2 className="px-1 text-2xl font-semibold text-gray-400">Auto Repair Shops</h2>

          <OwnerVehiclePlateSidebar
            vehicles={vehicles}
            loading={vehiclesLoading}
            selectedVehicleId={selectedVehicleId}
            onSelect={handleVehicleSelect}
          />

          <button
            type="button"
            onClick={() => setFaqsOpen(true)}
            className="mt-auto rounded-full border border-red-700 bg-red-600 px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700"
          >
            FAQs
          </button>
        </aside>

        <div className="flex min-h-[420px] flex-1 flex-col">
          {selectedVehicleId ? (
            <p className="mb-4 text-center text-base font-semibold text-blue-600">
              Auto Repair Shop - {vehicleMakeLabel}
            </p>
          ) : null}

          {vehiclesLoading ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
            </div>
          ) : vehiclesError ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-red-600">
              {vehiclesError}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              <p>Add a vehicle before finding auto shops.</p>
              <Link
                to="/owner/vehicles"
                className="rounded-lg bg-ad-purple px-4 py-2 text-sm font-bold text-white hover:bg-ad-purple-dark"
              >
                Add vehicle
              </Link>
            </div>
          ) : !selectedVehicleId ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-center">
              <TypingText
                text={SELECT_VEHICLE_PROMPT}
                className="max-w-md text-sm text-gray-600 md:text-base"
              />
            </div>
          ) : !showShopList ? null : loading ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-gray-800">{error}</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : shops.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              No auto repair shops found in your area yet.
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-y-auto px-1 pb-2">
              {expandedShop ? (
                <ShopExpandedPanel
                  shop={expandedShop}
                  connectingServiceKey={connectingServiceKey}
                  sentServiceKeys={sentServiceKeys}
                  statusMessage={statusMessage}
                  onCollapse={handleCollapseShop}
                  onConnect={(serviceId, serviceName) => void handleConnect(serviceId, serviceName)}
                />
              ) : (
                shops.map((shop) => (
                  <ShopListRow key={shop.id} shop={shop} onExpand={() => handleExpandShop(shop.id)} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={() => setFaqsOpen(false)}
        heading={faqsHeading}
        description={faqsDescription}
      />
    </PortalPageContent>
  );
}
