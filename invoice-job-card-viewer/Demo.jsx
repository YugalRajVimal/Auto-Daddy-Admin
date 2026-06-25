import React, { useState } from "react";
import {
  InvoiceViewerDialog,
  JobCardViewerDialog,
} from "./InvoiceJobCardViewer.jsx";
import { SAMPLE_JOB } from "./mockSampleData.js";

/**
 * Drop this component anywhere in your app to preview both viewers with sample data.
 * No API required.
 */
export default function InvoiceJobCardViewerDemo() {
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [jobCardOpen, setJobCardOpen] = useState(false);

  return (
    <div style={{ padding: 24, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>Invoice &amp; Job Card Viewer</h1>
      <p style={{ margin: "0 0 16px", color: "#555", fontSize: 14 }}>
        Standalone preview — same layout as Auto-Daddy Panel.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setInvoiceOpen(true)}
          style={btnStyle("#42a5f5")}
        >
          View Invoice
        </button>
        <button
          type="button"
          onClick={() => setJobCardOpen(true)}
          style={btnStyle("#2e7d32")}
        >
          View Job Card
        </button>
      </div>

      <InvoiceViewerDialog
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        job={SAMPLE_JOB}
        countryCode="+1"
      />
      <JobCardViewerDialog
        open={jobCardOpen}
        onClose={() => setJobCardOpen(false)}
        job={SAMPLE_JOB}
        countryCode="+1"
      />
    </div>
  );
}

function btnStyle(bg) {
  return {
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    background: bg,
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  };
}
