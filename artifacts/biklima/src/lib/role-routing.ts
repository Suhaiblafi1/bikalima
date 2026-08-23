import type { Role } from "@/hooks/use-me";

export const STAFF_ROLES: readonly Role[] = ["admin", "supervisor", "sales"];

export function isStaffRole(role: Role | null | undefined): boolean {
  return role != null && STAFF_ROLES.includes(role);
}

export function getRoleHome(role: Role | null | undefined): string {
  if (role === "trainer") return "/trainer";
  if (role === "parent") return "/parent";
  if (isStaffRole(role)) return "/admin/overview";
  return "/dashboard";
}

function platformForPath(path: string): "student" | "trainer" | "parent" | "staff" | null {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  if (pathname === "/dashboard" || pathname.startsWith("/courses/") && pathname.endsWith("/learn")) {
    return "student";
  }
  if (pathname === "/trainer" || pathname.startsWith("/trainer/")) return "trainer";
  if (pathname === "/parent" || pathname.startsWith("/parent/")) return "parent";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "staff";
  return null;
}

export function canRoleOpenPath(role: Role, path: string): boolean {
  const platform = platformForPath(path);
  if (platform === null) return true;
  if (platform === "staff") return isStaffRole(role);
  return role === platform;
}

export function sanitizeInternalRedirect(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  const lower = value.toLowerCase();
  const denied = ["/api", "/auth", "/webhooks"];
  if (denied.some((prefix) => lower === prefix || lower.startsWith(`${prefix}/`) || lower.startsWith(`${prefix}?`))) {
    return null;
  }
  return value;
}

export function resolvePostAuthDestination(
  role: Role | null | undefined,
  requestedRedirect?: string | null,
): string {
  const fallback = getRoleHome(role);
  if (!role) return fallback;
  const redirect = sanitizeInternalRedirect(requestedRedirect);
  return redirect && canRoleOpenPath(role, redirect) ? redirect : fallback;
}
