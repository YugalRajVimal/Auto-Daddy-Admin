import { formatCurrencyAmount } from "../../lib/currency";
import {
  businessName,
  formatBusinessPhone,
  formatJobCardDate,
  jobCardLicensePlate,
  jobChipLabel,
  serviceTypeLabel,
} from "../../lib/carOwnerJobCards";
import type { CarOwnerJobCard } from "../../types/carOwnerJobCards";

type OwnerJobCardRowProps = {
  jc: CarOwnerJobCard;
  countryCode?: string;
};

export default function OwnerJobCardRow({ jc, countryCode }: OwnerJobCardRowProps) {
  const shop = businessName(jc.business);
  const phone = formatBusinessPhone(jc.business);
  const plate = jobCardLicensePlate(jc);
  const service = serviceTypeLabel(jc);
  const date = formatJobCardDate(jc.createdAt);
  const amount = formatCurrencyAmount(jc.totalPayableAmount, countryCode);

  return (
    <article className="flex overflow-hidden rounded-md shadow-sm">
      <div className="flex w-[28%] min-w-[100px] max-w-[160px] shrink-0 items-center justify-center bg-[#006600] px-3 py-4 text-center sm:min-w-[120px]">
        <p className="text-sm font-bold leading-tight text-white">{jobChipLabel(jc)}</p>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-3 items-center gap-2 bg-[#CCFFCC] px-4 py-3 sm:gap-4 sm:px-6">
        <div className="min-w-0 justify-self-start">
          <p className="truncate text-sm font-bold text-gray-900">{shop}</p>
          {phone ? (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-sm font-semibold text-blue-700 hover:underline">
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
          <p className="text-sm font-bold text-[#008000]">{amount}</p>
          <p className="text-sm font-semibold text-blue-700">{date}</p>
        </div>
      </div>
    </article>
  );
}
