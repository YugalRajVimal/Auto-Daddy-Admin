type PrintAdminTableOptions = {
  title?: string;
  headers: string[];
  rows: string[][];
};

function escapeHtml(value: string): string {
  return value
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

/** Opens a print dialog with only the provided table data (no portal chrome). */
export function printAdminTable({ title, headers, rows }: PrintAdminTableOptions): void {
  if (rows.length === 0) return;

  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyHtml = rows
    .map(
      (cells) =>
        `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
    )
    .join("");

  const titleHtml = title ? `<h1>${escapeHtml(title)}</h1>` : "";
  const documentTitle = escapeHtml(title ?? "Print");
  const html = `<!DOCTYPE html>
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
  <script>
    window.onload = function () {
      window.print();
      window.onafterprint = function () { window.close(); };
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
