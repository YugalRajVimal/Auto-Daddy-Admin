import { useEffect, useState, type ComponentType } from "react";
import {
  FiChevronDown,
  FiClock,
  FiExternalLink,
  FiHeart,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiStar,
  FiTool,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../../auth";
import { isCarOwnerShopOpenToday } from "../../lib/carOwnerAutoShops";
import { rateCarOwnerAutoShop } from "../../lib/carOwnerRateShop";
import type { CarOwnerAutoShopListItem } from "../../types/carOwnerAutoShops";

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

function CompactStarRating({
  rating,
  busy,
  onRate,
}: {
  rating: number;
  busy?: boolean;
  onRate?: (value: number) => void;
}) {
  const clamped = Math.min(5, Math.max(0, rating));
  const interactive = Boolean(onRate);
  return (
    <div className="flex items-center gap-0.5" role={interactive ? "group" : undefined} aria-label="Shop rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(clamped);
        if (!interactive) {
          return (
            <FiStar
              key={star}
              size={14}
              className={filled ? "fill-amber-400 text-amber-400" : "text-slate-300"}
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            disabled={busy}
            aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
            onClick={() => onRate?.(star)}
            className="rounded p-0.5 transition hover:scale-110 disabled:opacity-50"
          >
            <FiStar
              size={14}
              className={filled ? "fill-amber-400 text-amber-400" : "text-slate-300"}
            />
          </button>
        );
      })}
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
    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-sky-200 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50";

  if (disabled || !href) {
    return (
      <span className={className} aria-disabled>
        <Icon size={14} className="shrink-0 text-slate-400" />
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
      <Icon size={14} className="shrink-0 text-sky-700" />
      {label}
    </a>
  );
}

export function ownerShopServiceRequestKey(
  shopId: string,
  serviceId: string,
  serviceName: string
): string {
  return `${shopId}:${serviceId}:${serviceName}`;
}

type OwnerShopExpandedPanelProps = {
  shop: CarOwnerAutoShopListItem;
  connectingServiceKey: string | null;
  sentServiceKeys: Record<string, boolean>;
  statusMessage: string | null;
  onCollapse: () => void;
  onConnect: (serviceId: string, serviceName: string) => void;
  isFavorite?: boolean;
  favoriteBusy?: boolean;
  onToggleFavorite?: () => void;
  onRated?: (rating: number) => void;
};

export default function OwnerShopExpandedPanel({
  shop,
  connectingServiceKey,
  sentServiceKeys,
  statusMessage,
  onCollapse,
  onConnect,
  isFavorite = false,
  favoriteBusy = false,
  onToggleFavorite,
  onRated,
}: OwnerShopExpandedPanelProps) {
  const { token } = useAuth();
  const [hoursOpen, setHoursOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [localRating, setLocalRating] = useState(shop.rating);
  const [ratingBusy, setRatingBusy] = useState(false);

  useEffect(() => {
    setLocalRating(shop.rating);
  }, [shop.id, shop.rating]);

  const openToday = isCarOwnerShopOpenToday(shop);
  const phone = shop.phone.trim();
  const directions = mapsUrl(shop);
  const website = websiteUrl(shop);
  const hoursText = shop.openHoursText?.trim() || shop.timing || "Hours not listed";
  const addressLine = [shop.address, shop.city].filter(Boolean).join(", ") || "Address not available";
  const carBrands = shop.carCompanies;
  const services = shop.mainServiceItems;

  const handleRate = async (rating: number) => {
    if (!token) {
      toast.error("Please log in again.");
      return;
    }
    setRatingBusy(true);
    const previous = localRating;
    setLocalRating(rating);
    const result = await rateCarOwnerAutoShop(token, shop.id, rating);
    setRatingBusy(false);
    if (!result.ok) {
      setLocalRating(previous);
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    onRated?.(rating);
  };

  return (
    <>
      <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold tracking-tight text-slate-900">{shop.name}</p>
          <p className="mt-0.5 text-sm font-medium text-sky-700">{phone || "Phone not listed"}</p>
          {shop.city ? <p className="mt-1 text-xs text-slate-500">{shop.city}</p> : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${
              openToday ? "bg-emerald-600" : "bg-slate-400"
            }`}
          >
            {openToday ? "Open" : "Closed"}
          </span>
          <div className="flex items-center gap-2">
            <CompactStarRating rating={localRating} busy={ratingBusy} onRate={(v) => void handleRate(v)} />
            {onToggleFavorite ? (
              <button
                type="button"
                disabled={favoriteBusy}
                onClick={onToggleFavorite}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
              >
                <FiHeart
                  size={16}
                  className={isFavorite ? "fill-rose-500 text-rose-500" : undefined}
                  aria-hidden
                />
              </button>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onCollapse}
          aria-label="Close shop details"
          className="flex size-9 shrink-0 rotate-45 items-center justify-center rounded-full bg-white text-xl font-bold leading-none text-ad-purple shadow-sm ring-1 ring-ad-purple/20 transition hover:bg-ad-bg-purple"
        >
          <FiPlus aria-hidden />
        </button>
      </div>

      <div className="grid gap-5 pt-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/80 bg-slate-50/60 p-4 shadow-sm ring-1 ring-black/5">
          <p className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <FiMapPin size={15} className="text-ad-purple" />
            Contact Info
          </p>

          <div className="space-y-3">
            <div>
              <button
                type="button"
                onClick={() => setHoursOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200"
              >
                <span className="flex items-center gap-2">
                  <FiClock size={15} className="text-sky-700" />
                  Open Hours
                </span>
                <FiChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${hoursOpen ? "rotate-180" : ""}`}
                />
              </button>
              {hoursOpen ? (
                <div className="mt-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-600">
                  <p>{hoursText}</p>
                  {shop.openDaysText ? <p className="mt-1 text-emerald-700">Open: {shop.openDaysText}</p> : null}
                  {shop.closedScheduleText ? (
                    <p className="mt-1 text-slate-500">Closed: {shop.closedScheduleText}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-700 shadow-sm">
              <span className="font-semibold text-slate-900">Contact :</span> {addressLine}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setBrandsOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200"
              >
                <span>Specialist of Car Brands</span>
                <FiChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${brandsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {brandsOpen ? (
                <div className="mt-2 rounded-xl border border-slate-100 bg-white px-3 py-3">
                  {carBrands.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {carBrands.map((brand) => (
                        <span
                          key={brand}
                          className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-100"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No car brands listed for this shop yet.</p>
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
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <FiTool size={15} className="text-ad-purple" />
            Services Offered
          </p>
          <div className="space-y-2.5">
            {services.map((service) => {
              const requestKey = ownerShopServiceRequestKey(shop.id, service.id, service.name);
              const sent = Boolean(sentServiceKeys[requestKey]);
              const canConnect = openToday && Boolean(service.id);
              const busy = connectingServiceKey === requestKey;

              return (
                <div
                  key={requestKey}
                  className="flex items-center gap-3 rounded-xl border border-white/80 bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ad-bg-purple text-ad-purple">
                    <FiTool size={16} />
                  </div>
                  <p className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{service.name}</p>
                  <button
                    type="button"
                    disabled={!canConnect || busy || sent}
                    onClick={() => onConnect(service.id, service.name)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed ${
                      sent
                        ? "bg-slate-200 text-slate-600"
                        : "bg-gradient-to-br from-ad-purple to-ad-purple-dark text-white hover:brightness-105 disabled:opacity-50"
                    }`}
                  >
                    {sent ? "Request sent" : busy ? "Connecting…" : "Connect"}
                  </button>
                </div>
              );
            })}
            {services.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-4 text-center text-sm text-slate-500">
                This shop has not listed any services yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {statusMessage ? (
        <p
          className={`border-t border-slate-100 pt-3 text-center text-xs font-semibold ${
            statusMessage.includes("sent") || statusMessage.includes("Connected") || statusMessage.includes("Request")
              ? "text-emerald-600"
              : "text-rose-600"
          }`}
        >
          {statusMessage}
        </p>
      ) : null}
    </>
  );
}
