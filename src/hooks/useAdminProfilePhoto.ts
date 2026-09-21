import { useEffect, useState } from "react";
import { normalizeMediaUrl } from "../lib/normalizeMediaUrl";

const API_BASE = import.meta.env.VITE_API_URL || "";

/** Fired by the admin profile page after a save so the header avatar refreshes. */
export const ADMIN_PROFILE_UPDATED_EVENT = "admin-profile-updated";

export function notifyAdminProfileUpdated(profilePhoto: string | null | undefined) {
  window.dispatchEvent(
    new CustomEvent(ADMIN_PROFILE_UPDATED_EVENT, { detail: { profilePhoto: profilePhoto ?? null } }),
  );
}

/** Loads the signed-in admin's profile photo for the header avatar. */
export default function useAdminProfilePhoto(): string | null {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const token = localStorage.getItem("admin-token");

    fetch(`${API_BASE}/api/admin/profile`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `${token}` } : {}),
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!ignore && json?.success) setPhoto(json.data?.profilePhoto ?? null);
      })
      .catch(() => {});

    const onUpdated = (e: Event) => {
      setPhoto((e as CustomEvent<{ profilePhoto: string | null }>).detail?.profilePhoto ?? null);
    };
    window.addEventListener(ADMIN_PROFILE_UPDATED_EVENT, onUpdated);
    return () => {
      ignore = true;
      window.removeEventListener(ADMIN_PROFILE_UPDATED_EVENT, onUpdated);
    };
  }, []);

  return normalizeMediaUrl(photo);
}
