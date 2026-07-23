import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { getJson, putJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../components/admin/ContentPanel";
import {
  formatPincodeDisplay,
  isValidEmail,
  normalizePostalCodeForStorage,
  parseUserProfilePayload,
  PROFILE_ADDRESS_MAX_LENGTH,
  PROFILE_NAME_MAX_LENGTH,
  type UserProfileResponse,
} from "../lib/carOwnerProfile";

type CompleteProfileResponse = {
  message?: string;
  user?: {
    name?: string;
    email?: string;
    isProfileComplete?: boolean;
  };
};

export default function CarOwnerOnboardingPage() {
  const { token, role, session, login, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(session?.profile?.name ?? "");
  const [email, setEmail] = useState(session?.profile?.email ?? "");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== "car_owner") {
      setProfileLoading(false);
      return;
    }
    if (session?.meta?.isProfileComplete === true) {
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setProfileLoading(true);
      try {
        const res = await getJson<UserProfileResponse>("/api/user/profile", token);
        if (cancelled) return;
        const parsed = parseUserProfilePayload(res.data);
        if (!parsed) return;

        if (parsed.name?.trim()) setName(parsed.name.trim());
        if (parsed.email?.trim()) setEmail(parsed.email.trim());
        if (parsed.pincode?.trim()) setPincode(formatPincodeDisplay(parsed.pincode));
        if (parsed.address?.trim()) setAddress(parsed.address.trim());
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, role, session?.meta?.isProfileComplete]);

  if (isLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
      </div>
    );
  }

  if (!token || role !== "car_owner") {
    return <Navigate to="/" replace />;
  }

  if (session?.meta?.isProfileComplete === true) {
    return <Navigate to="/owner" replace />;
  }

  const handleSubmit = async () => {
    if (!token || !session) return;

    const nextName = name.trim().slice(0, PROFILE_NAME_MAX_LENGTH);
    const nextEmail = email.trim();
    const nextPincode = normalizePostalCodeForStorage(pincode);
    const nextAddress = address.trim().slice(0, PROFILE_ADDRESS_MAX_LENGTH);

    if (!nextName || !nextEmail || !nextPincode || !nextAddress) {
      toast.error("Name, email, postal code, and address are required.");
      return;
    }
    if (!isValidEmail(nextEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      const res = await putJson<CompleteProfileResponse>(
        "/api/user/complete-profile",
        {
          name: nextName,
          email: nextEmail,
          pincode: nextPincode,
          role: "carowner",
          address: nextAddress,
        },
        token
      );

      if (!res.ok) {
        toast.error(res.data?.message ?? "Could not complete profile.");
        return;
      }

      login({
        ...session,
        profile: {
          ...session.profile,
          name: res.data?.user?.name ?? nextName,
          email: res.data?.user?.email ?? nextEmail,
        },
        meta: {
          ...session.meta,
          isProfileComplete: true,
        },
      });

      toast.success(res.data?.message ?? "Profile completed.");
      navigate("/owner", { replace: true });
    } catch {
      toast.error("Network error while completing profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center py-10">
      <h1 className="mb-2 text-center font-serif text-2xl font-bold text-gray-900">Complete your profile</h1>
      <p className="mb-6 text-center text-sm text-gray-600">
        Tell us a bit about yourself to finish setting up your AutoDaddy account.
      </p>

      <CompactFormPanel
        footer={
          <CompactFormFooter
            message="First-time car owner setup"
            messageCenter
            actionLabel={saving ? "Saving…" : "Continue"}
            onSave={() => void handleSubmit()}
            onCancel={() => logout(true)}
            cancelLabel="Sign out"
          />
        }
      >
        <CompactFormRow>
          <CompactField label="Full name">
            <input
              type="text"
              value={name}
              maxLength={PROFILE_NAME_MAX_LENGTH}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className={compactInputClass}
              autoComplete="name"
            />
          </CompactField>
          <CompactField label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
              className={compactInputClass}
              autoComplete="email"
            />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Postal code">
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              disabled={saving}
              className={compactInputClass}
              autoComplete="postal-code"
            />
          </CompactField>
          <CompactField label="Address">
            <input
              type="text"
              value={address}
              maxLength={PROFILE_ADDRESS_MAX_LENGTH}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
              className={compactInputClass}
              autoComplete="street-address"
            />
          </CompactField>
        </CompactFormRow>
      </CompactFormPanel>
    </div>
  );
}
