import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

// Shared React Query layer for the Dashboard. Every /my/* and /me/* fetch
// the dashboard relies on lives here so:
//   • Multiple components mounting on the same tab dedupe automatically.
//   • Per-tab fetches stay parallel (RQ fires them as soon as `enabled`
//     flips on instead of awaiting the previous one).
//   • A single `invalidateDashboard()` call refreshes everything after a
//     mutation (lesson completion, profile update, etc).

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

// ── Types (kept loose so call-sites can refine via their own interfaces) ──

export type DashCourse = {
  enrollmentId: string;
  courseId: string;
  programId: string | null;
  slug: string | null;
  status: string;
  titleAr: string;
  titleEn: string;
  titleFr: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  descriptionFr: string | null;
  imageUrl: string | null;
  lessons: { id: string; titleAr: string; titleEn: string; titleFr: string; videoUrl: string | null; videoType: string; durationMinutes: number | null; sortOrder: number }[];
  progress: { lessonId: string; completed: boolean }[];
};

export type DashOrder = {
  id: string;
  workbookId: string;
  quantity: number;
  format: string;
  buyerName: string;
  buyerEmail: string;
  totalPrice: number | null;
  status: string;
  createdAt: string;
};

export type DashLmsOrder = {
  id: string;
  courseId: string | null;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  amount: number | null;
  currency: string;
  status: string;
  paymentNotes: string | null;
  createdAt: string;
};

export type DashRequest = {
  id: string;
  applicantType: string;
  fullName: string;
  programId: string;
  status: string;
  createdAt: string;
};

export type DashNextLesson = {
  enrollmentId: string;
  courseId: string;
  courseSlug: string | null;
  courseTitleAr: string;
  courseTitleEn: string;
  lessonId: string;
  lessonTitleAr: string;
  lessonTitleEn: string;
  durationMinutes: number | null;
} | null;

export type DashAttendanceByCourse = Record<
  string,
  { present: number; absent: number; excused: number; tracked: number }
>;

export type DashOwnedWorkbook = {
  orderId: string;
  workbookId: string;
  slug: string | null;
  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  coverImageUrl: string | null;
  samplePdfUrl: string | null;
  format: string;
  status: string;
};

export type DashBadge = {
  key: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  icon: string;
  colorClass: string;
  earned: boolean;
  earnedAt: string | null;
};

export type DashBadgesResponse = {
  badges: DashBadge[];
  earnedCount: number;
  totalCount: number;
};

export type DashCertificate = {
  id: string;
  code: string;
  status: string;
  certType: string;
  programName: string | null;
  issueDate: string;
  expiryDate: string | null;
  certificateFileUrl: string | null;
};

export type DashEvaluation = {
  id: string;
  status: "pending" | "in_review" | "completed" | "converted" | "cancelled";
  speechTopic: string | null;
  videoUrl: string | null;
  transcriptText: string | null;
  rubricScores: Record<string, number> | null;
  rubricNotes: Record<string, string> | null;
  overallScore: number | null;
  programRecommendation: "core" | "tot" | "teachers" | "children" | "none" | null;
  finalReportMd: string | null;
  reportPublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ── Query keys ──
//
// Every key is scoped by user id so cached results from a previous account
// in the same SPA session can never leak into another account's view after
// logout/login. The hooks below all accept `userId` and refuse to fetch
// when it's null/undefined.

type Uid = string | null | undefined;

export const DASH_KEYS = {
  all: (uid: Uid) => ["dashboard", uid ?? "anon"] as const,
  courses: (uid: Uid) => ["dashboard", uid ?? "anon", "courses"] as const,
  nextLesson: (uid: Uid) => ["dashboard", uid ?? "anon", "next-lesson"] as const,
  enrollmentRequests: (uid: Uid) => ["dashboard", uid ?? "anon", "enrollment-requests"] as const,
  attendanceSummary: (uid: Uid) => ["dashboard", uid ?? "anon", "attendance-summary"] as const,
  orders: (uid: Uid) => ["dashboard", uid ?? "anon", "orders"] as const,
  workbookOrders: (uid: Uid) => ["dashboard", uid ?? "anon", "workbook-orders"] as const,
  workbooks: (uid: Uid) => ["dashboard", uid ?? "anon", "workbooks"] as const,
  badges: (uid: Uid) => ["dashboard", uid ?? "anon", "badges"] as const,
  certificates: (uid: Uid) => ["dashboard", uid ?? "anon", "certificates"] as const,
  evaluations: (uid: Uid) => ["dashboard", uid ?? "anon", "evaluations"] as const,
  adminCheck: (uid: Uid) => ["dashboard", uid ?? "anon", "admin-check"] as const,
} as const;

function gate(userId: Uid, extra?: boolean): boolean {
  if (!userId) return false;
  return extra === undefined ? true : extra;
}

// Default options shared by every dashboard query: a short stale window
// covers the burst of mounts during tab switches without serving stale
// data once the user comes back later.
const DEFAULTS = {
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  refetchOnMount: false as const,
  refetchOnWindowFocus: false as const,
};

// ── Hooks ──

export function useMyCourses(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.courses(userId),
    queryFn: () => fetchJson<{ courses: DashCourse[] }>(`${getApiBase()}/my/courses`, { courses: [] }).then((d) => d.courses ?? []),
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

export function useMyNextLesson(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.nextLesson(userId),
    queryFn: () => fetchJson<{ nextLesson: DashNextLesson }>(`${getApiBase()}/my/next-lesson`, { nextLesson: null }).then((d) => d.nextLesson ?? null),
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

export function useMyEnrollmentRequests(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.enrollmentRequests(userId),
    queryFn: () => fetchJson<{ requests: DashRequest[] }>(`${getApiBase()}/my/enrollment-requests`, { requests: [] }).then((d) => d.requests ?? []),
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

export function useMyAttendanceSummary(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.attendanceSummary(userId),
    queryFn: () => fetchJson<{ byCourse: DashAttendanceByCourse }>(`${getApiBase()}/my/attendance/summary`, { byCourse: {} }).then((d) => d.byCourse ?? {}),
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

export function useMyLmsOrders(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.orders(userId),
    queryFn: () => fetchJson<{ orders: DashLmsOrder[] }>(`${getApiBase()}/my/orders`, { orders: [] }).then((d) => d.orders ?? []),
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

export function useMyWorkbookOrders(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.workbookOrders(userId),
    queryFn: () => fetchJson<{ orders: DashOrder[] }>(`${getApiBase()}/my/workbook-orders`, { orders: [] }).then((d) => d.orders ?? []),
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

export function useMyWorkbooks(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.workbooks(userId),
    queryFn: () => fetchJson<{ workbooks: DashOwnedWorkbook[] }>(`${getApiBase()}/my/workbooks`, { workbooks: [] }).then((d) => d.workbooks ?? []),
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

export function useMyBadges(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.badges(userId),
    queryFn: () => fetchJson<DashBadgesResponse>(`${getApiBase()}/my/badges`, { badges: [], earnedCount: 0, totalCount: 0 }),
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

export function useMyCertificates(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.certificates(userId),
    queryFn: () => fetchJson<{ certificates: DashCertificate[] }>(`${getApiBase()}/me/certificates`, { certificates: [] }).then((d) => d.certificates ?? []),
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

export function useMyEvaluations(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.evaluations(userId),
    queryFn: async () => {
      const r = await fetch(`${getApiBase()}/me/speech-evaluations`, { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = (await r.json()) as { evaluations: DashEvaluation[] };
      return d.evaluations ?? [];
    },
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

export function useAdminCheck(userId: Uid, enabled?: boolean) {
  return useQuery({
    queryKey: DASH_KEYS.adminCheck(userId),
    queryFn: () => fetchJson<{ isAdmin: boolean }>(`${getApiBase()}/admin/check`, { isAdmin: false }).then((d) => !!d.isAdmin),
    enabled: gate(userId, enabled),
    ...DEFAULTS,
  });
}

/**
 * Invalidate every dashboard query for the given user at once. Use after
 * mutations that may affect more than one slice (e.g. completing a lesson
 * updates courses, next-lesson, badges, and possibly certificates). Pass
 * `null` to invalidate every cached user (useful on logout).
 */
export function useInvalidateDashboard(userId: Uid) {
  const qc = useQueryClient();
  return useCallback(() => {
    if (userId) {
      qc.invalidateQueries({ queryKey: DASH_KEYS.all(userId) });
    } else {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    }
  }, [qc, userId]);
}
