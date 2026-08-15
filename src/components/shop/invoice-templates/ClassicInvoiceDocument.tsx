import type { CSSProperties } from "react";
import type { InvoiceThemeTokens } from "./invoiceTheme";
import { calcInvoiceTotals, type InvoicePreviewData } from "./sampleInvoiceData";

const DARK = "#1F2A37";
const MUTED = "#6B7280";
const BODY = "#374151";
const GOLD = "#F4B740";

export type InvoiceDocumentLine = {
  description: string;
  qty: number;
  price: number;
  taxLabel: string;
  amount: number;
};

export type InvoiceDocumentModel = {
  badge?: string | null;
  company: {
    name: string;
    tagline?: string;
    contactName?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string | null;
  };
  billTo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    extra?: string[];
  };
  meta: {
    invoiceNo: string;
    date: string;
    dueDate?: string;
    poNumber?: string;
  };
  items: InvoiceDocumentLine[];
  totals: {
    subtotal: number;
    discount: number;
    taxLabel: string;
    tax: number;
    total: number;
    paid: number;
    balanceDue: number;
  };
  payment?: {
    method?: string;
    holderName?: string;
    cardNumber?: string;
    zip?: string;
  };
  notes?: string[];
  signatureName?: string;
  footerNote?: string;
  currencySign?: string;
};

function money(n: number, sign = "$") {
  const formatted = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "-" : ""}${sign}${formatted}`;
}

function LogoMark({ accent }: { accent: string }) {
  return (
    <div style={{ position: "relative", width: 54, height: 54, margin: "0 auto 6px" }}>
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 24,
          height: 24,
          background: DARK,
        }}
      />
      <span
        style={{
          position: "absolute",
          right: 0,
          top: 6,
          width: 24,
          height: 24,
          background: accent,
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 8,
          bottom: 0,
          width: 24,
          height: 24,
          background: "#2B3A4A",
          opacity: 0.85,
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 18,
          top: 16,
          width: 20,
          height: 20,
          background: "#fff",
          border: `3px solid ${accent}`,
        }}
      />
    </div>
  );
}

function SealWatermark({ accent }: { accent: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      width="168"
      height="168"
      aria-hidden
      style={{
        position: "absolute",
        left: 28,
        bottom: 8,
        opacity: 0.09,
        pointerEvents: "none",
      }}
    >
      <circle cx="80" cy="80" r="74" fill="none" stroke={accent} strokeWidth="5" />
      <circle cx="80" cy="80" r="62" fill="none" stroke={accent} strokeWidth="2" />
      <path
        d="M80 38c8 14 6 24 0 34 12 2 22 12 22 26 0 16-12 28-22 32-10-4-22-16-22-32 0-14 10-24 22-26-6-10-8-20 0-34z"
        fill={accent}
      />
      <path d="M80 26l4 10h10l-8 6 3 10-9-6-9 6 3-10-8-6h10z" fill={accent} />
    </svg>
  );
}

const th: CSSProperties = {
  padding: "13px 16px",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: 0.2,
};

const td: CSSProperties = {
  padding: "15px 16px",
  borderBottom: "1px solid #E5E7EB",
  color: BODY,
};

export function invoiceDocumentFromPreview(data: InvoicePreviewData): InvoiceDocumentModel {
  const { subTotal, discount, tax, total } = calcInvoiceTotals(data);
  const paid = data.paidAmount ?? 0;
  const taxLabel = `Tax(${data.taxPercent}%)`;
  return {
    badge: data.vip ? "VIP" : null,
    company: {
      name: data.shop.name,
      tagline: data.shop.slogan,
      contactName: data.accountName || data.shop.name,
      address: data.shop.address,
      phone: data.shop.phone,
      email: data.shop.email,
      logoUrl: data.shop.logoUrl,
    },
    billTo: {
      name: data.customer.name,
      address: data.customer.address,
      phone: data.customer.phone,
      email: data.customer.email,
    },
    meta: {
      invoiceNo: data.invoiceNo,
      date: data.invoiceDate,
      dueDate: data.dueDate,
      poNumber: data.poNumber || data.accountId,
    },
    items: data.items.map((item) => {
      const line = item.price * item.quantity;
      return {
        description: [item.name, item.description].filter(Boolean).join(" — "),
        qty: item.quantity,
        price: item.price,
        taxLabel: `${data.taxPercent}%`,
        amount: line,
      };
    }),
    totals: {
      subtotal: subTotal,
      discount: discount > 0 ? -discount : 0,
      taxLabel,
      tax,
      total,
      paid,
      balanceDue: Math.max(0, total - paid),
    },
    payment: data.payment ?? {
      method: data.paymentMethod,
      holderName: data.accountName,
    },
    notes: data.terms
      ? data.terms
          .split(/(?<=\.)\s+/)
          .map((part) => part.trim())
          .filter(Boolean)
      : undefined,
    signatureName: data.signerName,
    currencySign: data.currency === "INR" ? "₹" : "$",
  };
}

export default function ClassicInvoiceDocument({
  data,
  theme,
  compact = false,
}: {
  data: InvoiceDocumentModel;
  theme: InvoiceThemeTokens;
  compact?: boolean;
}) {
  const sign = data.currencySign ?? "$";
  const pad = compact ? "28px 28px 36px" : "40px 44px 48px";
  const metaRows = [
    ["INVOICE #", data.meta.invoiceNo],
    ["DATE", data.meta.date],
    data.meta.dueDate ? ["DUE DATE", data.meta.dueDate] : null,
    data.meta.poNumber ? ["P.O. #", data.meta.poNumber] : null,
  ].filter(Boolean) as [string, string][];

  const totalRows: [string, string][] = [
    ["Subtotal", money(data.totals.subtotal, sign)],
    data.totals.discount
      ? ["Discount", money(data.totals.discount, sign)]
      : null,
    [data.totals.taxLabel, money(data.totals.tax, sign)],
    ["Total", money(data.totals.total, sign)],
    ["Paid", money(data.totals.paid, sign)],
  ].filter(Boolean) as [string, string][];

  const paymentLines = [
    data.payment?.method ? `Method: ${data.payment.method}` : null,
    data.payment?.holderName ? `Holder Name: ${data.payment.holderName}` : null,
    data.payment?.cardNumber ? `Card Number: ${data.payment.cardNumber}` : null,
    data.payment?.zip ? `ZIP Code: ${data.payment.zip}` : null,
  ].filter(Boolean) as string[];

  return (
    <article
      style={{
        fontFamily:
          "Inter, 'Helvetica Neue', Helvetica, Arial, system-ui, -apple-system, sans-serif",
        color: DARK,
        background: "#fff",
        position: "relative",
        boxSizing: "border-box",
        padding: pad,
        overflow: "hidden",
      }}
    >
      {data.badge ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: compact ? 28 : 44,
            background: GOLD,
            color: "#fff",
            fontWeight: 800,
            fontSize: compact ? 16 : 20,
            letterSpacing: 1,
            padding: "10px 20px",
            borderRadius: "0 0 12px 12px",
          }}
        >
          {data.badge}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", gap: 20, minWidth: 0 }}>
          <div style={{ width: 86, textAlign: "center", flexShrink: 0 }}>
            {data.company.logoUrl ? (
              <img
                src={data.company.logoUrl}
                alt=""
                style={{
                  height: 54,
                  maxWidth: 86,
                  objectFit: "contain",
                  margin: "0 auto 6px",
                  display: "block",
                }}
              />
            ) : (
              <LogoMark accent={theme.accent} />
            )}
            <div
              style={{
                fontWeight: 800,
                fontSize: 14,
                color: DARK,
                letterSpacing: 0.4,
                lineHeight: 1.2,
                wordBreak: "break-word",
              }}
            >
              {data.company.name}
            </div>
            {data.company.tagline ? (
              <div
                style={{
                  fontSize: 7,
                  letterSpacing: 2.2,
                  color: theme.accent,
                  borderTop: `1px solid ${theme.accent}`,
                  borderBottom: `1px solid ${theme.accent}`,
                  padding: "2px 0",
                  marginTop: 4,
                  textTransform: "uppercase",
                }}
              >
                {data.company.tagline}
              </div>
            ) : null}
          </div>

          <div style={{ fontSize: 13, lineHeight: 1.7, color: BODY, paddingTop: 4 }}>
            {data.company.contactName ? (
              <div style={{ fontWeight: 700, fontSize: 16, color: DARK, marginBottom: 4 }}>
                {data.company.contactName}
              </div>
            ) : null}
            {data.company.address ? <div>{data.company.address}</div> : null}
            {data.company.phone ? <div>{data.company.phone}</div> : null}
            {data.company.email ? <div>{data.company.email}</div> : null}
          </div>
        </div>

        <div
          style={{
            fontWeight: 800,
            fontSize: compact ? 34 : 42,
            letterSpacing: 2,
            lineHeight: 1,
            paddingTop: data.badge ? 36 : 8,
            flexShrink: 0,
          }}
        >
          INVOICE
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${theme.border}`, margin: "22px 0 26px" }} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: BODY, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: DARK, marginBottom: 4 }}>BILL TO</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: DARK }}>{data.billTo.name}</div>
          {data.billTo.address ? <div>{data.billTo.address}</div> : null}
          {data.billTo.phone ? <div>{data.billTo.phone}</div> : null}
          {data.billTo.email ? <div>{data.billTo.email}</div> : null}
          {data.billTo.extra?.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>

        <div style={{ fontSize: 14, flexShrink: 0, minWidth: 220 }}>
          {metaRows.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 48,
                marginBottom: 6,
              }}
            >
              <span style={{ fontWeight: 700, color: DARK }}>{label}</span>
              <span style={{ color: MUTED }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 30,
          fontSize: 14,
        }}
      >
        <thead>
          <tr style={{ background: theme.accent, color: theme.accentText }}>
            <th style={{ ...th, textAlign: "left", borderTopLeftRadius: 3 }}>Description</th>
            <th style={{ ...th, textAlign: "center" }}>QTY</th>
            <th style={{ ...th, textAlign: "right" }}>Price</th>
            <th style={{ ...th, textAlign: "left" }}>Tax</th>
            <th style={{ ...th, textAlign: "right", borderTopRightRadius: 3 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ ...td, textAlign: "center", color: MUTED }}>
                No line items
              </td>
            </tr>
          ) : (
            data.items.map((item, i) => (
              <tr key={`${item.description}-${i}`} style={{ background: i % 2 === 1 ? theme.stripe : "#fff" }}>
                <td style={{ ...td, textAlign: "left" }}>{item.description}</td>
                <td style={{ ...td, textAlign: "center" }}>{item.qty}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(item.price, sign)}</td>
                <td style={{ ...td, textAlign: "left" }}>{item.taxLabel}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(item.amount, sign)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
        <div style={{ width: 340, fontSize: 15 }}>
          {totalRows.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "11px 4px",
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <span style={{ color: BODY }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: theme.accent,
              color: theme.accentText,
              padding: "14px 18px",
              marginTop: 10,
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            <span>BALANCE DUE</span>
            <span>{money(data.totals.balanceDue, sign)}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 36,
          gap: 40,
          position: "relative",
          minHeight: 88,
        }}
      >
        <SealWatermark accent={theme.accent} />
        <div style={{ fontSize: 14, lineHeight: 1.8, color: BODY, position: "relative", zIndex: 1 }}>
          {paymentLines.length > 0 ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 16, color: DARK, marginBottom: 6 }}>
                Payment Method
              </div>
              {paymentLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </>
          ) : null}

          {data.notes && data.notes.length > 0 ? (
            <div style={{ marginTop: paymentLines.length > 0 ? 22 : 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: DARK, marginBottom: 6 }}>
                Notes
              </div>
              {data.notes.map((note) => (
                <div key={note}>{note}</div>
              ))}
            </div>
          ) : null}
        </div>

        {data.signatureName ? (
          <div style={{ textAlign: "center", minWidth: 200, position: "relative", zIndex: 1 }}>
            <div
              style={{
                fontFamily: "'Segoe Script', 'Brush Script MT', cursive",
                fontSize: compact ? 32 : 40,
                color: DARK,
                lineHeight: 1.1,
                paddingTop: 12,
              }}
            >
              {data.signatureName}
            </div>
          </div>
        ) : null}
      </div>

      {data.footerNote ? (
        <p
          style={{
            margin: "28px 0 0",
            textAlign: "right",
            fontSize: 10,
            color: MUTED,
          }}
        >
          {data.footerNote}
        </p>
      ) : null}
    </article>
  );
}
