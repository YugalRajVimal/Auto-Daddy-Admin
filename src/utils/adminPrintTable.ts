type PrintAdminTableOptions = {
  title?: string;
  headers: string[];
  rows: string[][];
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PRINT_TABLE_STYLES = `
  body { font-family: Outfit, sans-serif; margin: 24px; color: #101828; }
  h1 { font-size: 18px; margin: 0 0 16px; color: #2c8c2c; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #9b308d; color: #fff; border: 1px solid #7a256f; padding: 8px 12px; text-align: left; }
  td { border: 1px solid #d0d5dd; padding: 8px 12px; vertical-align: top; }
  tr:nth-child(even) td { background: #f2f4f7; }
  @media print { body { margin: 0; } }
`;

function buildPrintHtml({ title, headers, rows }: PrintAdminTableOptions): string {
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyHtml = rows
    .map(
      (cells) =>
        `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
    )
    .join("");

  const titleHtml = title ? `<h1>${escapeHtml(title)}</h1>` : "";
  const documentTitle = escapeHtml(title ?? "Print");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${documentTitle}</title>
  <style>${PRINT_TABLE_STYLES}</style>
</head>
<body>
  ${titleHtml}
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
</body>
</html>`;
}

function schedulePrint(targetWindow: Window): void {
  const runPrint = () => {
    targetWindow.focus();
    targetWindow.print();
    targetWindow.onafterprint = () => {
      if (targetWindow !== window) {
        targetWindow.close();
      }
    };
  };

  // Keep this short so print() still runs while the click gesture is active.
  if (targetWindow.document.readyState === "complete") {
    setTimeout(runPrint, 50);
    return;
  }

  targetWindow.addEventListener("load", () => setTimeout(runPrint, 50), { once: true });
}

function printWithIframe(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    document.body.removeChild(iframe);
    return;
  }

  frameWindow.document.open();
  frameWindow.document.write(html);
  frameWindow.document.close();
  schedulePrint(frameWindow);

  setTimeout(() => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  }, 60_000);
}

function printHtmlDocument(html: string): void {
  // Must not use noopener — it returns null and leaves a blank tab with no content.
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    printWithIframe(html);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  schedulePrint(printWindow);
}

/** Opens a print dialog with only the provided table data (no portal chrome). */
export function printAdminTable(options: PrintAdminTableOptions): void {
  printHtmlDocument(buildPrintHtml(options));
}
