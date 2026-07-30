import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AttachImageCheckbox from "../../components/admin/AttachImageCheckbox";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
} from "../../components/admin/ContentPanel";
import { shopCompactInputClass } from "../../components/shop/shopLayoutStyles";
import { useAuth } from "../../auth";
import { apiMessage, createTeamMember, fetchTeamMembers, updateTeamMember } from "../../lib/shopOwnerMutations";
import { formatPhoneDisplay, phoneDigits } from "../../lib/phoneFormat";
import { ShopFormPage } from "../../components/shop/forms/ShopFormPage";
import { FormFieldError, fieldErrorClass, toastValidationSummary } from "../../lib/validation/formUi";
import { teamMemberSchema, type TeamMemberValues } from "../../lib/validation/schemas/identity";

function parseMembers(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;
  const arr = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (data as Record<string, unknown>).teamMembers ?? (data as Record<string, unknown>).data
      : root.teamMembers;
  return Array.isArray(arr) ? arr : [];
}

export default function ShopTeamMemberFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEdit = Boolean(id);
  const [isActive, setIsActive] = useState(true);
  const [attachPhoto, setAttachPhoto] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TeamMemberValues>({
    resolver: zodResolver(teamMemberSchema),
    mode: "onSubmit",
    defaultValues: { name: "", email: "", phone: "", designation: "" },
  });

  useEffect(() => {
    if (!token || !id) return;
    void fetchTeamMembers(token).then((res) => {
      if (!res.ok) return;
      const member = parseMembers(res.data).find(
        (m) => String((m as { _id?: string; id?: string })._id ?? (m as { id?: string }).id) === id
      ) as Record<string, unknown> | undefined;
      if (member) {
        reset({
          name: String(member.name ?? ""),
          email: String(member.email ?? ""),
          phone: phoneDigits(String(member.phone ?? "")),
          designation: String(member.designation ?? ""),
        });
        setIsActive(member.isActive !== false);
      }
      setLoading(false);
    });
  }, [id, token, reset]);

  const onValid = async (values: TeamMemberValues) => {
    if (!token) return;
    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        email: (values.email ?? "").trim(),
        phone: values.phone,
        designation: values.designation.trim(),
        isActive,
        teamMemberPhoto: attachPhoto ? photo : null,
      };
      const res = isEdit && id
        ? await updateTeamMember(token, id, payload)
        : await createTeamMember(token, payload);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save team member.");
        return;
      }
      toast.success(apiMessage(res.data) || "Saved.");
      navigate("/shop/team");
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    toastValidationSummary(toast.error, formErrors);
  };

  const phoneField = register("phone");
  const phone = watch("phone");

  if (loading) {
    return (
      <ShopFormPage title="Team Member" metaTitle="Team Member | AutoDaddy" backTo="/shop/team">
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      </ShopFormPage>
    );
  }

  return (
    <ShopFormPage
      title={isEdit ? "Edit Team Member" : "Add Team Member"}
      metaTitle="Team Member | AutoDaddy"
      backTo="/shop/team"
    >
      <CompactFormPanel
        focusOnMount
        footer={
          <CompactFormFooter
            actionLabel={
              submitting ? (isEdit ? "Updating…" : "Saving…") : isEdit ? "Update" : "Save"
            }
            onSave={() => void handleSubmit(onValid, onInvalid)()}
            onCancel={() => navigate("/shop/team")}
          />
        }
      >
        <CompactFormRow>
          <CompactField label="Name" required>
            <input
              className={fieldErrorClass(!!errors.name, shopCompactInputClass)}
              {...register("name")}
              maxLength={20}
            />
            <FormFieldError message={errors.name?.message} />
          </CompactField>
          <CompactField label="Designation" required>
            <input
              className={fieldErrorClass(!!errors.designation, shopCompactInputClass)}
              {...register("designation")}
              maxLength={30}
            />
            <FormFieldError message={errors.designation?.message} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Phone" required>
            <input
              className={fieldErrorClass(!!errors.phone, shopCompactInputClass)}
              value={formatPhoneDisplay(phone)}
              onChange={(e) => setValue("phone", phoneDigits(e.target.value), { shouldValidate: false })}
              onBlur={phoneField.onBlur}
              name={phoneField.name}
              ref={phoneField.ref}
            />
            <FormFieldError message={errors.phone?.message} />
          </CompactField>
          <CompactField label="Email">
            <input
              className={fieldErrorClass(!!errors.email, shopCompactInputClass)}
              type="email"
              {...register("email")}
            />
            <FormFieldError message={errors.email?.message} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow className="items-start">
          <AttachImageCheckbox
            label="Attach Image"
            checked={attachPhoto}
            onCheckedChange={setAttachPhoto}
            file={photo}
            onFileChange={setPhoto}
          />
          <CompactField label="Active">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Team member is active
            </label>
          </CompactField>
        </CompactFormRow>
      </CompactFormPanel>
    </ShopFormPage>
  );
}
