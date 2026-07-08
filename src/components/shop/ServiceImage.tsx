import { useEffect, useState } from "react";
import type { ShopServiceCategory } from "../../types/shopOwner";
import { getServiceName, resolveServiceImage } from "../../lib/dummyServices";

function letterFallback(name: string): string {
  const label = encodeURIComponent(name || "Service");
  return `https://ui-avatars.com/api/?name=${label}&background=e8f5e9&color=006600&size=128&bold=true`;
}

export default function ServiceImage({
  category,
  className = "h-full w-full object-cover",
  alt,
}: {
  category?: ShopServiceCategory | null;
  className?: string;
  alt?: string;
}) {
  const name = category ? getServiceName(category) : "Service";
  const [src, setSrc] = useState(() => resolveServiceImage(category));

  useEffect(() => {
    setSrc(resolveServiceImage(category));
  }, [category]);

  return (
    <img
      src={src}
      alt={alt ?? `${name} image`}
      className={className}
      onError={() => setSrc(letterFallback(name))}
    />
  );
}
