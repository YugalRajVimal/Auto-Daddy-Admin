import { formatCurrencyAmount } from "../../lib/currency";
import {
  businessName,
  formatBusinessPhone,
  formatJobCardDate,
  isPaidJobCard,
  jobCardLicensePlate,
  jobChipLabel,
  resolveJobCardTotal,
  serviceTypeLabel,
} from "../../lib/carOwnerJobCards";
import type { CarOwnerJobCard } from "../../types/carOwnerJobCards";

type OwnerJobCardRowProps = {
  jc: CarOwnerJobCard;
  countryCode?: string;
  onClick?: () => void;
};

export default function OwnerJobCardRow({ jc, countryCode, onClick }: OwnerJobCardRowProps) {
  const paid = isPaidJobCard(jc);
  const shop = businessName(jc.business);
  const phone = formatBusinessPhone(jc.business);
  const plate = jobCardLicensePlate(jc);
  const service = serviceTypeLabel(jc);
  const date = formatJobCardDate(jc.createdAt || jc.date || "");
  const amount = formatCurrencyAmount(resolveJobCardTotal(jc), countryCode);

  return (
    <article
      className={`flex overflow-hidden rounded-md shadow-sm${onClick ? " cursor-pointer transition hover:brightness-[0.98]" : ""}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div
        className={`flex w-[28%] min-w-[100px] max-w-[160px] shrink-0 items-center justify-center px-3 py-4 text-center sm:min-w-[120px] ${
          paid ? "bg-[#006600] text-white" : "border-2 border-red-700 bg-white text-red-700"
        }`}
      >
        <p className="text-sm font-bold leading-tight">{jobChipLabel(jc)}</p>
      </div>

      <div
        className={`grid min-w-0 flex-1 grid-cols-3 items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 ${
          paid ? "bg-[#CCFFCC]" : "bg-red-100"
        }`}
      >
        <div className="min-w-0 justify-self-start">
          <p className="truncate text-sm font-bold text-gray-900">{shop}</p>
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="text-sm font-semibold text-blue-700 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {phone}
            </a>
          ) : (
            <p className="text-sm text-gray-500">—</p>
          )}
        </div>

        <div className="justify-self-center text-center">
          <p className="text-base font-bold tracking-wide text-gray-900 sm:text-lg">{plate}</p>
          <p className="text-sm font-semibold text-blue-700">{service}</p>
        </div>

        <div className="justify-self-end text-right">
          <p className={`text-sm font-bold ${paid ? "text-[#008000]" : "text-red-700"}`}>{amount}</p>
          <p className="text-sm font-semibold text-blue-700">{date}</p>
        </div>
      </div>
    </article>
  );
}
