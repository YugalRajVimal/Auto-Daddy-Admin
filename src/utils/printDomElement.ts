function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Collect CSS text from document stylesheets (same-origin only). */
function collectDocumentCss(): string {
  const parts: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        // Skip app @media print rules — they hide everything except #report-print-area
        // and would blank out this isolated print document.
        if (rule.type === CSSRule.MEDIA_RULE) {
          const mediaText = (rule as CSSMediaRule).media.mediaText;
          if (/\bprint\b/i.test(mediaText)) continue;
        }
        parts.push(rule.cssText);
      }
    } catch {
      // Cross-origin sheets throw; skip them.
    }
  }
  return parts.join("\n");
}

function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  if (images.length === 0) return Promise.resolve();
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  ).then(() => undefined);
}

function schedulePrint(targetWindow: Window, onDone?: () => void): void {
  const runPrint = () => {
    void waitForImages(targetWindow.document).then(() => {
      setTimeout(() => {
        targetWindow.focus();
        targetWindow.print();
        targetWindow.onafterprint = () => {
          onDone?.();
          if (targetWindow !== window) {
            targetWindow.close();
          }
        };
      }, 50);
    });
  };

  if (targetWindow.document.readyState === "complete") {
    setTimeout(runPrint, 50);
    return;
  }

  targetWindow.addEventListener("load", () => setTimeout(runPrint, 50), { once: true });
}

function printWithIframe(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  // Non-zero size — 0×0 iframes often print a blank page in Chromium.
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:816px;height:1056px;border:0;opacity:0;pointer-events:none;z-index:-1";
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    document.body.removeChild(iframe);
    return;
  }

  frameWindow.document.open();
  frameWindow.document.write(html);
  frameWindow.document.close();

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };
  schedulePrint(frameWindow, cleanup);
  setTimeout(cleanup, 60_000);
}

function printHtmlDocument(html: string): void {
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

/**
 * Print a single DOM node in an isolated document (no app chrome / blank pages).
 * Builds a self-contained HTML page with copied styles so colors/backgrounds render.
 */
export function printDomElement(element: HTMLElement, title = "Print"): void {
  const css = collectDocumentCss();
  const markup = element.outerHTML.replace(
    /id="shop-job-card-estimate-print"/,
    'id="shop-job-card-estimate-print" data-print-root="true"',
  );

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
${css}
  </style>
  <style>
    @page { margin: 12mm; size: auto; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      height: auto !important;
      overflow: visible !important;
    }
    body, body * {
      visibility: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    #shop-job-card-estimate-print,
    [data-print-root] {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: hidden !important;
      background: #fff !important;
    }
  </style>
</head>
<body>
  ${markup}
</body>
</html>`;

  printHtmlDocument(html);
}
