import { StackScreenFrame, useToast } from "@/components/reusables";
import { TeamMemberEditor } from "@/components/team";
import { colors } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useTeamMembers } from "@/hooks/profile/use-team-members";
import type { TeamMemberPayload } from "@/types/team-member";
import { digitsFromNationalPhoneDisplay, formatNationalPhoneDisplay } from "@/lib/national-phone-format";
import { digitsOnly, isValidEmail } from "@/lib/validation";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { navigateBackTarget, resolveShopOwnerBackTo } from "@/lib/shop-owner-navigation";

type Params = {
  mode?: string;
  backTo?: string;
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  designation?: string;
  photo?: string;
  active?: string;
};

const EMPTY_TEAM_MEMBER_FORM: TeamMemberPayload = {
  name: "",
  phone: "",
  email: "",
  designation: "",
  isActive: true,
};

export default function TeamMemberPage() {
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const params = useLocalSearchParams<Params>();
  const mode = params.mode === "edit" ? "edit" : "add";
  const backTo = resolveShopOwnerBackTo(params.backTo, undefined, "/(shop-owner)/teams");
  const memberId = typeof params.id === "string" ? params.id : null;
  const isAutoShopOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";

  const teamToast = useCallback(
    (message: string, type: "error" | "success") => showToast(message, { type }),
    [showToast]
  );

  const { createTeamMember, updateTeamMember, submitting } = useTeamMembers(
    [],
    token,
    isAutoShopOwner,
    teamToast
  );

  const initialForm = useMemo<TeamMemberPayload>(
    () => ({
      name: typeof params.name === "string" ? params.name : "",
      phone:
        typeof params.phone === "string"
          ? formatNationalPhoneDisplay(digitsFromNationalPhoneDisplay(params.phone))
          : "",
      email: typeof params.email === "string" ? params.email : "",
      designation: typeof params.designation === "string" ? params.designation : "",
      isActive: params.active !== "false",
    }),
    [params.active, params.designation, params.email, params.name, params.phone]
  );

  const [form, setForm] = useState<TeamMemberPayload>(initialForm);
  const [active, setActive] = useState(params.active !== "false");
  const initialPhoto = useMemo(() => {
    const raw = typeof params.photo === "string" ? params.photo.trim() : "";
    return normalizeMediaUrl(raw || null) ?? raw;
  }, [params.photo]);
  const [photoUri, setPhotoUri] = useState<string>(initialPhoto);
  const [photoMime, setPhotoMime] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit") {
      setForm(initialForm);
      setActive(params.active !== "false");
      setPhotoUri(initialPhoto);
      setPhotoMime(null);
      setPhotoFileName(null);
    }
  }, [initialForm, initialPhoto, mode, params.active]);

  useFocusEffect(
    useCallback(() => {
      if (mode === "add") {
        setForm(EMPTY_TEAM_MEMBER_FORM);
        setActive(true);
        setPhotoUri("");
        setPhotoMime(null);
        setPhotoFileName(null);
      }
      return undefined;
    }, [mode])
  );

  // Back behavior is standardized in `StackScreenFrame` via `backTo`.

  function setField(field: Exclude<keyof TeamMemberPayload, "isActive">, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: digitsOnly(form.phone).slice(0, 10),
      designation: form.designation.trim(),
      isActive: active,
      teamMemberPhotoUri: photoUri,
      teamMemberPhotoMimeType: photoMime,
      teamMemberPhotoFileName: photoFileName,
    };
    if (!payload.name) {
      showToast("Name is required.", { type: "error" });
      return;
    }
    if (payload.name.length > 20) {
      showToast("Name must be at most 20 characters.", { type: "error" });
      return;
    }
    if (!payload.phone || payload.phone.length !== 10) {
      showToast("Phone number must be 10 digits.", { type: "error" });
      return;
    }
    if (!payload.designation) {
      showToast("Designation is required.", { type: "error" });
      return;
    }
    if (payload.designation.length > 30) {
      showToast("Designation must be at most 30 characters.", { type: "error" });
      return;
    }
    if (payload.email && !isValidEmail(payload.email)) {
      showToast("Enter a valid email address.", { type: "error" });
      return;
    }
    const ok = mode === "edit" && memberId
      ? await updateTeamMember(memberId, payload)
      : await createTeamMember(payload);
    if (ok) {
      navigateBackTarget(backTo);
    }
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast("Please allow gallery access to select a photo.", { type: "error" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) {
      return;
    }
    const picked = result.assets[0];
    setPhotoUri(picked.uri);
    setPhotoMime(picked.mimeType ?? null);
    setPhotoFileName(picked.fileName ?? null);
  }

  return (
    <StackScreenFrame
      title={mode === "edit" ? "Edit Member" : "Add Member"}
      backgroundColor={colors.bgProfile}
      backTo={backTo}
    >
      <TeamMemberEditor
        mode={mode}
        photoUri={photoUri}
        name={form.name}
        email={form.email}
        phone={form.phone}
        designation={form.designation}
        active={active}
        submitting={submitting}
        onPickPhoto={() => void handlePickPhoto()}
        onNameChange={(value) => setField("name", value)}
        onEmailChange={(value) => setField("email", value)}
        onPhoneChange={(value) => setField("phone", value)}
        onDesignationChange={(value) => setField("designation", value)}
        onActiveChange={setActive}
        onSubmit={() => void handleSubmit()}
      />
    </StackScreenFrame>
  );
}
