function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

function partsDealerDummySvg(title: string, subtitle: string, from: string, to: string): string {
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" role="img">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bg)" />
      <rect x="28" y="36" width="344" height="168" rx="16" fill="rgba(255,255,255,0.14)" />
      <circle cx="120" cy="120" r="34" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="8" />
      <circle cx="120" cy="120" r="12" fill="rgba(255,255,255,0.9)" />
      <rect x="188" y="88" width="148" height="18" rx="9" fill="rgba(255,255,255,0.85)" />
      <rect x="188" y="118" width="112" height="14" rx="7" fill="rgba(255,255,255,0.55)" />
      <rect x="188" y="142" width="132" height="14" rx="7" fill="rgba(255,255,255,0.45)" />
      <text x="200" y="238" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="22" font-weight="700">${safeTitle}</text>
      <text x="200" y="264" text-anchor="middle" fill="rgba(255,255,255,0.88)" font-family="system-ui,sans-serif" font-size="14" font-weight="600">${safeSubtitle}</text>
    </svg>
  `);
}

function salvageDummySvg(partName: string, company: string, from: string, to: string): string {
  const safePart = escapeXml(partName);
  const safeCompany = escapeXml(company);
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" role="img">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bg)" />
      <rect x="36" y="42" width="328" height="156" rx="14" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.28)" stroke-width="2" />
      <rect x="72" y="78" width="256" height="84" rx="10" fill="rgba(255,255,255,0.18)" />
      <rect x="96" y="102" width="88" height="36" rx="6" fill="rgba(255,255,255,0.72)" />
      <rect x="196" y="102" width="108" height="14" rx="7" fill="rgba(255,255,255,0.55)" />
      <rect x="196" y="124" width="76" height="14" rx="7" fill="rgba(255,255,255,0.4)" />
      <rect x="56" y="28" width="84" height="24" rx="12" fill="rgba(155,48,141,0.92)" />
      <text x="98" y="45" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="11" font-weight="700">SALVAGE</text>
      <text x="200" y="238" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="20" font-weight="700">${safePart}</text>
      <text x="200" y="264" text-anchor="middle" fill="rgba(255,255,255,0.88)" font-family="system-ui,sans-serif" font-size="14" font-weight="600">${safeCompany}</text>
    </svg>
  `);
}

const PARTS_DEALER_DUMMY_IMAGES = [
  partsDealerDummySvg("Auto Parts", "Warehouse stock", "#0b6e4f", "#008000"),
  partsDealerDummySvg("Spares Depot", "OEM & aftermarket", "#1d4ed8", "#2563eb"),
  partsDealerDummySvg("Supply Center", "Fast local delivery", "#7c3aed", "#9b308d"),
] as const;

const SALVAGE_DUMMY_IMAGES = [
  salvageDummySvg("Brake Pads", "Toyota", "#166534", "#22c55e"),
  salvageDummySvg("Alternator", "Honda", "#1e40af", "#3b82f6"),
  salvageDummySvg("Headlight", "Ford", "#9a3412", "#f97316"),
  salvageDummySvg("Radiator", "Chevrolet", "#374151", "#6b7280"),
] as const;

export function partsDealerDummyImage(index = 0): string {
  return PARTS_DEALER_DUMMY_IMAGES[index % PARTS_DEALER_DUMMY_IMAGES.length];
}

export function salvageDummyImage(index = 0): string {
  return SALVAGE_DUMMY_IMAGES[index % SALVAGE_DUMMY_IMAGES.length];
}

export function withPartsDealerDummyImages<
  T extends { name: string; imageUrl?: string; specialty?: string },
>(dealers: T[]): T[] {
  return dealers.map((dealer, index) => ({
    ...dealer,
    imageUrl: dealer.imageUrl?.trim() || partsDealerDummyImage(index),
  }));
}

export function withSalvageDummyImages<
  T extends { partName: string; company: string; imageUrl?: string },
>(deals: T[]): T[] {
  return deals.map((deal, index) => ({
    ...deal,
    imageUrl: deal.imageUrl?.trim() || salvageDummyImage(index),
  }));
}
