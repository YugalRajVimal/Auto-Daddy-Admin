import { useEffect } from "react";
import { PaidStampToggle } from "../PaidStampToggle";
import { resolveInvoiceTheme } from "./invoiceTheme";
import {
  DEFAULT_INVOICE_PREVIEW,
  calcInvoiceTotals,
  formatInvoiceMoney,
  type InvoicePreviewData,
} from "./sampleInvoiceData";

function EstimateStyleInvoice({
  data,
  templateId,
  compact = false,
  stampStatus = "Draft",
  poNumber
}: {
  data: InvoicePreviewData;
  templateId: string;
  compact?: boolean;
  stampStatus?: "Draft" | "Sent" | "Paid" | "Overdue";
  poNumber: string;
}) {
  const theme = resolveInvoiceTheme(templateId);
  const { subTotal } = calcInvoiceTotals(data);
  const { shop, customer, items, currency } = data;
  const pad = compact ? "px-4 py-3" : "px-6 py-5";

  useEffect(()=>{
console.log(poNumber);
  },[]);

  return (
    <article className="bg-white text-[#1a1a1a]">
      <div className="h-1.5" style={{ backgroundColor: theme.accent }} />
      <div className={pad}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0 items-center gap-3">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt="" className="h-12 max-w-[8rem] object-contain" />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded text-xs font-bold"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                AD
              </div>
            )}
            <p className="truncate text-sm font-bold" style={{ color: theme.title }}>
              {shop.name}
            </p>
            <div>
              {shop.address ? <p>{shop.address}</p> : null}
              {shop.phone ? <p>{shop.phone}</p> : null}
            </div>
            <div>
              <p className="font-bold text-gray-900">To</p>
              <p className="font-semibold">{customer.name}</p>
              {customer.title ? <p>{customer.title}</p> : null}
              {customer.address ? <p>{customer.address}</p> : null}
            </div>

          </div>
          <div className="self-center">
  <PaidStampToggle
    paid={stampStatus === "Paid"}
    onToggle={() => {}}
  />
</div>

              <div className="flex flex-col min-w-0 items-end gap-3 ">
              <h2
            className="shrink-0 text-2xl font-bold uppercase tracking-wide"
            style={{ color: theme.title }}
          >
            Invoice
          </h2>
          <div>
          <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-2">
              <span className="text-right font-semibold text-gray-700">Invoice No. :</span>
              <span className="font-semibold text-gray-900">{data.invoiceNo}</span>
            </div>
            <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-2">
              <span className="text-right font-semibold text-gray-700">Date :</span>
              <span className="font-semibold text-gray-900">{data.invoiceDate}</span>
            </div>
            <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-2">
              <span className="text-right font-semibold text-gray-700">HST No. :</span>
              <span className="font-semibold text-gray-900">{poNumber}</span>
            </div>
          </div>
         
              </div>
        
        </div>

        {/* <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-4 text-sm text-gray-800">
            <div>
              {shop.address ? <p>{shop.address}</p> : null}
              {shop.phone ? <p>{shop.phone}</p> : null}
            </div>
            <div>
              <p className="font-bold text-gray-900">To</p>
              <p className="font-semibold">{customer.name}</p>
              {customer.title ? <p>{customer.title}</p> : null}
              {customer.address ? <p>{customer.address}</p> : null}
            </div>
          </div>
          <div className="space-y-1 text-sm sm:justify-self-end">
            <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-2">
              <span className="text-right font-semibold text-gray-700">Invoice No. :</span>
              <span className="font-semibold text-gray-900">{data.invoiceNo}</span>
            </div>
            <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-2">
              <span className="text-right font-semibold text-gray-700">Date :</span>
              <span className="font-semibold text-gray-900">{data.invoiceDate}</span>
            </div>
            <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-2">
              <span className="text-right font-semibold text-gray-700">HST No. :</span>
              <span className="font-semibold text-gray-900">{data.accountId}</span>
            </div>
          </div>
        </div> */}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr
                className="text-left text-xs font-bold"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                <th className="border border-gray-300 px-2 py-2">S. No.</th>
                <th className="border border-gray-300 px-2 py-2">Description</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Unit Cost</th>
                <th className="border border-gray-300 px-2 py-2 text-center">Qty</th>
                <th className="border border-gray-300 px-2 py-2 text-right">HST</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  style={index % 2 === 1 ? { backgroundColor: theme.stripe } : undefined}
                >
                  <td className="border border-gray-300 px-2 py-2 align-top">{index + 1}.</td>
                  <td className="border border-gray-300 px-2 py-2 align-top">
                    {item.name}
                    {item.description ? ` — ${item.description}` : ""}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right align-top tabular-nums">
                    {formatInvoiceMoney(item.price, currency)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center align-top tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right align-top tabular-nums">
                    {data.taxPercent}%
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right align-top tabular-nums">
                    {formatInvoiceMoney(item.price * item.quantity, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="border-0 p-0" />
                <td
                  colSpan={4}
                  className="border border-gray-300 px-2 py-1.5 text-xs text-gray-800"
                >
                  <div className="flex items-center justify-between gap-4 font-semibold">
                    <span>Subtotal :</span>
                    <span className="tabular-nums">{formatInvoiceMoney(subTotal, currency)}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="border-0 p-0" />
                <td
                  colSpan={4}
                  className="border border-gray-300 px-2 py-1.5 text-xs text-gray-800"
                >
                  <div className="flex items-center justify-between gap-4 font-semibold">
                    <span>HST : ( {data.taxPercent} % )</span>
                    <span className="tabular-nums">{formatInvoiceMoney((subTotal * data.taxPercent/100), currency)}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="border-0 p-0" />
                <td
                  colSpan={4}
                  className="border border-gray-300 px-2 py-2 text-xs font-bold"
                  style={{ backgroundColor: theme.accent, color: theme.accentText }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span>Total ({currency}) :</span>
                    <span className="tabular-nums">{formatInvoiceMoney(subTotal + (subTotal * data.taxPercent/100), currency)}</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-6 text-right text-[10px] text-gray-500">
          This estimate was sent using AutoDaddy
        </p>
      </div>
      <div className="h-1.5" style={{ backgroundColor: theme.accent }} />
    </article>
  );
}

export function InvoiceTemplatePreview({
  templateId,
  data = DEFAULT_INVOICE_PREVIEW,
  mode = "full",
  className = "",
  stampStatus,

}: {
  templateId: string;
  data?: InvoicePreviewData;
  mode?: "thumbnail" | "full";
  className?: string;
  stampStatus?: "Paid" | "Unpaid" | "None";
}) {

  console.log(data);

  
  const invoice = (
    <EstimateStyleInvoice
      data={data}
      templateId={templateId}
      compact={mode === "thumbnail"}
      poNumber={data.poNumber}
      stampStatus={
        stampStatus === "Unpaid" || stampStatus === "None"
          ? undefined
          : stampStatus
      }
    />
  );

  if (mode === "thumbnail") {
    /**
     * `zoom` scales layout size (unlike transform), so the card height
     * matches the invoice — no empty gap under the preview.
     */
    const thumbScale = 0.38;
    return (
      <div
        className={`pointer-events-none w-full overflow-hidden bg-white ${className}`}
        aria-hidden
        style={{ zoom: thumbScale }}
      >
        <div style={{ width: `${100 / thumbScale}%` }}>{invoice}</div>
      </div>
    );
  }

  return <div className={className}>{invoice}</div>;
}
