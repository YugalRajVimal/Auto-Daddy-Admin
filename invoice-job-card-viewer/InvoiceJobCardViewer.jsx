import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatCurrencyAmount,
  formatCurrencyNumber,
  getCurrencyCode,
  getCallingCodeFromProfileResponse,
  isOnlineInvoicePayment,
  normalizeMediaUrl,
} from "./utils.js";
import "./invoice-job-card-viewer.css";

function s(v) {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function nested(v) {
  return v && typeof v === "object" ? v : null;
}

function formatInvoiceDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatMoney(value, countryCode, { withCode = true, decimals = 2 } = {}) {
  if (withCode) {
    return formatCurrencyAmount(value, countryCode, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return (
    formatCurrencyNumber(value, countryCode, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) ?? "—"
  );
}

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pickBusiness(job, cachedProfile) {
  const fromJob =
    nested(job?.business) ??
    nested(job?.businessProfile) ??
    nested(job?.shop);
  if (fromJob) return fromJob;
  if (nested(cachedProfile?.businessProfile)) return cachedProfile.businessProfile;
  return nested(cachedProfile?.data?.businessProfile) ?? nested(cachedProfile?.businessProfile);
}

function buildBusinessAddress(business) {
  const parts = [
    s(business?.businessAddress ?? business?.address),
    s(business?.cityName ?? business?.city?.name ?? business?.city),
    s(business?.pincode),
  ].filter(Boolean);
  return parts.join(", ");
}

function buildCustomerAddress(customer) {
  const lines = [
    s(customer?.name),
    s(customer?.phone) ? `Phone: ${s(customer?.phone)}` : "",
    s(customer?.email) ? `Email: ${s(customer?.email)}` : "",
    s(customer?.address),
    [s(customer?.city), s(customer?.pincode)].filter(Boolean).join(" ").trim(),
  ].filter(Boolean);
  return lines.join("\n");
}

function buildJobCardBillTo(customer) {
  const lines = [
    s(customer?.name),
    s(customer?.phone) ? `Phone: ${s(customer?.phone)}` : "",
    s(customer?.email) ? `Email: ${s(customer?.email)}` : "",
    s(customer?.address),
    [s(customer?.city), s(customer?.pincode)].filter(Boolean).join(" ").trim(),
  ].filter(Boolean);
  return lines.join("\n");
}

function splitFirstLine(text) {
  const raw = s(text);
  if (!raw) return { first: "", rest: [] };
  const parts = raw.split("\n").map((x) => x.trimEnd());
  const first = s(parts[0]);
  const rest = parts.slice(1).map((x) => x.trim()).filter(Boolean);
  return { first, rest };
}

function flattenServiceLines(services) {
  const lines = [];
  for (const svc of services || []) {
    const category =
      s(svc?.service?.name) ??
      s(nested(svc?.service)?.name) ??
      s(svc?.service);
    for (const sub of svc?.subServices || []) {
      const price = parseNumber(sub?.price);
      const labour = parseNumber(sub?.labourCharge ?? sub?.labourCost);
      const descParts = [s(sub?.name), s(sub?.desc)].filter(Boolean);
      lines.push({
        category,
        description: descParts.join(" — ") || "Service",
        unitCost: price,
        units: s(sub?.unit ?? sub?.qty ?? sub?.labourDuration) || "1",
        labour,
        amount: price + labour,
      });
    }
  }
  return lines;
}

function chipToneFromPaymentStatus(status) {
  const t = s(status).toLowerCase();
  if (!t) return "neutral";
  if (t.includes("paid") || t === "success") return "paid";
  if (t.includes("unpaid") || t.includes("pending") || t.includes("due")) return "unpaid";
  return "neutral";
}

function PaymentChip({ status }) {
  const label = s(status) || "—";
  const tone = chipToneFromPaymentStatus(status);
  const cls =
    tone === "paid"
      ? "invoice-viewer-chip invoice-viewer-chip-paid"
      : tone === "unpaid"
        ? "invoice-viewer-chip invoice-viewer-chip-unpaid"
        : "invoice-viewer-chip";
  return <span className={cls}>{label}</span>;
}

function extractJobCardServiceLines(services) {
  const lines = [];
  for (const svc of services || []) {
    for (const sub of svc?.subServices || []) {
      const price = parseNumber(sub?.price);
      const labourCharge = parseNumber(sub?.labourCharge ?? sub?.labourCost);
      lines.push({
        name: s(sub?.name) || "Service",
        desc: s(sub?.desc) || "—",
        price,
        labourCharge,
      });
    }
  }
  return lines;
}

function extractJobCardDetailedLines(services) {
  const lines = [];
  for (const svc of services || []) {
    for (const sub of svc?.subServices || []) {
      const unitPrice = parseNumber(sub?.unitPrice);
      const qty = parseNumber(sub?.qty ?? sub?.unit ?? sub?.labourDuration ?? 1) || 1;
      const labourCost = parseNumber(sub?.labourCost ?? sub?.labourCharge);
      const rawPrice = parseNumber(sub?.price);
      const computed = unitPrice > 0 ? unitPrice * qty + labourCost : rawPrice + labourCost;
      const price = rawPrice > 0 ? rawPrice : computed;
      lines.push({
        description: s(sub?.name) || "Service",
        details: s(sub?.desc) || "—",
        unitPrice: unitPrice > 0 ? unitPrice : Math.max(0, (price - labourCost) / qty),
        qty,
        labourCost,
        price,
      });
    }
  }
  return lines;
}

function extractLabourFromJob(job) {
  let charge = parseNumber(job?.labourCharge ?? job?.laborCharge);
  let hours = parseNumber(job?.labourDuration ?? job?.laborDuration ?? job?.labourHours);

  const tech = s(job?.technicalRemarks);
  if (!hours && tech) {
    const hrMatch = /labou?r\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*hr/i.exec(tech);
    if (hrMatch) hours = parseNumber(hrMatch[1]);
  }
  if (!charge && tech) {
    const rsMatch = /labou?r\s*:\s*(?:[0-9]+(?:\.[0-9]+)?\s*hr\s*,\s*)?[^\d-]*([0-9]+(?:\.[0-9]+)?)/i.exec(tech);
    if (rsMatch) charge = parseNumber(rsMatch[1]);
  }

  return { charge, hours };
}

function formatOdometer(value) {
  if (value == null || value === "") return "—";
  return String(value);
}

function extractJobCardPhotos(job, apiBaseUrl) {
  const seen = new Set();
  const out = [];
  for (const list of [job?.vehiclePhotos, job?.images]) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      const path = s(raw);
      if (!path || seen.has(path)) continue;
      seen.add(path);
      const url = normalizeMediaUrl(path, apiBaseUrl);
      if (url) out.push(url);
    }
  }
  return out;
}

function resolveJobFromResponse(resp) {
  if (!resp || typeof resp !== "object") return null;
  const root = resp;
  const data = nested(root.data);
  if (data) {
    const card = nested(data.jobCard) ?? nested(data.card);
    if (card) return card;
    if (pickId(data)) return data;
  }
  if (pickId(root)) return root;
  return data ?? root;
}

function pickId(o) {
  const raw = o?._id ?? o?.id;
  return typeof raw === "string" && raw ? raw : "";
}

function paymentMethodLabel(method) {
  const t = s(method);
  if (!t) return "";
  if (t.toLowerCase() === "online") return "Invoice";
  return t;
}

function InvoiceViewerSkeleton() {
  const bone = (style) => (
    <div className="invoice-viewer-skeleton-pulse" style={style} aria-hidden />
  );
  return (
    <div className="invoice-viewer-skeleton" aria-busy="true" aria-label="Loading document">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          {bone({ height: 20, width: "60%", marginBottom: 8 })}
          {bone({ height: 12, width: "80%", marginBottom: 6 })}
          {bone({ height: 12, width: "40%" })}
        </div>
        {bone({ height: 56, width: 56, borderRadius: 4, flexShrink: 0 })}
      </div>
      {bone({ height: 1, width: "100%", margin: "16px 0" })}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {bone({ height: 64 })}
        {bone({ height: 64 })}
      </div>
      {bone({ height: 160, width: "100%", marginTop: 16, borderRadius: 4 })}
    </div>
  );
}

function HeaderWave() {
  return (
    <svg
      className="invoice-viewer-wave invoice-viewer-wave-header"
      viewBox="0 0 900 120"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0,60 C150,20 300,90 450,55 C600,20 750,85 900,50 L900,0 L0,0 Z"
        fill="rgba(66,165,245,0.08)"
      />
      <path
        d="M0,75 C180,35 360,95 540,60 C720,30 810,80 900,65 L900,0 L0,0 Z"
        fill="rgba(66,165,245,0.05)"
      />
    </svg>
  );
}

function FooterWaves() {
  return (
    <div className="invoice-viewer-footer-waves" aria-hidden>
      <svg viewBox="0 0 900 80" preserveAspectRatio="none">
        <path d="M0,40 C200,10 400,70 600,35 C750,10 850,55 900,30 L900,80 L0,80 Z" fill="#bbdefb" />
        <path d="M0,55 C180,25 380,75 580,45 C720,25 820,65 900,50 L900,80 L0,80 Z" fill="#64b5f6" />
        <path d="M0,65 C220,40 420,78 620,58 C760,45 840,72 900,62 L900,80 L0,80 Z" fill="#1976d2" />
      </svg>
    </div>
  );
}

function MetaRow({ label, value, strong }) {
  if (!value) return null;
  return (
    <div className={`invoice-viewer-meta-row${strong ? " invoice-viewer-meta-row-strong" : ""}`}>
      <span className="invoice-viewer-meta-label">{label}</span>
      <span className="invoice-viewer-meta-value">{value}</span>
    </div>
  );
}

function InvoiceDocument({
  job,
  business,
  variant,
  actionsSlot = null,
  countryCode = null,
  apiBaseUrl = "",
  defaultLogoUrl = "",
}) {
  const isInvoice = variant === "invoice";
  const currencyCode = getCurrencyCode(countryCode);
  const customer =
    nested(job?.customerId) ?? nested(job?.customer) ?? nested(job?.carOwner);
  const vehicle = nested(job?.vehicleId) ?? nested(job?.vehicle);
  const make = nested(vehicle?.make);
  const payable = nested(job?.payableAmounts);
  const invoiceLines = useMemo(() => flattenServiceLines(job?.services), [job?.services]);
  const jobCardLines = useMemo(() => extractJobCardServiceLines(job?.services), [job?.services]);
  const jobCardDetailedLines = useMemo(
    () => extractJobCardDetailedLines(job?.services),
    [job?.services]
  );
  const photos = useMemo(
    () => (isInvoice ? [] : extractJobCardPhotos(job, apiBaseUrl)),
    [isInvoice, job, apiBaseUrl]
  );
  const labour = extractLabourFromJob(job);
  const showTax = isInvoice && isOnlineInvoicePayment(job?.paymentMethod);

  const servicesSubTotal = jobCardLines.reduce((sum, line) => sum + line.price, 0);
  const lineSubtotal = invoiceLines.reduce((sum, line) => sum + line.amount, 0);
  const subtotal = isInvoice
    ? parseNumber(payable?.invoiceTotal) || lineSubtotal
    : servicesSubTotal;
  const taxableAmt = subtotal;
  const gstRate = showTax ? parseNumber(payable?.gstRate ?? business?.gst) : 0;
  const gstAmount = showTax ? parseNumber(payable?.gstAmount) : 0;
  const roundOff = showTax ? parseNumber(payable?.roundOff) : 0;
  const totalTax = showTax
    ? gstAmount || (gstRate > 0 ? (taxableAmt * gstRate) / 100 : 0)
    : 0;
  const invoiceTotal = showTax
    ? parseNumber(job?.totalPayableAmount) ||
      parseNumber(payable?.online) ||
      subtotal + totalTax + roundOff
    : parseNumber(payable?.cash) ||
      parseNumber(job?.totalPayableAmount) ||
      subtotal;
  const jobTotal =
    parseNumber(job?.totalPayableAmount) > 0
      ? parseNumber(job?.totalPayableAmount)
      : servicesSubTotal + labour.charge;
  const documentTotal = isInvoice ? invoiceTotal : jobTotal;
  const paymentTone = chipToneFromPaymentStatus(job?.paymentStatus);
  const isPendingPayment = !isInvoice && paymentTone === "unpaid";

  const docNo = isInvoice
    ? s(job?.invoiceNumber) || s(job?.jobNo)?.padStart(5, "0")
    : s(job?.jobNo);
  const docLabel = isInvoice ? "Invoice #" : "Job #";
  const dateLabel = isInvoice ? "Invoice Date" : "Job Date";
  const totalLabel = isInvoice ? `Due Amt (${currencyCode})` : `Total (${currencyCode})`;
  const headerAmountLabel = isPendingPayment ? `Due Amt (${currencyCode})` : totalLabel;

  const businessName = s(business?.businessName ?? business?.name) || "Auto Shop";
  const businessCategory =
    s(business?.businessCategory ?? business?.industry ?? business?.category) ||
    "Auto Service";
  const businessAddress = buildBusinessAddress(business);
  const gstNo = s(business?.businessHSTNumber ?? business?.gstNumber ?? business?.gst);
  const logoSrc =
    normalizeMediaUrl(business?.businessLogo, apiBaseUrl) || defaultLogoUrl || "";

  const billTo = isInvoice ? buildCustomerAddress(customer) : buildJobCardBillTo(customer);
  const billToSplit = splitFirstLine(billTo);
  const vehiclePlate = s(vehicle?.licensePlateNo ?? vehicle?.licensePlate ?? vehicle?.regNo ?? vehicle?.plateNo);
  const vehicleName = [
    make?.name ?? vehicle?.brand ?? vehicle?.makeName,
    make?.model ?? vehicle?.model ?? vehicle?.vehicleName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const vehicleVin = s(vehicle?.vin ?? vehicle?.vinNo ?? vehicle?.VIN);
  const vehicleCin = s(vehicle?.cin ?? vehicle?.CIN ?? vehicle?.chassisNo ?? vehicle?.chasisNo);
  const odoIn = formatOdometer(job?.odometerReading);
  const odoOut = formatOdometer(job?.dueOdometerReading);
  const odometerLabel =
    odoIn !== "—" || odoOut !== "—" ? `Odo In: ${odoIn}  ·  Odo Out: ${odoOut}` : "";

  const paymentMethodText = paymentMethodLabel(s(job?.paymentMethod));
  const paymentStatusShort = (() => {
    const tone = chipToneFromPaymentStatus(job?.paymentStatus);
    if (tone === "paid") return "Paid";
    if (tone === "unpaid") return "Unpaid";
    return s(job?.paymentStatus) || "—";
  })();

  const accountName =
    s(business?.accountName ?? business?.paymentAccountName) || businessName;
  const interac =
    s(business?.interacEmail ?? business?.interacETransfer ?? business?.businessEmail);
  const terms = isInvoice
    ? s(business?.termsAndConditions ?? business?.terms) ||
      s(job?.additionalNotes) ||
      s(job?.technicalRemarks)
    : s(job?.additionalNotes);

  return (
    <div className="invoice-viewer-document">
      <HeaderWave />

      {s(job?.paymentStatus) ? (
        <div className="invoice-viewer-payment-center">
          {s(job?.paymentMethod) ? (
            <div className="invoice-viewer-payment-method">
              {paymentMethodLabel(s(job?.paymentMethod))}
            </div>
          ) : null}
          <PaymentChip status={job?.paymentStatus} />
        </div>
      ) : null}

      <div className="invoice-viewer-top">
        <div className="invoice-viewer-company">
          <h2 className="invoice-viewer-company-name">{businessName}</h2>
          <p className="invoice-viewer-company-category">{businessCategory}</p>
          {businessAddress ? <p className="invoice-viewer-company-detail">{businessAddress}</p> : null}
          {gstNo ? <p className="invoice-viewer-company-detail">GST No. {gstNo}</p> : null}
        </div>

        <div className="invoice-viewer-brand-meta">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="invoice-viewer-logo" draggable={false} />
          ) : null}
          <div className="invoice-viewer-meta-grid">
            <MetaRow label={docLabel} value={docNo} />
            <MetaRow label={dateLabel} value={formatInvoiceDate(job?.createdAt)} />
            {isInvoice ? <MetaRow label="P.O. #" value={s(job?.jobNo)} /> : null}
            <MetaRow label={headerAmountLabel} value={formatMoney(documentTotal, countryCode)} strong />
          </div>
        </div>
      </div>

      <div className="invoice-viewer-bill-to invoice-viewer-bill-grid">
        <div className="invoice-viewer-bill-col">
          <h3 className="invoice-viewer-section-title">{isInvoice ? "Bill To" : "Customer"}</h3>
          {billToSplit.first ? (
            <>
              <p className="invoice-viewer-bill-primary">{billToSplit.first}</p>
              {billToSplit.rest.length ? (
                <p className="invoice-viewer-bill-to-text whitespace-pre-line">
                  {billToSplit.rest.join("\n")}
                </p>
              ) : null}
            </>
          ) : (
            <p className="invoice-viewer-bill-to-text">—</p>
          )}
        </div>
        <div className="invoice-viewer-bill-col invoice-viewer-bill-col-right">
          <div className="invoice-viewer-vehicle-align">
            <h3 className="invoice-viewer-section-title">Customer&apos;s Vehicle</h3>
            <div className="invoice-viewer-vehicle-block">
              <p className="invoice-viewer-vehicle-plate">
                {vehiclePlate ? vehiclePlate.toUpperCase() : "—"}
              </p>
              {vehicleName ? <p className="invoice-viewer-bill-to-text">{vehicleName}</p> : null}
              {vehicleVin ? <p className="invoice-viewer-bill-to-sub">VIN: {vehicleVin}</p> : null}
              {vehicleCin ? <p className="invoice-viewer-bill-to-sub">CIN: {vehicleCin}</p> : null}
              {odometerLabel ? <p className="invoice-viewer-bill-to-sub">{odometerLabel}</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="invoice-viewer-table-wrap">
        <table className="invoice-viewer-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Description</th>
              <th className="text-right">{isInvoice ? "Unit Cost" : "Unit price"}</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Labor cost</th>
              <th className="text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {isInvoice ? (
              invoiceLines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="invoice-viewer-empty">
                    No line items
                  </td>
                </tr>
              ) : (
                invoiceLines.map((line, i) => (
                  <tr key={`${line.description}-${i}`}>
                    <td>{i + 1}.</td>
                    <td>{line.description}</td>
                    <td className="text-right tabular-nums">{formatMoney(line.unitCost, countryCode, { withCode: false })}</td>
                    <td className="text-right tabular-nums">{line.units}</td>
                    <td className="text-right tabular-nums">{formatMoney(line.labour, countryCode, { withCode: false })}</td>
                    <td className="text-right tabular-nums">{formatMoney(line.amount, countryCode, { withCode: false })}</td>
                  </tr>
                ))
              )
            ) : jobCardDetailedLines.length === 0 ? (
              <tr>
                <td colSpan={6} className="invoice-viewer-empty">
                  No services listed
                </td>
              </tr>
            ) : (
              jobCardDetailedLines.map((line, i) => (
                <tr key={`${line.description}-${i}`}>
                  <td>{i + 1}.</td>
                  <td>
                    <div className="invoice-viewer-jobline-title">{line.description}</div>
                    <div className="invoice-viewer-jobline-sub">{line.details}</div>
                  </td>
                  <td className="text-right tabular-nums">{formatMoney(line.unitPrice, countryCode, { withCode: false })}</td>
                  <td className="text-right tabular-nums">{line.qty}</td>
                  <td className="text-right tabular-nums">{formatMoney(line.labourCost, countryCode, { withCode: false })}</td>
                  <td className="text-right tabular-nums">{formatMoney(line.price, countryCode, { withCode: false })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="invoice-viewer-bottom">
        <div className="invoice-viewer-payment">
          {isInvoice ? (
            <>
              <h4 className="invoice-viewer-payment-title">Payment Transfer Information</h4>
              {accountName ? (
                <p className="invoice-viewer-payment-line">
                  <span>Account Name :</span> {accountName}
                </p>
              ) : null}
              {interac ? (
                <p className="invoice-viewer-payment-line">
                  <span>Interac e-Transfer :</span> {interac}
                </p>
              ) : null}

              {showTax ? (
                <table className="invoice-viewer-tax-table">
                  <thead>
                    <tr>
                      <th>Taxable Amt.</th>
                      <th>Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="tabular-nums">{formatMoney(taxableAmt, countryCode, { withCode: false })}</td>
                      <td className="tabular-nums">{formatMoney(totalTax, countryCode, { withCode: false })}</td>
                    </tr>
                  </tbody>
                </table>
              ) : null}
            </>
          ) : (
            <>
              <h4 className="invoice-viewer-payment-title">Payment Transfer Information</h4>
              <p className="invoice-viewer-payment-line">
                <span>Method :</span> {paymentMethodText || "—"}
              </p>
              <p className="invoice-viewer-payment-line">
                <span>Status :</span> <PaymentChip status={paymentStatusShort} />
              </p>
              {accountName ? (
                <p className="invoice-viewer-payment-line">
                  <span>Account Name :</span> {accountName}
                </p>
              ) : null}
              {interac ? (
                <p className="invoice-viewer-payment-line">
                  <span>Interac e-Transfer :</span> {interac}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="invoice-viewer-totals">
          <div className="invoice-viewer-total-row">
            <span>{isInvoice ? "Subtotal" : "Sub Total"}</span>
            <span className="tabular-nums">{formatMoney(subtotal, countryCode)}</span>
          </div>
          {!isInvoice && labour.charge > 0 ? (
            <div className="invoice-viewer-total-row">
              <span>
                Labour
                {labour.hours > 0 ? ` (${labour.hours} hr)` : ""}
              </span>
              <span className="tabular-nums">{formatMoney(labour.charge, countryCode)}</span>
            </div>
          ) : null}
          {showTax && (gstRate > 0 || totalTax > 0) ? (
            <div className="invoice-viewer-total-row">
              <span>{gstRate > 0 ? `HST (${gstRate}%)` : "HST"}</span>
              <span className="tabular-nums">{formatMoney(totalTax, countryCode)}</span>
            </div>
          ) : null}
          {showTax && roundOff !== 0 ? (
            <div className="invoice-viewer-total-row">
              <span>Round Off</span>
              <span className="tabular-nums">{formatMoney(roundOff, countryCode)}</span>
            </div>
          ) : null}
          <div className="invoice-viewer-total-row invoice-viewer-total-final">
            <span>{isInvoice ? "Invoice Total" : "Job Total"}</span>
            <span className="tabular-nums">{formatMoney(documentTotal, countryCode)}</span>
          </div>
          {actionsSlot ? <div className="invoice-viewer-actions-inline">{actionsSlot}</div> : null}
        </div>
      </div>

      {!isInvoice && photos.length > 0 ? (
        <div className="invoice-viewer-terms">
          <h4 className="invoice-viewer-section-title">Vehicle Photos</h4>
          <div className="invoice-viewer-photos">
            {photos.map((src) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="invoice-viewer-photo"
              >
                <img src={src} alt="" loading="lazy" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {terms ? (
        <div className="invoice-viewer-terms">
          <h4 className="invoice-viewer-section-title">Terms &amp; Conditions</h4>
          <p className="invoice-viewer-terms-text">{terms}</p>
        </div>
      ) : null}

      <FooterWaves />
    </div>
  );
}

/**
 * Invoice / job card viewer dialog — portable copy from Auto-Daddy Panel.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} [props.jobCardId] — fetch when `job` is not provided
 * @param {() => void} props.onClose
 * @param {"invoice"|"jobcard"} [props.variant]
 * @param {object} [props.job] — pass API job card object directly (skips fetch)
 * @param {object} [props.businessProfile] — optional shop profile for business + currency
 * @param {string} [props.countryCode] — dial code e.g. "+1" (defaults from profile or "+1")
 * @param {string} [props.apiBaseUrl] — prefix for relative media paths
 * @param {string} [props.defaultLogoUrl] — fallback business logo
 * @param {(id: string) => Promise<unknown>} [props.fetchJobCard] — custom API loader
 * @param {() => Promise<unknown>} [props.fetchBusinessProfile] — custom profile loader
 * @param {React.ReactNode} [props.footer]
 * @param {boolean} [props.stickyFooter]
 * @param {string} [props.footerClassName]
 * @param {React.ReactNode} [props.actions]
 */
export default function InvoiceJobCardViewer({
  open,
  jobCardId,
  onClose,
  variant = "invoice",
  footer = null,
  stickyFooter = true,
  footerClassName = "",
  actions = null,
  job: jobOverride = null,
  businessProfile: businessProfileOverride = null,
  countryCode: countryCodeOverride = null,
  apiBaseUrl = "",
  defaultLogoUrl = "",
  fetchJobCard = null,
  fetchBusinessProfile = null,
}) {
  const [job, setJob] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(businessProfileOverride);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !jobCardId || jobOverride) return;
    if (!fetchJobCard) {
      setError("Provide `job` data or a `fetchJobCard` function.");
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError("");
    setJob(null);
    if (businessProfileOverride) setBusinessProfile(businessProfileOverride);

    (async () => {
      try {
        const requests = [fetchJobCard(jobCardId)];
        if (fetchBusinessProfile) requests.push(fetchBusinessProfile().catch(() => null));
        const [jobResp, profileResp] = await Promise.all(requests);
        if (!alive) return;
        setJob(resolveJobFromResponse(jobResp));
        if (profileResp) setBusinessProfile(profileResp);
      } catch (err) {
        if (alive) setError(err?.message || "Failed to load document.");
      }
      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [open, jobCardId, jobOverride, fetchJobCard, fetchBusinessProfile, businessProfileOverride]);

  useEffect(() => {
    if (!open || !jobOverride) return;
    setError("");
    setLoading(false);
    setJob(jobOverride);
    if (businessProfileOverride) setBusinessProfile(businessProfileOverride);
  }, [open, jobOverride, businessProfileOverride]);

  const business = pickBusiness(job, businessProfile);
  const countryCode =
    countryCodeOverride ??
    getCallingCodeFromProfileResponse(businessProfile) ??
    "+1";

  if (!open) return null;

  return createPortal(
    <div className="invoice-viewer-backdrop" onClick={onClose} role="presentation">
      <div
        className="invoice-viewer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={variant === "invoice" ? "Invoice" : "Job card"}
      >
        {loading ? <InvoiceViewerSkeleton /> : null}
        {error ? <div className="invoice-viewer-state invoice-viewer-state-error">{error}</div> : null}
        {!loading && !error && job ? (
          <InvoiceDocument
            job={job}
            business={business}
            variant={variant}
            actionsSlot={actions}
            countryCode={countryCode}
            apiBaseUrl={apiBaseUrl}
            defaultLogoUrl={defaultLogoUrl}
          />
        ) : null}
        {footer ? (
          <div
            className={`invoice-viewer-panel-footer${
              stickyFooter ? "" : " invoice-viewer-panel-footer-static"
            }${footerClassName ? ` ${footerClassName}` : ""}`}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

/** Invoice template viewer (Invoices → View Invoice). */
export function InvoiceViewerDialog(props) {
  return <InvoiceJobCardViewer {...props} variant="invoice" />;
}

/** Job card template viewer (Job Cards / Invoices → View Job Card). */
export function JobCardViewerDialog(props) {
  return <InvoiceJobCardViewer {...props} variant="jobcard" />;
}

/** Inline invoice/job-card document (no modal). Use for embedded previews. */
export function InvoiceDocumentView(props) {
  return <InvoiceDocument {...props} />;
}
