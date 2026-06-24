import { useEffect, useState } from "react";
import type { ShopCarCompany } from "./forms/ShopProfileEditors";
import { getCarBrandName, resolveCarBrandLogo } from "../../lib/dummyCarBrands";

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
