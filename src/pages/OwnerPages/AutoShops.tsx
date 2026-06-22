import { useCallback, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  FiChevronDown,
  FiClock,
  FiExternalLink,
  FiHeart,
  FiMapPin,
  FiPhone,
  FiStar,
  FiTool,
} from "react-icons/fi";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import { CompactFormPanel } from "../../components/admin/ContentPanel";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import OwnerServiceSidebar from "../../components/owner/OwnerServiceSidebar";
import { postJson } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { useCarOwnerAutoShops } from "../../hooks/useCarOwnerAutoShops";
import { useCarOwnerFavoriteShops } from "../../hooks/useCarOwnerFavoriteShops";
import { useCarOwnerDashboard, useCarOwnerServiceSidebar, type ServiceCategory } from "../../hooks/useOwnerPortal";
import { isCarOwnerShopOpenToday } from "../../lib/carOwnerAutoShops";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import type { CarOwnerAutoShopListItem } from "../../types/carOwnerAutoShops";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const clamped = Math.min(5, Math.max(0, rating));
  const starSize = size === "md" ? 16 : 14;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={starSize}
            className={star <= Math.round(clamped) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
          />
        ))}
      </div>
      {clamped > 0 ? (
        <span className={`font-semibold text-amber-700 ${size === "md" ? "text-sm" : "text-xs"}`}>
          {clamped.toFixed(1)}
        </span>
      ) : (
        <span className="text-xs text-gray-500">No ratings yet</span>
      )}
    </div>
  );
}

function DetailCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm ${className}`}
    >
      <div className="mb-2.5 flex items-center gap-2">
        {Icon ? <Icon size={15} className="shrink-0 text-ad-purple" /> : null}
        <p className="text-xs font-bold uppercase tracking-wide text-ad-green-dark">{title}</p>
      </div>
      {children}
    </div>
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

function ActionButton({
  href,
  disabled,
  icon: Icon,
  label,
}: {
  href?: string;
  disabled?: boolean;
  icon: ComponentType<{ size?: number }>;
  label: string;
}) {
  const base =
    "inline-flex min-w-[7rem] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all sm:flex-none";

  if (disabled || !href) {
    return (
      <span className={`${base} cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-400`}>
        <Icon size={15} />
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={href.startsWith("tel:") ? undefined : "_blank"}
      rel={href.startsWith("tel:") ? undefined : "noopener noreferrer"}
      className={`${base} border border-ad-green-dark/30 bg-white text-ad-green-dark shadow-sm hover:-translate-y-0.5 hover:border-ad-green hover:bg-ad-green-light hover:shadow-md`}
    >
      <Icon size={15} />
      {label}
    </a>
  );
}

function ShopDetails({ shop, openToday }: { shop: CarOwnerAutoShopListItem; openToday: boolean }) {
  const directions = mapsUrl(shop);
  const website = websiteUrl(shop);
  const phone = shop.phone.trim();
  const services =
    shop.mainServiceItems.length > 0
      ? shop.mainServiceItems.map((s) => s.name)
      : shop.mainServices;
  const hoursText = shop.openHoursText?.trim() || shop.timing;

  return (
    <div className="mt-5 space-y-4 border-t border-ad-form-border/70 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-white/90 to-ad-green-light/40 px-4 py-3 shadow-sm ring-1 ring-white/60">
        <StarRating rating={shop.rating} size="md" />
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
            openToday ? "bg-ad-green text-white" : "bg-gray-400 text-white"
          }`}
        >
          {openToday ? "Open today" : "Closed today"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Open hours" icon={FiClock}>
          <p className="text-sm leading-relaxed text-gray-800">{hoursText || "Hours not listed"}</p>
          {shop.openDaysText ? (
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              <span className="font-semibold text-ad-green-dark">Open:</span> {shop.openDaysText}
            </p>
          ) : null}
          {shop.closedScheduleText ? (
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              <span className="font-semibold text-gray-500">Closed:</span> {shop.closedScheduleText}
            </p>
          ) : null}
        </DetailCard>

        <DetailCard title="Services" icon={FiTool}>
          {services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {services.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-ad-form-border bg-ad-form-required-bg/60 px-3 py-1 text-xs font-semibold text-ad-green-dark"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Services not listed.</p>
          )}
          {shop.subServices.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {shop.subServices.map((name) => (
                <span
                  key={name}
                  className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : null}
        </DetailCard>
      </div>

      <DetailCard title="Contact & location" icon={FiMapPin}>
        <p className="text-sm leading-relaxed text-gray-800">{shop.address || "Address not available"}</p>
        {shop.city && !shop.address.toLowerCase().includes(shop.city.toLowerCase()) ? (
          <p className="mt-1 text-sm text-gray-600">{shop.city}</p>
        ) : null}
        {phone ? <p className="mt-2 text-sm font-medium text-ad-purple">{phone}</p> : null}
      </DetailCard>

      <div className="flex flex-wrap gap-3 pt-1">
        <ActionButton
          href={openToday && phone ? `tel:${phone.replace(/\s/g, "")}` : undefined}
          disabled={!openToday || !phone}
          icon={FiPhone}
          label={openToday ? "Call" : "Call (closed)"}
        />
        <ActionButton
          href={openToday && directions ? directions : undefined}
          disabled={!openToday || !directions}
          icon={FiMapPin}
          label={openToday ? "Directions" : "Directions (closed)"}
        />
        <ActionButton
          href={openToday && website ? website : undefined}
          disabled={!openToday || !website}
          icon={FiExternalLink}
          label={openToday ? "Website" : "Website (closed)"}
        />
      </div>
    </div>
  );
}

function ShopRow({
  shop,
  expanded,
  isFavorite,
  onToggleExpand,
  onToggleFavorite,
}: {
  shop: CarOwnerAutoShopListItem;
  expanded: boolean;
  isFavorite: boolean;
  onToggleExpand: () => void;
  onToggleFavorite: () => void;
}) {
  const openToday = isCarOwnerShopOpenToday(shop);
  const logoUri = normalizeMediaUrl(shop.logoUrl);

  return (
    <div className="pb-6">
      <CompactFormPanel
        className={`!mb-0 overflow-hidden transition-all duration-300 ${
          expanded
            ? "shadow-lg ring-2 ring-ad-purple/35 border-ad-purple/25"
            : "shadow-sm hover:shadow-md"
        }`}
      >
        <div className={`flex items-center gap-3 ${expanded ? "pb-1" : ""}`}>
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            className="group flex min-w-0 flex-1 items-center gap-4 text-left"
          >
            <div
              className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-white shadow-md transition-all duration-300 ${
                expanded
                  ? "h-16 w-16 border-ad-purple/30"
                  : "h-12 w-12 border-ad-form-border group-hover:border-ad-green-dark/40"
              }`}
            >
              {logoUri ? (
                <img src={logoUri} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-ad-green-dark">Shop</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`truncate font-bold text-gray-900 transition-colors ${
                  expanded ? "text-base text-ad-purple" : "text-sm group-hover:text-ad-green-dark"
                }`}
              >
                {shop.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-gray-600">
                {[shop.city, shop.address].filter(Boolean).join(" · ") || "Address not listed"}
              </p>
              {expanded && shop.rating > 0 ? (
                <div className="mt-1.5 sm:hidden">
                  <StarRating rating={shop.rating} />
                </div>
              ) : null}
            </div>

            {!expanded ? (
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  openToday ? "bg-ad-green text-white" : "bg-gray-400 text-white"
                }`}
              >
                {openToday ? "Open" : "Closed"}
              </span>
            ) : null}

            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                expanded ? "bg-ad-purple/10 text-ad-purple" : "bg-white/60 text-gray-600 group-hover:bg-white"
              }`}
            >
              <FiChevronDown
                className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                size={18}
                aria-hidden
              />
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={`shrink-0 rounded-full p-2.5 transition-all ${
              isFavorite
                ? "bg-red-50 text-red-500 shadow-sm hover:bg-red-100"
                : "text-gray-400 hover:bg-white hover:text-red-400"
            }`}
          >
            <FiHeart className={isFavorite ? "fill-current" : ""} size={18} />
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            {expanded ? <ShopDetails shop={shop} openToday={openToday} /> : null}
          </div>
        </div>
      </CompactFormPanel>
    </div>
  );
}

export default function OwnerAutoShopsPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();
  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();

  const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const shopFilters = useMemo(
    () => ({
      serviceIds: selectedService?.id ? [selectedService.id] : [],
      shopType: "autoShops" as const,
    }),
    [selectedService]
  );

  const { shops, loading, error, refresh } = useCarOwnerAutoShops(shopFilters);
  const { isFavorite, toggleFavorite } = useCarOwnerFavoriteShops();

  const expandedShop = shops.find((s) => s.id === expandedShopId) ?? null;

  const handleServiceSelect = useCallback((service: ServiceCategory) => {
    setSelectedService((prev) => (prev?.id === service.id ? null : service));
    setExpandedShopId(null);
    setStatusMessage(null);
  }, []);

  const handleToggleShop = useCallback((shopId: string) => {
    setExpandedShopId((prev) => (prev === shopId ? null : shopId));
    setStatusMessage(null);
  }, []);

  const handleSend = useCallback(async () => {
    setStatusMessage(null);

    if (!selectedService?.id) {
      setStatusMessage("Select a service from the sidebar first.");
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
    if (shop && !isCarOwnerShopOpenToday(shop)) {
      setStatusMessage("This shop is closed right now.");
      return;
    }

    setSending(true);
    try {
      const res = await postJson<{ success?: boolean; message?: string }>(
        "/api/user/connect-autoshopowner",
        { businessId: expandedShopId, serviceId: selectedService.id },
        token
      );
      if (!res.ok || res.data?.success === false) {
        setStatusMessage(res.data?.message ?? "Could not send your request.");
        return;
      }
      setStatusMessage(res.data?.message ?? `Request sent to ${shop?.name ?? "the shop"}!`);
    } catch {
      setStatusMessage("Network error while sending.");
    } finally {
      setSending(false);
    }
  }, [expandedShopId, selectedService, shops, token]);

  const showShopList = Boolean(selectedService?.id);

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Auto Shops | AutoDaddy" description="Find auto shops near you" />

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
        <OwnerServiceSidebar
          indoor={indoor}
          outdoor={outdoor}
          loading={servicesLoading}
          selectedServiceId={selectedService?.id ?? null}
          onServiceSelect={handleServiceSelect}
          onFaqsClick={() => setFaqsOpen(true)}
        />

        <div className="flex min-h-[420px] flex-1 flex-col">
          {!showShopList ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              Choose an indoor or outdoor service to see matching auto shops.
            </div>
          ) : loading ? (
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
              No auto shops offer {selectedService?.name ?? "this service"} in your area yet.
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="flex flex-1 flex-col overflow-y-auto px-1 pb-2 pt-1">
                {shops.map((shop) => (
                  <ShopRow
                    key={shop.id}
                    shop={shop}
                    expanded={expandedShopId === shop.id}
                    isFavorite={isFavorite(shop.id)}
                    onToggleExpand={() => handleToggleShop(shop.id)}
                    onToggleFavorite={() => void toggleFavorite(shop.id)}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-col items-end gap-2 border-t border-gray-200 bg-white/50 px-1 pt-4">
                {expandedShop ? (
                  <p className="w-full text-center text-xs text-gray-600 sm:text-right">
                    Sending to: <span className="font-bold text-ad-purple">{expandedShop.name}</span>
                  </p>
                ) : null}
                {statusMessage ? (
                  <p
                    className={`w-full text-center text-xs font-semibold sm:text-right ${
                      statusMessage.includes("sent") || statusMessage.includes("Connected")
                        ? "text-ad-green"
                        : "text-red-600"
                    }`}
                  >
                    {statusMessage}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || !expandedShopId}
                  className="rounded-lg bg-ad-green px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-ad-green-dark hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send >>"}
                </button>
              </div>
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
