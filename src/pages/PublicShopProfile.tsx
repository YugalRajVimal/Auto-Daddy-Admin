import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import { getPublicJson, postJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import { setPendingRedirect } from "../lib/postAuthRedirect";

// Detail types for full shop info
type MapLocation = {
  lat: number;
  lng: number;
  _id: string;
};

type PerDayOpenHours = {
  day: string; // e.g., "Monday"
  open: string;
  close: string;
  isClosed: boolean;
  _id: string;
};

type SpecialDayOpenHours = {
  date: string;
  open: string;
  close: string;
  isClosed: boolean;
  _id: string;
  createdAt: string;
  updatedAt: string;
};

type PublicShop = {
  _id: string;
  slug: string;
  name?: string;
  logo?: string | null;
  banner?: string | null;
  city?: string | null;
  address?: string | null;
  mapLocation?: MapLocation | null;
  perDayOpenHours?: PerDayOpenHours[];
  specialDayOpenHours?: SpecialDayOpenHours[];
  isBusinessActive?: boolean;
  rating?: number | null;
  ratingCount?: number;
};

type ToggleFavoriteResponse = {
  success?: boolean;
  message?: string;
  action?: "added" | "removed";
};

// Avatar palette logic
const AVATAR_PALETTES = [
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
];

function paletteFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

function initialsFor(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

// Map link generator
function googleMapUrl(lat?: number, lng?: number) {
  if (!lat || !lng) return "";
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function googleMapEmbedUrl(lat?: number, lng?: number, zoom: number = 16) {
  if (lat && lng) {
    return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  }
  return "";
}

// Section sorting helpers
function sortSpecialHours(a: SpecialDayOpenHours, b: SpecialDayOpenHours) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

export default function PublicShopProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token, role, isAuthenticated } = useAuth();

  const [shop, setShop] = useState<PublicShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    getPublicJson<PublicShop>(`/api/public/shop/${encodeURIComponent(slug)}`).then((res) => {
      if (cancelled) return;
      if (!res.ok || !res.data?._id) {
        setNotFound(true);
      } else {
        console.log(res.data);
        setShop(res.data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // If we just came back from login/signup with this shop pending, finish favorite automatically
  useEffect(() => {
    if (!shop || !isAuthenticated || role !== "car_owner" || !token) return;
    const pending = sessionStorage.getItem("autodaddy.pendingRedirect");
    if (!pending) return;
    try {
      const parsed = JSON.parse(pending) as { favShopId?: string };
      if (parsed.favShopId !== shop._id) return;
    } catch {
      return;
    }
    sessionStorage.removeItem("autodaddy.pendingRedirect");
    void favouriteShop(shop._id, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, isAuthenticated, role, token]);

  const palette = useMemo(() => paletteFor(shop?._id ?? "shop"), [shop?._id]);

  async function favouriteShop(shopId: string, authToken: string) {
    setFavBusy(true);
    const res = await postJson<ToggleFavoriteResponse>(
      "/api/user/toggle-auto-shop-fav",
      { autoShopId: shopId },
      authToken
    );
    setFavBusy(false);
    if (!res.ok || res.data?.success === false) {
      toast.error(res.data?.message ?? "Could not update favourite.");
      return;
    }
    const nowFavorite = res.data?.action ? res.data.action === "added" : !isFavorite;
    setIsFavorite(nowFavorite);
    toast.success(nowFavorite ? "Added to your favourites!" : "Removed from favourites.");
  }

  function handleAddToFavourite() {
    if (!shop) return;

    if (isAuthenticated && role === "car_owner" && token) {
      void favouriteShop(shop._id, token);
      return;
    }

    if (isAuthenticated && role !== "car_owner") {
      toast.error("Log in with a car-owner account to favourite this shop.");
      return;
    }

    setPendingRedirect({ returnTo: `/s/${shop.slug}`, favShopId: shop._id });
    navigate("/");
  }

  if (loading) {
    return (
      <div className="-mx-4 flex min-h-[60vh] items-center justify-center bg-white md:-mx-10 lg:-mx-14">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-green" />
      </div>
    );
  }

  if (notFound || !shop) {
    return (
      <div className="-mx-4 flex min-h-[60vh] flex-col items-center justify-center gap-2 bg-white px-4 text-center md:-mx-10 lg:-mx-14">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
          🔍
        </div>
        <h1 className="text-lg font-bold text-gray-800">Shop not found</h1>
        <p className="max-w-xs text-sm text-gray-500">
          This link may be out of date. Please check the QR code or link and try again.
        </p>
      </div>
    );
  }

  // Details
  const locationLine = [shop.address, shop.city].filter(Boolean).join(", ");
  const { mapLocation, perDayOpenHours, specialDayOpenHours } = shop;

  return (
    <div className="-mx-4 flex min-h-screen items-center justify-center bg-gradient-to-b from-ad-mint/40 via-white to-white px-4 pb-10 pt-8 md:-mx-10 md:pt-14 lg:-mx-14">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-t-0 border-gray-100 bg-white px-6 py-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          {/* Logo/avatar card */}
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
              {shop.logo ? (
                <img
                  src={
                    shop.logo.startsWith("http")
                      ? shop.logo
                      : `${import.meta.env.VITE_UPLOADS_URL || ""}${shop.logo.startsWith("/") ? "" : "/"}${shop.logo}`
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center text-2xl font-bold ${palette.bg} ${palette.text}`}
                >
                  {initialsFor(shop.name)}
                </div>
              )}
            </div>
      
          </div>

          {/* Shop Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900">{shop.name}</h1>
            <div className="flex flex-col items-center gap-1 mt-2">
              {locationLine && (
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <span aria-hidden>📍</span>
                  <span className="truncate">{locationLine}</span>
                  {mapLocation?.lat && mapLocation?.lng ? (
                    <a
                      href={googleMapUrl(mapLocation.lat, mapLocation.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 inline-block text-blue-600 hover:underline text-xs"
                    >
                      (Google Maps)
                    </a>
                  ) : null}
                </div>
              )}
              <div className="flex items-center gap-2 justify-center flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    shop.isBusinessActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      shop.isBusinessActive ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                  {shop.isBusinessActive ? "Open now" : "Currently closed"}
                </span>
                {typeof shop.rating === "number" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    ★ {shop.rating.toFixed(1)}
                    <span className="font-normal text-amber-500">
                      ({shop.ratingCount ?? 0} review{shop.ratingCount === 1 ? "" : "s"})
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500">
                    No ratings yet
                  </span>
                )}
              </div>
            </div>
          </div>

              {/* Add to favorite */}
          <button
            type="button"
            onClick={handleAddToFavourite}
            disabled={favBusy}
            className={`mt-0 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold uppercase tracking-wide shadow-sm transition disabled:opacity-60 ${
              isFavorite
                ? "bg-ad-green-dark text-white"
                : "bg-ad-green text-white hover:bg-ad-green-dark"
            }`}
          >
            <span aria-hidden>{isFavorite ? "★" : "☆"}</span>
            {favBusy ? "Please wait…" : isFavorite ? "Favourited" : "Add to Favourite"}
          </button>

          {/* Show Google Map embed if available */}
          {mapLocation?.lat && mapLocation?.lng && (
            <div className="my-8">
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <iframe
                  title="Shop Location Map"
                  src={googleMapEmbedUrl(mapLocation.lat, mapLocation.lng)}
                  width="100%"
                  height="240"
                  style={{ border: 0, display: "block", width: "100%" }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          )}

          {/* Details section */}
          <div className="mb-8">
            <dl className="divide-y divide-gray-100 text-sm">
              {/* <div className="flex justify-between pt-2 pb-2">
                <dt className="font-semibold text-gray-600 w-36">Shop ID</dt>
                <dd className="text-gray-900 break-all">{shop._id}</dd>
              </div>
              <div className="flex justify-between pt-2 pb-2">
                <dt className="font-semibold text-gray-600 w-36">Slug</dt>
                <dd className="text-gray-900 break-all">{shop.slug}</dd>
              </div> */}
              <div className="flex justify-between pt-2 pb-2">
                <dt className="font-semibold text-gray-600 w-36">City</dt>
                <dd className="text-gray-900">{shop.city || <span className="text-gray-400">N/A</span>}</dd>
              </div>
              <div className="flex justify-between pt-2 pb-2">
                <dt className="font-semibold text-gray-600 w-36">Address</dt>
                <dd className="text-gray-900">{shop.address || <span className="text-gray-400">N/A</span>}</dd>
              </div>
              <div className="flex items-baseline justify-between pt-2 pb-2">
                <dt className="font-semibold text-gray-600 w-36">Map Location</dt>
                <dd className="text-gray-900 flex flex-col items-end">
                  {mapLocation ? (
                    <>
                      <span>
                        Lat: <b>{mapLocation.lat}</b>
                      </span>
                      <span>
                        Lng: <b>{mapLocation.lng}</b>
                      </span>
                      <span className="text-xs text-gray-400">ID: {mapLocation._id}</span>
                      <a
                        href={googleMapUrl(mapLocation.lat, mapLocation.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-0.5 text-xs"
                      >
                        Open in Google Maps
                      </a>
                    </>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </dd>
              </div>
              <div className="flex items-start justify-between pt-2 pb-2 gap-6">
                <dt className="font-semibold text-gray-600 w-36">Today/Scheduled Hours</dt>
                <dd className="text-gray-900 flex-1">
                  {specialDayOpenHours && specialDayOpenHours.length > 0 ? (
                    <div className="space-y-1">
                      {specialDayOpenHours
                        .slice()
                        .sort(sortSpecialHours)
                        .map((d) => (
                          <div key={d._id} className="flex items-center gap-3 text-xs">
                            <span className="font-medium">
                              {new Date(d.date).toLocaleDateString(undefined, {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                            {d.isClosed ? (
                              <span className="text-red-500">Closed</span>
                            ) : (
                              <span>
                                {d.open}-{d.close}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    perDayOpenHours && perDayOpenHours.length > 0 ? (
                      <div className="space-y-1">
                        {perDayOpenHours.map((d) => (
                          <div key={d._id} className="flex items-center gap-3 text-xs">
                            <span className="font-medium">{d.day}:</span>
                            {d.isClosed ? (
                              <span className="text-red-500">Closed</span>
                            ) : (
                              <span>
                                {d.open}-{d.close}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )
                  )}
                </dd>
              </div>
              <div className="flex justify-between pt-2 pb-2">
                <dt className="font-semibold text-gray-600 w-36">Business Active</dt>
                <dd className="text-gray-900">
                  {shop.isBusinessActive ? (
                    <span className="text-emerald-700 font-semibold">Yes</span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

      

          <p className="mt-4 text-center text-xs text-gray-400">
            Powered by AutoDaddy
          </p>
        </div>
      </div>
    </div>
  );
}