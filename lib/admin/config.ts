export const ADMIN_EMAILS = new Set<string>(["specopsrecon82@gmail.com"]);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return ADMIN_EMAILS.has(email.toLowerCase());
}
