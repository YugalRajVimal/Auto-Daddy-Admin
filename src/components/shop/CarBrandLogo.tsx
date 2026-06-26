import { useEffect, useState } from "react";
import type { ShopCarCompany } from "./forms/ShopProfileEditors";
import { getCarBrandName, resolveCarBrandLogo } from "../../lib/dummyCarBrands";

/** Logo size for the emblem field in add-brand forms. */
export const CAR_BRAND_EMBLEM_LOGO_CLASS = "h-14 w-14 object-contain";

/** Reserved emblem area — keeps the add-brand card height stable before/after selection. */
export const CAR_BRAND_EMBLEM_SLOT_CLASS =
  "flex h-14 w-full items-center";

/** Compact logo slot for grid/list rows. */
export const CAR_BRAND_LIST_LOGO_SLOT_CLASS =
  "flex h-8 w-12 shrink-0 items-center justify-center";

export const CAR_BRAND_LIST_LOGO_CLASS = "max-h-8 max-w-12 object-contain";

function letterFallback(name: string): string {
  const label = encodeURIComponent(name || "Car");
  return `https://ui-avatars.com/api/?name=${label}&background=f3f4f6&color=374151&size=128&bold=true`;
}

export default function CarBrandLogo({
  company,
  className = "max-h-12 max-w-full object-contain",
  alt,
}: {
  company?: ShopCarCompany | null;
  className?: string;
  alt?: string;
}) {
  const name = company ? getCarBrandName(company) : "Car";
  const [src, setSrc] = useState(() => resolveCarBrandLogo(company));

  useEffect(() => {
    setSrc(resolveCarBrandLogo(company));
  }, [company]);

  return (
    <img
      src={src}
      alt={alt ?? `${name} logo`}
      className={className}
      onError={() => setSrc(letterFallback(name))}
    />
  );
}
