const CASE_MANAGEMENT_ROLES = new Set(["admin", "attorney", "law_firm"]);

export function normalizeRole(role: string | null | undefined): string | null {
  if (!role) {
    return null;
  }

  const normalized = role
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized.length ? normalized : null;
}

export function hasCaseManagementAccess(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  if (!normalized) {
    return false;
  }
  return CASE_MANAGEMENT_ROLES.has(normalized);
}

export { CASE_MANAGEMENT_ROLES };
