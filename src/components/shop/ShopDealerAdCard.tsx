import { FiExternalLink, FiMapPin, FiPhone } from "react-icons/fi";
import type { ComponentType, MouseEvent } from "react";

type ShopDealerAdCardProps = {
  imageUrl?: string;
  imageAlt: string;
  title: string;
  location: string;
  phone?: string;
  website?: string;
  directionsUrl?: string;
  tagline: string;
  className?: string;
  onClick?: () => void;
};

function AdIconButton({
  href,
  label,
  icon: Icon,
  accent,
  onClick,
}: {
  href?: string | null;
  label: string;
  icon: ComponentType<{
    className?: string;
    size?: number;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  accent?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const icon = <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />;

  if (!href) {
    return (
      <span
        className={accent ? "text-[#008000]/40" : "text-gray-400"}
        aria-disabled
        aria-label={label}
      >
        {icon}
      </span>
    );
  }

  const isTel = href.startsWith("tel:");

  return (
    <a
      href={href}
      target={isTel ? undefined : "_blank"}
      rel={isTel ? undefined : "noopener noreferrer"}
      aria-label={label}
      onClick={onClick}
      className={`transition-colors hover:text-ad-purple ${
        accent ? "text-[#008000]" : "text-gray-800"
      }`}
    >
      {icon}
    </a>
  );
}

export default function ShopDealerAdCard({
  imageUrl,
  imageAlt,
  title,
  location,
  phone,
  website,
  directionsUrl,
  tagline,
  className = "",
  onClick,
}: ShopDealerAdCardProps) {
  const hasPhoto = Boolean(imageUrl?.trim());
  const phoneDigits = phone?.replace(/\D/g, "") ?? "";
  const websiteHref = website?.trim()
    ? website.startsWith("http")
      ? website
      : `https://${website}`
    : null;
  const mapsHref =
    directionsUrl?.trim() ||
    (location && location !== "—"
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      : null);

  const fillHeight = className.includes("h-full");

  return (
    <article
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`flex w-full flex-col overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-lg ${
        onClick ? "cursor-pointer transition-shadow hover:shadow-xl" : ""
      } ${fillHeight ? "h-full min-h-0" : ""} ${className}`}
    >
      <div
        className={`w-full shrink-0 overflow-hidden bg-gray-100 ${
          fillHeight ? "min-h-[140px] flex-1" : "aspect-[3/4]"
        }`}
      >
        {hasPhoto ? (
          <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className={`flex h-full items-center justify-center px-3 ${fillHeight ? "" : "min-h-[180px]"}`}>
            <p className="text-center text-xs font-bold leading-snug text-[#008000] sm:text-sm">{title}</p>
          </div>
        )}
      </div>

      <div className="shrink-0 bg-[#008000] px-2 py-1.5 text-center text-[10px] font-bold leading-tight text-white sm:px-3 sm:py-2.5 sm:text-xs lg:text-[10px] xl:text-xs">
        {title}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1.5 bg-white px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-3">
        <div className="w-full bg-[#d4ffd4] px-2 py-1 text-center text-[10px] font-bold leading-tight text-[#008000] sm:px-3 sm:py-1.5 sm:text-xs lg:text-[10px] xl:text-xs">
          {location}
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-4 sm:gap-8">
          <AdIconButton
            href={phoneDigits ? `tel:${phoneDigits}` : null}
            label="Call"
            icon={FiPhone}
            onClick={(e) => e.stopPropagation()}
          />
          <AdIconButton
            href={websiteHref}
            label="Website"
            icon={FiExternalLink}
            accent
            onClick={(e) => e.stopPropagation()}
          />
          <AdIconButton
            href={mapsHref}
            label="Directions"
            icon={FiMapPin}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="w-full border border-gray-300 bg-white px-2 py-1 text-center text-[9px] font-semibold leading-snug text-[#008000] sm:px-3 sm:py-2 sm:text-[11px] lg:text-[9px] xl:text-[11px]">
          {tagline}
        </div>
      </div>
    </article>
  );
}
