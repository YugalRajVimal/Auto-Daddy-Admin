export function normalizeRole(role: string | null | undefined): string {
  return (role ?? "").toLowerCase().replace(/[-_\s]/g, "");
}

export function isAssociateRole(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  return r === "associate" || r === "businessassociate";
}
