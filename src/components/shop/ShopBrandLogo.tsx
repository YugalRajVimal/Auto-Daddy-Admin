import { useEffect, useState } from "react";
import { Skeleton } from "../common/Skeleton";

type ShopBrandLogoProps = {
  src?: string | null;
  alt?: string;
  className?: string;
};

const LOGO_BOX_CLASS =
  "relative aspect-square size-16 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100 sm:size-[72px] md:size-20";

export default function ShopBrandLogo({
  src,
  alt = "Business logo",
  className = "",
}: ShopBrandLogoProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const trimmed = src?.trim() ?? "";
  const hasSrc = Boolean(trimmed) && !failed;
  const showSkeleton = !hasSrc || !loaded;

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [trimmed]);

  return (
    <div className={`${LOGO_BOX_CLASS} ${className}`} aria-label={alt}>
      {showSkeleton ? (
        <Skeleton
          className="absolute inset-0 rounded-none"
          pulse={hasSrc && !loaded}
        />
      ) : null}
      {hasSrc ? (
        <img
          src={trimmed}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
