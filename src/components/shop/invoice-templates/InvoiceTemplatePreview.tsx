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
}: {
  data: InvoicePreviewData;
  templateId: string;
}) {
  const theme = resolveInvoiceTheme(templateId);
  const { subTotal, tax, total } = calcInvoiceTotals(data);
  const { shop, customer, items, currency } = data;

  return (
    <article className="bg-white text-[#1a1a1a]">
      <div className="h-1.5" style={{ backgroundColor: theme.accent }} />
      <div className="px-6 py-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
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
          </div>
          <h2
            className="shrink-0 text-2xl font-bold uppercase tracking-wide"
            style={{ color: theme.title }}
          >
            Invoice
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
        </div>

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
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-[19rem] text-sm sm:w-[21rem]">
            <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1">
              <span className="text-right font-semibold text-gray-800">Subtotal :</span>
              <span className="text-right tabular-nums text-gray-800">
                {formatInvoiceMoney(subTotal, currency)}
              </span>
              <span className="text-right font-semibold text-gray-800">HST :</span>
              <span className="text-right tabular-nums text-gray-800">
                {formatInvoiceMoney(tax, currency)}
              </span>
              <div
                className="col-span-2 grid grid-cols-subgrid gap-x-6 py-2 font-bold"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                <span className="text-right">Total ({currency}) :</span>
                <span className="text-right tabular-nums">
                  {formatInvoiceMoney(total, currency)}
                </span>
              </div>
            </div>
          </div>
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
}: {
  templateId: string;
  data?: InvoicePreviewData;
  mode?: "thumbnail" | "full";
  className?: string;
}) {
  const invoice = <EstimateStyleInvoice data={data} templateId={templateId} />;

  if (mode === "thumbnail") {
    return (
      <div
        className={`pointer-events-none relative overflow-hidden bg-[#ececec] ${className}`}
        aria-hidden
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: 680, transform: "scale(0.36)" }}
        >
          {invoice}
        </div>
      </div>
    );
  }

  return <div className={className}>{invoice}</div>;
}
