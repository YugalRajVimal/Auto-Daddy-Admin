import { useCallback, useEffect, useRef, useState } from "react";
import { getJson } from "../../api/mobileAuth";
import { parseCitiesApiResponse, type UserCity } from "../../lib/carOwnerCities";

type OwnerCityPickerProps = {
  open: boolean;
  onClose: () => void;
  token: string | null;
  selectedId: string | null;
  onSelect: (city: UserCity) => void;
};

export default function OwnerCityPicker({
  open,
  onClose,
  token,
  selectedId,
  onSelect,
}: OwnerCityPickerProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<UserCity[]>([]);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchCities = useCallback(async () => {
    if (!token || !open) return;
    const epoch = ++requestRef.current;
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: "1" });
      if (debouncedSearch) q.set("search", debouncedSearch);
      const res = await getJson<unknown>(`/api/user/cities?${q.toString()}`, token);
      if (epoch !== requestRef.current) return;
      setItems(parseCitiesApiResponse(res.data));
    } finally {
      if (epoch === requestRef.current) setLoading(false);
    }
  }, [debouncedSearch, open, token]);

  useEffect(() => {
    if (!open) return;
    void fetchCities();
  }, [fetchCities, open]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close city picker" onClick={onClose} />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-md flex-col rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ad-purple">Choose your city</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities…"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-ad-purple"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto p-2">
          {loading ? (
            <p className="px-2 py-4 text-center text-sm text-gray-500">Loading cities…</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-gray-500">No cities found.</p>
          ) : (
            <ul>
              {items.map((city) => {
                const active = selectedId === city.id;
                return (
                  <li key={city.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(city);
                        onClose();
                      }}
                      className={`w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                        active ? "bg-ad-green-light font-semibold text-ad-green-dark" : "text-gray-800"
                      }`}
                    >
                      {city.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
