import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { formatPhoneDisplay } from "../../lib/phoneFormat";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { dealId, shopDealDiscountLabel as formatShopDealDiscount } from "../../lib/shopOwnerParsers";
import type { ShopDeal } from "../../types/shopOwner";

type DealSectionId = "service" | "parts" | "salvage";

type DealGroup = {
  key: string;
  title: string;
  inventoryLabel: string;
  offerEndDate?: string;
  deals: ShopDeal[];
};

const BOARD_CHECKBOX_CLASS = "h-3.5 w-3.5 accent-ad-purple";

function dealMode(deal: ShopDeal): "service" | "parts" {
  if (deal.dealType?.toLowerCase() === "parts" || deal.partName) return "parts";
  return "service";
}

function shopDealTitle(deal: ShopDeal): string {
  if (dealMode(deal) === "parts") {
    return deal.partName?.trim() || deal.productName?.trim() || "Deal";
  }
  return (
    deal.subServiceName?.trim() ||
    deal.productName?.trim() ||
    deal.description?.trim() ||
    deal.service?.name?.trim() ||
    "Deal"
  );
}

function shopDealDiscountLabel(deal: ShopDeal): string | null {
  const label = formatShopDealDiscount(deal, "");
  return label || null;
}

function dealDiscountHeading(deal: ShopDeal): string {
  const description = deal.description?.trim();
  if (description) return description;
  const discount = shopDealDiscountLabel(deal);
  if (discount) {
    return dealMode(deal) === "parts" ? discount : `Overall ${discount} discount`;
  }
  return "Special offer";
}

function dealVehicleRowLabel(deal: ShopDeal): string {
  const vehicle = deal.selectedVehicle;
  if (!vehicle) return deal.productName?.trim() || "—";
  const model = vehicle.model?.trim();
  const year = vehicle.year?.trim();
  const name = vehicle.vehicleName?.trim() || vehicle.name?.trim();
  if (model && year) return `${model} - ${year}`;
  if (model) return model;
  if (name && year) return `${name} - ${year}`;
  return name || year || "—";
}

function dealAttachmentUrl(deal: ShopDeal): string | null {
  return normalizeMediaUrl(deal.dealImage ?? deal.productImage);
}

function formatOfferBannerDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatWebsiteLabel(url?: string): string {
  if (!url) return "";
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function inventoryLabel(section: DealSectionId): string {
  if (section === "salvage") return "Salvage";
  if (section === "service") return "Service";
  return "New";
}

function groupDeals(deals: ShopDeal[], section: DealSectionId): DealGroup[] {
  const groups = new Map<string, DealGroup>();
  for (const deal of deals) {
    const title = shopDealTitle(deal);
    const key = title.toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.deals.push(deal);
      const end = deal.offersEndOnDate;
      if (end && (!existing.offerEndDate || end > existing.offerEndDate)) {
        existing.offerEndDate = end;
      }
    } else {
      groups.set(key, {
        key,
        title,
        inventoryLabel: inventoryLabel(section),
        offerEndDate: deal.offersEndOnDate,
        deals: [deal],
      });
    }
  }
  return Array.from(groups.values());
}

function dealDetailRows(section: DealSectionId) {
  if (section === "salvage") {
    return [
      { label: "Installation", value: "YES" },
      { label: "Stock", value: "YES" },
      { label: "Condition", value: "Salvage" },
    ];
  }
  if (section === "service") {
    return [
      { label: "Booking", value: "YES" },
      { label: "Available", value: "YES" },
      { label: "Type", value: "Service" },
    ];
  }
  return [
    { label: "Installation", value: "YES" },
    { label: "Stock", value: "YES" },
    { label: "Condition", value: "New" },
  ];
}

function ShopDealsBoardCard({
  group,
  section,
  businessName,
  businessPhone,
  website,
  selectedIds,
  onToggleRow,
  onEdit,
}: {
  group: DealGroup;
  section: DealSectionId;
  businessName: string;
  businessPhone: string;
  website?: string;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onEdit: (deal: ShopDeal) => void;
}) {
  const websiteLabel = formatWebsiteLabel(website);
  const websiteHref = website
    ? website.startsWith("http")
      ? website
      : `https://${website}`
    : undefined;
  const detailRows = dealDetailRows(section);
  const showVehicleColumn = section !== "service";

  return (
    <article className="mx-auto w-full max-w-3xl overflow-hidden rounded border border-gray-400 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-gray-300 px-4 py-3 sm:grid-cols-2 sm:items-start">
        <div className="min-w-0">
          <p className="truncate font-serif text-2xl font-bold italic text-ad-purple">{businessName}</p>
          {businessPhone ? (
            <p className="mt-0.5 text-sm font-semibold text-blue-700">{formatPhoneDisplay(businessPhone)}</p>
          ) : null}
        </div>
        <div className="min-w-0 sm:text-right">
          <p className="text-lg font-extrabold uppercase tracking-wide text-blue-800">{group.title}</p>
          <p className="text-sm font-semibold text-red-600">
            Inventory : {section === "salvage" ? "Salvage" : section === "service" ? "Service" : group.inventoryLabel}
          </p>
        </div>
      </div>

      <div className="border-b border-gray-300 bg-[#ececec] px-4 py-4 text-center">
        <p className="text-xl font-bold text-ad-purple sm:text-2xl">
          Active offer upto {formatOfferBannerDate(group.offerEndDate)}
        </p>
        <p className="mt-1 text-sm font-semibold text-blue-700">Just say Hello on Mobile App</p>
      </div>

      <div>
        {group.deals.map((deal) => {
          const id = dealId(deal);
          const imageUrl = dealAttachmentUrl(deal);
          return (
            <div
              key={id}
              className="grid gap-4 border-b border-gray-200 px-4 py-4 last:border-b-0 sm:grid-cols-[148px_minmax(0,1fr)] sm:items-start"
            >
              <div className="relative text-center">
                <label className="absolute left-0 top-0 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(id)}
                    onChange={() => onToggleRow(id)}
                    aria-label={`Select ${dealVehicleRowLabel(deal)}`}
                    className={BOARD_CHECKBOX_CLASS}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => onEdit(deal)}
                  className="mx-auto block w-full max-w-[124px] text-center"
                >
                  <span className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden border border-gray-400 bg-white p-2">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs font-semibold text-gray-400">No image</span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs font-bold uppercase text-gray-800">
                    {showVehicleColumn ? dealVehicleRowLabel(deal) : deal.productName?.trim() || group.title}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onEdit(deal)}
                className="min-w-0 text-left"
              >
                <p className="text-lg font-bold text-[#008000] sm:text-xl">{dealDiscountHeading(deal)}</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-900">
                  {detailRows.map((row) => (
                    <li key={row.label}>
                      {row.label} : <span className="font-semibold text-red-600">{row.value}</span>
                    </li>
                  ))}
                </ul>
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-[#ececec] px-4 py-3 text-center text-sm">
        <p className="font-semibold text-gray-700">SEE ALL BUSINESS WEEK OFFERS ON OUR WEBSITE &gt;&gt;</p>
        {websiteHref && websiteLabel ? (
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-semibold text-[#008000] underline hover:text-ad-purple"
          >
            {websiteLabel}
          </a>
        ) : (
          <p className="mt-1 font-semibold text-gray-500">Add your website from My Website</p>
        )}
      </div>
    </article>
  );
}

export function ShopDealsBoardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 rounded border border-gray-300 bg-white p-6 shadow-sm">
      <div className="h-6 w-2/5 rounded bg-gray-200" />
      <div className="h-10 rounded bg-gray-100" />
      <div className="grid gap-4 sm:grid-cols-[148px_minmax(0,1fr)]">
        <div className="mx-auto h-24 w-24 rounded border border-gray-200 bg-gray-100" />
        <div className="space-y-2">
          <div className="h-5 w-3/5 rounded bg-gray-200" />
          <div className="h-4 w-2/5 rounded bg-gray-100" />
          <div className="h-4 w-1/3 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export default function ShopDealsBoard({
  deals,
  section,
  selectedIds,
  toolbar,
  businessName,
  businessPhone,
  website,
  onToggleRow,
  onEdit,
}: {
  deals: ShopDeal[];
  section: DealSectionId;
  selectedIds: Set<string>;
  toolbar?: ReactNode;
  businessName: string;
  businessPhone: string;
  website?: string;
  onToggleRow: (id: string) => void;
  onEdit: (deal: ShopDeal) => void;
}) {
  const groups = groupDeals(deals, section);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      {toolbar ?? null}
      <div className="space-y-6 px-3 py-5 sm:px-5 sm:py-6">
        {groups.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No deals in this category.</p>
        ) : (
          groups.map((group) => (
            <ShopDealsBoardCard
              key={group.key}
              group={group}
              section={section}
              businessName={businessName}
              businessPhone={businessPhone}
              website={website}
              selectedIds={selectedIds}
              onToggleRow={onToggleRow}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
