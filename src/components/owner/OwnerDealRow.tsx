import { type ReactNode } from "react";
import { FiCalendar, FiHeart, FiPhone, FiTag } from "react-icons/fi";
import {
  dealDiscountPercent,
  dealKindLabel,
  dealTitle,
  isDealActive,
} from "../../lib/carOwnerDeals";
import { formatCurrencyAmount } from "../../lib/currency";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import type { CarOwnerDeal } from "../../types/carOwnerDeals";

type OwnerDealRowProps = {
  deal: CarOwnerDeal;
  vehicleLabel: string;
  countryCode?: string;
  onClick?: () => void;
  selected?: boolean;
};

function formatValidDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function cardHeading(deal: CarOwnerDeal, vehicleLabel: string): string {
  const kind = dealKindLabel(deal.dealType);
  if (kind === "Parts" && deal.selectedVehicle) {
    const v = deal.selectedVehicle;
    const parts = [v.year?.trim(), v.name?.trim(), v.model?.trim()].filter(Boolean);
    if (parts.length) return parts.join(" ");
    return deal.partName?.trim() || vehicleLabel;
  }
  return dealTitle(deal);
}

function dealSubtitle(deal: CarOwnerDeal): string | null {
  const kind = dealKindLabel(deal.dealType);
  if (kind === "Parts") {
    return deal.partName?.trim() || null;
  }
  return deal.serviceId?.desc?.trim() || null;
}

function isJustArrived(deal: CarOwnerDeal): boolean {
  const created = Date.parse(deal.createdAt);
  if (!Number.isFinite(created)) return false;
  const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

function shopPhone(deal: CarOwnerDeal): string | undefined {
  const c = deal.createdBy;
  return (
    c.phone ??
    c.businessPhone ??
    c.mobile ??
    c.contactPhone ??
    c.contactDetails?.phone ??
    c.contactDetails?.mobile
  );
}

function SpecPill({ icon: Icon, children }: { icon: typeof FiTag; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/70">
      <Icon size={12} className="shrink-0 text-slate-400" aria-hidden />
      {children}
    </span>
  );
}

export default function OwnerDealRow({
  deal,
  vehicleLabel,
  countryCode,
  onClick,
  selected = false,
}: OwnerDealRowProps) {
  const active = isDealActive(deal);
  const discount = dealDiscountPercent(deal);
  const kind = dealKindLabel(deal.dealType);
  const imageUri = normalizeMediaUrl(deal.imagePath);
  const discounted = formatCurrencyAmount(deal.discountedPrice, countryCode);
  const original =
    deal.originalPrice != null && deal.originalPrice > deal.discountedPrice
      ? formatCurrencyAmount(deal.originalPrice, countryCode)
      : null;
  const heading = cardHeading(deal, vehicleLabel);
  const subtitle = dealSubtitle(deal);
  const description = deal.description?.trim();
  const phone = shopPhone(deal)?.trim();
  const logoUri = normalizeMediaUrl(deal.createdBy.businessLogo);
  const shopCity = deal.createdBy.city?.trim().toUpperCase();
  const ribbonLabel = !active ? "ENDED" : isJustArrived(deal) ? "JUST ARRIVED" : "ACTIVE";

  const className = `group overflow-hidden rounded-2xl border bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.1)] ${
    selected
      ? "border-ad-purple/40 ring-ad-purple/25"
      : "border-white/80 ring-black/5 hover:ring-sky-100"
  }`;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {heading}
          </h3>
          {subtitle ? <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-xl border border-slate-200/80 bg-white p-2 text-slate-400 transition hover:border-ad-purple/30 hover:bg-ad-bg-purple/40 hover:text-ad-purple"
          aria-label="Save this deal"
          onClick={(e) => e.stopPropagation()}
        >
          <FiHeart size={18} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row">
        <div className="relative mx-4 mb-4 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200/60 sm:mx-0 sm:mb-0 sm:ml-5 sm:w-[220px] lg:w-[260px]">
          {imageUri ? (
            <img src={imageUri} alt="" className="aspect-[16/10] w-full object-cover sm:aspect-[4/3]" />
          ) : (
            <div className="flex aspect-[16/10] w-full items-center justify-center sm:aspect-[4/3]">
              <FiTag size={40} className="text-slate-300" aria-hidden />
            </div>
          )}
          <span
            className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow-sm ${
              !active
                ? "bg-slate-500"
                : isJustArrived(deal)
                  ? "bg-sky-600"
                  : "bg-emerald-600"
            }`}
          >
            {ribbonLabel}
          </span>
        </div>

        <div className="min-w-0 flex-1 px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{discounted}</p>
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
              {kind} deal
            </span>
            {original ? (
              <p className="text-sm text-slate-400 line-through">{original}</p>
            ) : null}
            {discount != null ? (
              <span className="text-sm font-bold text-emerald-600">-{discount}%</span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <SpecPill icon={FiCalendar}>Valid {formatValidDate(deal.offerEndsOnDate)}</SpecPill>
            <SpecPill icon={FiTag}>{kind}</SpecPill>
            {vehicleLabel ? <SpecPill icon={FiTag}>{vehicleLabel}</SpecPill> : null}
          </div>

          {description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600 sm:line-clamp-3">
              {description}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-slate-400">No description provided.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100/90 bg-gradient-to-b from-slate-50/40 to-white/80 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {logoUri ? (
            <img
              src={logoUri}
              alt=""
              className="size-9 shrink-0 rounded-xl border border-slate-200/80 object-cover"
            />
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-xs font-bold text-slate-500">
              {deal.createdBy.businessName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{deal.createdBy.businessName}</p>
            {shopCity ? <p className="truncate text-xs text-slate-500">{shopCity}</p> : null}
          </div>
        </div>

        {phone ? (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100"
            onClick={(e) => e.stopPropagation()}
          >
            <FiPhone size={14} aria-hidden />
            Contact
          </a>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} w-full text-left`}>
        {inner}
      </button>
    );
  }

  return <article className={className}>{inner}</article>;
}
