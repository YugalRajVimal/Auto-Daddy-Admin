import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../components/admin/ContentPanel";
import { useAuth } from "../../auth";
import { apiMessage, createTeamMember, fetchTeamMembers, updateTeamMember } from "../../lib/shopOwnerMutations";
import { ShopFormPage } from "../../components/shop/forms/ShopFormPage";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    void fetchTeamMembers(token).then((res) => {
      if (!res.ok) return;
      const member = parseMembers(res.data).find(
        (m) => String((m as { _id?: string; id?: string })._id ?? (m as { id?: string }).id) === id
      ) as Record<string, unknown> | undefined;
      if (member) {
        setName(String(member.name ?? ""));
        setEmail(String(member.email ?? ""));
        setPhone(String(member.phone ?? ""));
        setDesignation(String(member.designation ?? ""));
        setIsActive(member.isActive !== false);
      }
      setLoading(false);
    });
  }, [id, token]);

  const handleSave = async () => {
    if (!token) return;
    if (!name.trim() || !phone.trim() || !designation.trim()) {
      toast.error("Name, phone, and designation are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, "").slice(0, 10),
        designation: designation.trim(),
        isActive,
        teamMemberPhoto: photo,
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
        footer={
          <CompactFormFooter
            actionLabel={submitting ? "Saving…" : "Save"}
            onSave={() => void handleSave()}
            onCancel={() => navigate("/shop/team")}
          />
        }
      >
        <CompactFormRow>
          <CompactField label="Name" required>
            <input className={compactInputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />
          </CompactField>
          <CompactField label="Designation" required>
            <input className={compactInputClass} value={designation} onChange={(e) => setDesignation(e.target.value)} maxLength={30} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Phone" required>
            <input className={compactInputClass} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </CompactField>
          <CompactField label="Email">
            <input className={compactInputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Photo">
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </CompactField>
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
