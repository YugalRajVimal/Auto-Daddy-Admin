import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getJson, putJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../components/admin/ContentPanel";
import { FormFieldError, toastValidationSummary } from "../lib/validation/formUi";
import {
  carOwnerOnboardingSchema,
  type CarOwnerOnboardingValues,
} from "../lib/validation/schemas/identity";
import {
  formatPincodeDisplay,
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

  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors: fieldErrors },
  } = useForm<CarOwnerOnboardingValues>({
    resolver: zodResolver(carOwnerOnboardingSchema),
    mode: "onSubmit",
    defaultValues: {
      name: session?.profile?.name ?? "",
      email: session?.profile?.email ?? "",
      pincode: "",
      address: "",
    },
  });

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

        if (parsed.name?.trim()) setValue("name", parsed.name.trim());
        if (parsed.email?.trim()) setValue("email", parsed.email.trim());
        if (parsed.pincode?.trim()) setValue("pincode", formatPincodeDisplay(parsed.pincode));
        if (parsed.address?.trim()) setValue("address", parsed.address.trim());
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, role, session?.meta?.isProfileComplete, setValue]);

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

  const onValidSubmit = async (values: CarOwnerOnboardingValues) => {
    if (!token || !session) return;

    const nextName = values.name.trim().slice(0, PROFILE_NAME_MAX_LENGTH);
    const nextEmail = values.email.trim();
    const nextPincode = normalizePostalCodeForStorage(values.pincode);
    const nextAddress = values.address.trim().slice(0, PROFILE_ADDRESS_MAX_LENGTH);

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

  const onInvalidSubmit = (formErrors: typeof fieldErrors) => {
    toastValidationSummary(toast.error, formErrors);
  };

  const submitForm = handleSubmit(onValidSubmit, onInvalidSubmit);

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
            onSave={() => void submitForm()}
            onCancel={() => logout(true)}
            cancelLabel="Sign out"
          />
        }
      >
        <CompactFormRow>
          <CompactField label="Full name">
            <input
              type="text"
              maxLength={PROFILE_NAME_MAX_LENGTH}
              disabled={saving}
              className={compactInputClass}
              autoComplete="name"
              {...register("name")}
            />
            <FormFieldError message={fieldErrors.name?.message} />
          </CompactField>
          <CompactField label="Email">
            <input
              type="email"
              disabled={saving}
              className={compactInputClass}
              autoComplete="email"
              {...register("email")}
            />
            <FormFieldError message={fieldErrors.email?.message} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Postal code">
            <input
              type="text"
              disabled={saving}
              className={compactInputClass}
              autoComplete="postal-code"
              {...register("pincode")}
            />
            <FormFieldError message={fieldErrors.pincode?.message} />
          </CompactField>
          <CompactField label="Address">
            <input
              type="text"
              maxLength={PROFILE_ADDRESS_MAX_LENGTH}
              disabled={saving}
              className={compactInputClass}
              autoComplete="street-address"
              {...register("address")}
            />
            <FormFieldError message={fieldErrors.address?.message} />
          </CompactField>
        </CompactFormRow>
      </CompactFormPanel>
    </div>
  );
}
