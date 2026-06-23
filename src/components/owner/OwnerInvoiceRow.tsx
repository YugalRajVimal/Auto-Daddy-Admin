import { formatJobCardDate } from "../../lib/carOwnerJobCards";
import { formatCurrencyAmount } from "../../lib/currency";
import { isPaidInvoiceRow, type CarOwnerInvoiceRow } from "../../hooks/useCarOwnerInvoices";

type OwnerInvoiceRowProps = {
  row: CarOwnerInvoiceRow;
  countryCode?: string;
};

function invoiceChipLabel(row: CarOwnerInvoiceRow): string {
  const no = row.jobNo?.trim();
  if (!no) return "Invoice";
  return no.toLowerCase().startsWith("invoice") ? no : `Invoice No # ${no}`;
}

export default function OwnerInvoiceRow({ row, countryCode }: OwnerInvoiceRowProps) {
  const paid = isPaidInvoiceRow(row);
  const plate = row.plate?.trim().toUpperCase() || "—";
  const service = row.service?.trim() || row.vehicle?.trim() || "—";
  const phone = row.phone?.trim() ?? "";
  const date = formatJobCardDate(row.createdAt);
  const amount = formatCurrencyAmount(row.amount, countryCode);

  return (
    <article className="flex overflow-hidden rounded-md shadow-sm">
      <div
        className={`flex w-[28%] min-w-[100px] max-w-[160px] shrink-0 items-center justify-center px-3 py-4 text-center sm:min-w-[120px] ${
          paid ? "bg-[#006600] text-white" : "border-2 border-red-700 bg-white text-red-700"
        }`}
      >
        <p className="text-sm font-bold leading-tight">{invoiceChipLabel(row)}</p>
      </div>

      <div
        className={`grid min-w-0 flex-1 grid-cols-3 items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 ${
          paid ? "bg-[#CCFFCC]" : "bg-red-100"
        }`}
      >
        <div className="min-w-0 justify-self-start">
          <p className="truncate text-sm font-bold text-gray-900">{row.shopName}</p>
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
          <p className={`text-sm font-bold ${paid ? "text-[#008000]" : "text-red-700"}`}>{amount}</p>
          <p className="text-sm font-semibold text-blue-700">{date}</p>
        </div>
      </div>
    </article>
  );
}
