# Invoice & Job Card Viewer (standalone)

Portable copy of **View Invoice** and **View Job Card** from Auto-Daddy Panel.  
No Tailwind, no path aliases — copy this folder into any React web app.

## Files

| File | Purpose |
|------|---------|
| `InvoiceJobCardViewer.jsx` | Main viewer + `InvoiceViewerDialog` + `JobCardViewerDialog` |
| `invoice-job-card-viewer.css` | All styles (plain CSS) |
| `utils.js` | Currency, tax, media URL helpers |
| `mockSampleData.js` | Sample job payload for offline preview |
| `Demo.jsx` | Working preview with two buttons |

## Quick start (preview with mock data)

```jsx
import InvoiceJobCardViewerDemo from "./invoice-job-card-viewer/Demo.jsx";

export default function App() {
  return <InvoiceJobCardViewerDemo />;
}
```

Or open each viewer directly:

```jsx
import { useState } from "react";
import { InvoiceViewerDialog, JobCardViewerDialog } from "./invoice-job-card-viewer/InvoiceJobCardViewer.jsx";
import { SAMPLE_JOB } from "./invoice-job-card-viewer/mockSampleData.js";

function MyPage() {
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setInvoiceOpen(true)}>View Invoice</button>
      <button type="button" onClick={() => setJobOpen(true)}>View Job Card</button>

      <InvoiceViewerDialog
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        job={SAMPLE_JOB}
        countryCode="+1"
      />
      <JobCardViewerDialog
        open={jobOpen}
        onClose={() => setJobOpen(false)}
        job={SAMPLE_JOB}
        countryCode="+1"
      />
    </>
  );
}
```

## Integrate with your API

### Option A — pass job object (simplest)

When you already have the job card JSON from your API:

```jsx
<InvoiceViewerDialog
  open={open}
  onClose={() => setOpen(false)}
  job={jobCardFromApi}
  countryCode="+1"
  apiBaseUrl="https://your-api.example.com"
  defaultLogoUrl="/your-fallback-logo.png"
/>
```

### Option B — fetch by ID

```jsx
<JobCardViewerDialog
  open={open}
  onClose={() => setOpen(false)}
  jobCardId={selectedId}
  countryCode="+1"
  apiBaseUrl="https://your-api.example.com"
  fetchJobCard={async (id) => {
    const res = await fetch(`/api/job-cards/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load job card");
    return res.json();
  }}
  fetchBusinessProfile={async () => {
    const res = await fetch("/api/shop/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }}
/>
```

## Expected job object shape

The viewer reads the same fields as Auto-Daddy:

```js
{
  jobNo: "10428",
  invoiceNumber: "INV-10428",       // invoice view
  createdAt: "2026-06-20T14:30:00Z",
  paymentStatus: "Unpaid",
  paymentMethod: "Online",          // "Online" shows HST on invoice; "Cash" does not
  odometerReading: 45230,
  dueOdometerReading: 45730,
  labourCharge: 85,
  labourDuration: 1.5,
  additionalNotes: "...",
  technicalRemarks: "...",
  totalPayableAmount: 312.45,
  payableAmounts: {
    invoiceTotal: 276.5,
    cash: 276.5,
    online: 312.45,
    gstRate: 13,
    gstAmount: 35.95,
    roundOff: 0,
  },
  business: { businessName, businessLogo, businessAddress, ... },
  customerId: { name, phone, email, address, city, pincode },
  vehicleId: {
    licensePlateNo,
    vin,
    cin,
    make: { name, model },
  },
  services: [
    {
      service: { name: "Maintenance" },
      subServices: [
        {
          name: "Oil Change",
          desc: "Synthetic oil + filter",
          unitPrice: 49.99,
          qty: 1,
          labourCost: 25,
          price: 74.99,
        },
      ],
    },
  ],
  vehiclePhotos: ["Uploads/...", "https://..."],
}
```

Business details can also live on `job.business` or in `businessProfile.data.businessProfile` when using `fetchBusinessProfile`.

## Props reference

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Show/hide modal |
| `onClose` | `function` | Called when backdrop is clicked |
| `variant` | `"invoice"` \| `"jobcard"` | Set via `InvoiceViewerDialog` / `JobCardViewerDialog` |
| `job` | `object` | Job card payload (skips fetch) |
| `jobCardId` | `string` | ID to load when `job` is omitted |
| `fetchJobCard` | `(id) => Promise` | Required with `jobCardId` if `job` is omitted |
| `fetchBusinessProfile` | `() => Promise` | Optional shop profile for logo/currency |
| `businessProfile` | `object` | Pre-loaded profile |
| `countryCode` | `string` | e.g. `"+1"`, `"+91"` for currency formatting |
| `apiBaseUrl` | `string` | Prefix for relative image paths |
| `defaultLogoUrl` | `string` | Fallback logo |
| `actions` | `ReactNode` | Slot inside totals (e.g. payment buttons) |
| `footer` | `ReactNode` | Sticky footer content |

## Dependencies

- `react` (uses `createPortal` — needs `document.body`)
- No other npm packages

## Source mapping

| Standalone | Auto-Daddy Panel |
|------------|------------------|
| `InvoiceJobCardViewer.jsx` | `src/components/common/InvoiceJobCardViewer.jsx` |
| `JobCardViewerDialog` export | `src/components/JobCard/JobCardViewerDialog.jsx` |
| `invoice-job-card-viewer.css` | `src/index.css` (`.invoice-viewer-*` block) |
| `utils.js` | `src/lib/currency.js`, `billingAmounts.js`, `mediaUrl.js` |
