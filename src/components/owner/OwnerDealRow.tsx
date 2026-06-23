import { formatCurrencyAmount } from "../../lib/currency";
import { dealDiscountPercent } from "../../lib/carOwnerDeals";
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
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function OwnerDealRow({
  deal,
  vehicleLabel,
  countryCode,
  onClick,
  selected = false,
}: OwnerDealRowProps) {
  const discount = dealDiscountPercent(deal);
  const estimated = formatCurrencyAmount(deal.discountedPrice, countryCode);

  const content = (
    <>
      <p className="shrink-0 text-sm font-bold text-[#008000] sm:text-base">{vehicleLabel}</p>

      <span className="inline-flex shrink-0 items-center rounded-full bg-ad-purple px-3 py-1.5 text-xs font-bold text-white sm:px-4 sm:text-sm">
        Valid : {formatValidDate(deal.offerEndsOnDate)}
      </span>

      <span className="inline-flex shrink-0 items-center rounded-md border border-red-500 bg-[#fce4ec] px-3 py-1.5 text-xs font-bold text-red-600 sm:text-sm">
        Estimated- {estimated}
      </span>

      <span className="inline-flex shrink-0 items-center rounded-full bg-[#008000] px-3 py-1.5 text-xs font-bold text-white sm:px-4 sm:text-sm">
        Discount{discount != null ? `-${discount}%` : " —"}
      </span>
    </>
  );

  const className = `mb-3 flex w-full flex-wrap items-center gap-2 rounded-r-2xl rounded-l-md bg-ad-green-light px-3 py-3 shadow-sm transition-all sm:gap-4 sm:px-5 sm:py-3.5 ${
    selected ? "ring-2 ring-ad-purple/50" : ""
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} text-left hover:shadow-md`}>
        {content}
      </button>
    );
  }

  return <article className={className}>{content}</article>;
}
