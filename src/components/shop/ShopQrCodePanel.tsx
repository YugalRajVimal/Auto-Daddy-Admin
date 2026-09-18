import { useMemo, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-toastify";
import DashboardPanelCard from "../COMP";

type ShopQrCodePanelProps = {
  slug?: string | null;
  businessName?: string | null;
};

/** Builds the public shop-profile URL the QR code should resolve to. */
function buildPublicShopUrl(slug: string): string {
  // /s/:slug is a route in this same web app (see App.tsx), so the QR
  // always points at wherever this admin panel is actually deployed.
  return `${window.location.origin}/s/${slug}`;
}

export default function ShopQrCodePanel({ slug, businessName }: ShopQrCodePanelProps) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const publicUrl = useMemo(() => (slug ? buildPublicShopUrl(slug) : null), [slug]);

  function handleDownload() {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${slug || "shop"}-qr-code.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function handleCopyLink() {
    if (!publicUrl) return;
    navigator.clipboard
      .writeText(publicUrl)
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Could not copy link."));
  }

  return (
    <DashboardPanelCard className="mb-0">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div>
          <h3 className="text-base font-bold text-gray-900">Your shop's QR code</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-600">
            Print this and put it up at your counter. Customers scan it to see{" "}
            {businessName ? <span className="font-semibold">{businessName}</span> : "your shop"}
            's public profile and add you to their favourites — no app install needed.
          </p>
        </div>

        {publicUrl ? (
          <>
            <div
              ref={canvasWrapRef}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <QRCodeCanvas value={publicUrl} size={200} level="M" includeMargin />
            </div>

            <p className="max-w-xs break-all text-xs text-gray-400">{publicUrl}</p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-md bg-ad-green px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-ad-green-dark"
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Copy Link
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Preview Page
              </a>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Generating your shop's link... refresh this page in a moment if it doesn't appear.
          </p>
        )}
      </div>
    </DashboardPanelCard>
  );
}