import { API_BASE_URL, logApiRequest } from "@/lib/api";
import { localImageMultipartPart } from "@/lib/local-image-for-form";
import type { TeamMember, TeamMemberPayload } from "@/types/team-member";
import { useCallback, useMemo, useState } from "react";

type TeamApiResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

function toMemberId(member: TeamMember) {
  return member._id ?? member.id ?? null;
}

function parseTeamMembers(payload: unknown): TeamMember[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  const maybeData = root.data;
  const candidates = [
    maybeData,
    root,
    maybeData && typeof maybeData === "object" ? (maybeData as Record<string, unknown>).teamMembers : null,
    maybeData && typeof maybeData === "object" ? (maybeData as Record<string, unknown>).data : null,
    root.teamMembers,
    root.members,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as TeamMember[];
    }
  }
  return [];
}

export function useTeamMembers(
  initialMembers: TeamMember[],
  token: string | null,
  isAutoShopOwner: boolean,
  showToast: (message: string, type: "error" | "success") => void
) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => initialMembers);
  const [submitting, setSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const normalizedBase = useMemo(() => API_BASE_URL.replace(/\/+$/, ""), []);

  const fetchTeamMembers = useCallback(async (silent = false) => {
    if (!token || !isAutoShopOwner) {
      return;
    }
    if (!silent) {
      setIsFetching(true);
    }
    try {
      const url = `${normalizedBase}/api/auto-shop-owner/team-members`;
      logApiRequest("GET", url);
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: token },
      });
      const payload = (await response.json().catch(() => null)) as TeamApiResponse | null;
      if (!response.ok || payload?.success === false) {
        if (!silent) {
          showToast(payload?.message ?? "Failed to load team members.", "error");
        }
        return;
      }
      const next = parseTeamMembers(payload.data ?? payload);
      setTeamMembers(next);
    } catch {
      if (!silent) {
        showToast("Network error while loading team members.", "error");
      }
    } finally {
      if (!silent) {
        setIsFetching(false);
      }
    }
  }, [isAutoShopOwner, normalizedBase, showToast, token]);

  const createTeamMember = useCallback(
    async (data: TeamMemberPayload) => {
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        return false;
      }
      setSubmitting(true);
      const body = new FormData();
      body.append("name", data.name.trim());
      body.append("email", data.email.trim());
      body.append("phone", data.phone.trim());
      body.append("designation", data.designation.trim());
      body.append("isActive", String(Boolean(data.isActive)));
      const photoUri = data.teamMemberPhotoUri?.trim() ?? "";
      const shouldUploadPhoto =
        photoUri.length > 0 && (photoUri.startsWith("file://") || photoUri.startsWith("content://"));
      if (shouldUploadPhoto) {
        const part = localImageMultipartPart(photoUri, {
          mimeType: data.teamMemberPhotoMimeType,
          fileName: data.teamMemberPhotoFileName,
          fallbackBase: "team-member-photo",
        });
        body.append("teamMemberPhoto", { uri: part.uri, name: part.name, type: part.type } as never);
      }
      try {
        const url = `${normalizedBase}/api/auto-shop-owner/team-members`;
        logApiRequest("POST", url, body);
        const response = await fetch(url, {
          method: "POST",
          headers: { Authorization: token },
          body,
        });
        const payload = (await response.json().catch(() => null)) as TeamApiResponse | null;
        if (!response.ok || payload?.success === false) {
          showToast(payload?.message ?? "Failed to add team member.", "error");
          return false;
        }
        showToast(payload?.message ?? "Team member added successfully.", "success");
        await fetchTeamMembers(true);
        return true;
      } catch {
        showToast("Network error while adding team member.", "error");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchTeamMembers, normalizedBase, showToast, token]
  );

  const updateTeamMember = useCallback(
    async (memberId: string, data: TeamMemberPayload) => {
      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        return false;
      }
      setSubmitting(true);
      const body = new FormData();
      body.append("name", data.name.trim());
      body.append("email", data.email.trim());
      body.append("phone", data.phone.trim());
      body.append("designation", data.designation.trim());
      body.append("isActive", String(Boolean(data.isActive)));
      const photoUri = data.teamMemberPhotoUri?.trim() ?? "";
      const shouldUploadPhoto =
        photoUri.length > 0 && (photoUri.startsWith("file://") || photoUri.startsWith("content://"));
      if (shouldUploadPhoto) {
        const part = localImageMultipartPart(photoUri, {
          mimeType: data.teamMemberPhotoMimeType,
          fileName: data.teamMemberPhotoFileName,
          fallbackBase: "team-member-photo",
        });
        body.append("teamMemberPhoto", { uri: part.uri, name: part.name, type: part.type } as never);
      }
      try {
        const url = `${normalizedBase}/api/auto-shop-owner/team-members/${memberId}`;
        logApiRequest("PUT", url, body);
        const response = await fetch(url, {
          method: "PUT",
          headers: { Authorization: token },
          body,
        });
        const payload = (await response.json().catch(() => null)) as TeamApiResponse | null;
        if (!response.ok || payload?.success === false) {
          showToast(payload?.message ?? "Failed to update team member.", "error");
          return false;
        }
        showToast(payload?.message ?? "Team member updated successfully.", "success");
        await fetchTeamMembers(true);
        return true;
      } catch {
        showToast("Network error while updating team member.", "error");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchTeamMembers, normalizedBase, showToast, token]
  );

  const deleteTeamMember = useCallback(
    async (member: TeamMember) => {
      const memberId = toMemberId(member);
      if (!token || !memberId) {
        showToast("Unable to delete team member.", "error");
        return false;
      }
      setSubmitting(true);
      try {
        const url = `${normalizedBase}/api/auto-shop-owner/team-members/${memberId}`;
        logApiRequest("DELETE", url);
        const response = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: token },
        });
        const payload = (await response.json().catch(() => null)) as TeamApiResponse | null;
        if (!response.ok || payload?.success === false) {
          showToast(payload?.message ?? "Failed to delete team member.", "error");
          return false;
        }
        showToast(payload?.message ?? "Team member removed successfully.", "success");
        await fetchTeamMembers(true);
        return true;
      } catch {
        showToast("Network error while deleting team member.", "error");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchTeamMembers, normalizedBase, showToast, token]
  );

  return {
    teamMembers,
    teamMembersCount: teamMembers.length,
    submitting,
    isFetching,
    fetchTeamMembers,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
  };
}
