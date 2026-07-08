import { useState, type ComponentType } from "react";
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
import { isCarOwnerShopOpenToday } from "../../lib/carOwnerAutoShops";
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
};

export default function OwnerShopExpandedPanel({
  shop,
  connectingServiceKey,
  sentServiceKeys,
  statusMessage,
  onCollapse,
  onConnect,
}: OwnerShopExpandedPanelProps) {
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
    <>
      <div className="flex items-start gap-4 border-b border-ad-form-border pb-4">
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

      <div className="grid gap-5 pt-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
          <p className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
            <FiMapPin size={15} className="text-ad-purple" />
            Contact Info :
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
                <span>Specilist of Car Brands</span>
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
              const requestKey = ownerShopServiceRequestKey(shop.id, service.id, service.name);
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
          className={`border-t border-ad-form-border pt-3 text-center text-xs font-semibold ${
            statusMessage.includes("sent") || statusMessage.includes("Connected") || statusMessage.includes("Request")
              ? "text-ad-green"
              : "text-red-600"
          }`}
        >
          {statusMessage}
        </p>
      ) : null}
    </>
  );
}
