import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { useMe } from "@/hooks/use-me";
import { AppShell } from "@/components/app-shell";
import { SkillsAndBadgesSection } from "@/components/skills-section";
import { useLang } from "@/hooks/useLang";
import {
  useMyCourses,
  useMyNextLesson,
  useMyEnrollmentRequests,
  useMyAttendanceSummary,
  useMyLmsOrders,
  useMyWorkbookOrders,
  useMyBadges,
  useAdminCheck,
  useInvalidateDashboard,
} from "@/hooks/use-dashboard-data";

// Heavier dashboard panes are split into their own chunks so a sign-in
// landing on the default Courses tab doesn't pay for assignments,
// certificates, evaluations, or the workbook library bundle until the
// user actually navigates there.
const StudentAssignmentsTab = lazy(() => import("@/components/student-assignments-tab"));
const StudentCertificatesTab = lazy(() => import("@/components/dashboard/student-certificates-tab"));
const StudentAchievementsTab = lazy(() => import("@/components/dashboard/student-achievements-tab"));
const StudentEvaluationsTab = lazy(() => import("@/components/dashboard/student-evaluations-tab"));
const StudentWorkbooksTab = lazy(() => import("@/components/dashboard/student-workbooks-tab"));

function TabSuspenseFallback() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 md:p-8 flex justify-center py-10">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </CardContent>
    </Card>
  );
}
import { upcomingEvents, programs, getLocalizedProgram } from "@/programsData";
import { ExternalLinkDialog } from "@/components/external-link-dialog";
import { Wifi, MapPin, UserCheck, Phone, Save, KeyRound } from "lucide-react";
import {
  User,
  BookOpen,
  ShoppingCart,
  Calendar,
  ChevronRight,
  Clock,
  Mail,
  Home,
  Lock,
  Play,
  Shield,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Video,
  ClipboardList,
  Youtube,
  Star,
  Send,
  ExternalLink,
  ShieldCheck,
  Copy,
  Sparkles,
  Award,
  Mic,
  Users,
  BookMarked,
  Download,
  AlertCircle,
  X,
} from "lucide-react";

type Lang = "ar" | "en";

const dashT = {
  ar: {
    title: "منصتي — بكلمة",
    welcome: "مرحباً",
    tabs: {
      account: "حسابي",
      courses: "دوراتي",
      orders: "طلباتي",
      schedule: "الجدول الزمني",
      assignments: "الواجبات",
      evaluations: "تقييمات الخطاب",
      certificates: "شهاداتي واعتماداتي",
      achievements: "إنجازاتي",
      skills: "مهاراتي وشاراتي",
      workbooks: "مكتباتي",
      continue: "أكمل التعلم",
    },
    account: {
      heading: "معلومات الحساب",
      name: "الاسم",
      email: "البريد الإلكتروني",
      memberSince: "عضو منذ",
      editProfile: "تعديل الملف الشخصي",
      firstName: "الاسم الأول",
      lastName: "الاسم الأخير",
      phone: "رقم الهاتف",
      bio: "نبذة شخصية",
      bioPlaceholder: "اكتب نبذة قصيرة عنك (اختياري)…",
      profileImageUrl: "رابط الصورة الشخصية",
      profileImagePlaceholder: "https://...",
      saveChanges: "حفظ التغييرات",
      saved: "تم الحفظ ✓",
      saveError: "تعذّر الحفظ",
      emailReadonly: "لا يمكن تغيير البريد الإلكتروني",
      passwordHeading: "تغيير كلمة المرور",
      currentPassword: "كلمة المرور الحالية",
      newPassword: "كلمة المرور الجديدة",
      confirmNewPassword: "تأكيد كلمة المرور الجديدة",
      changePassword: "تغيير كلمة المرور",
      passwordChanged: "تم تغيير كلمة المرور ✓",
      passwordError: "كلمة المرور الحالية غير صحيحة",
      passwordMismatch: "كلمتا المرور غير متطابقتين",
      passwordMinLen: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    },
    courses: {
      heading: "الدورات المسجلة",
      noCourses: "لم تسجّل في أي دورة بعد",
      enrollNow: "سجّل الآن",
      progress: "التقدم",
      accessMaterials: "الوصول للمواد",
      viewRecordings: "مشاهدة التسجيلات",
    },
    orders: {
      heading: "سجل الطلبات",
      noOrders: "لا توجد طلبات بعد",
      shopNow: "تصفح الكراسات",
      orderNum: "طلب رقم",
      date: "التاريخ",
      status: "الحالة",
      total: "المجموع",
      statuses: { pending: "قيد المراجعة", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل" },
    },
    schedule: {
      heading: "الجدول الزمني",
      noSchedule: "لا توجد جلسات مجدولة حالياً",
      upcoming: "الجلسات القادمة",
      yourProgram: "برنامجك",
      joinZoom: "انضم عبر Zoom",
      date: "التاريخ",
      time: "الوقت",
      type: "النوع",
      online: "عن بعد",
      inPerson: "وجاهي",
      location: "الموقع",
    },
    backHome: "العودة للرئيسية",
    logout: "تسجيل الخروج",
  },
  en: {
    title: "My Platform — Bikalima",
    welcome: "Welcome",
    tabs: {
      account: "My Account",
      courses: "My Courses",
      orders: "My Orders",
      schedule: "Schedule",
      assignments: "Assignments",
      evaluations: "Speech Evaluations",
      certificates: "My Certificates",
      achievements: "My Achievements",
      skills: "Skills & Badges",
      workbooks: "My Workbooks",
      continue: "Continue Learning",
    },
    account: {
      heading: "Account Information",
      name: "Name",
      email: "Email",
      memberSince: "Member since",
      editProfile: "Edit Profile",
      firstName: "First Name",
      lastName: "Last Name",
      phone: "Phone Number",
      bio: "Short Bio",
      bioPlaceholder: "Write a short bio about yourself (optional)…",
      profileImageUrl: "Profile Image URL",
      profileImagePlaceholder: "https://...",
      saveChanges: "Save Changes",
      saved: "Saved ✓",
      saveError: "Save failed",
      emailReadonly: "Email cannot be changed",
      passwordHeading: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password",
      changePassword: "Change Password",
      passwordChanged: "Password changed ✓",
      passwordError: "Current password is incorrect",
      passwordMismatch: "Passwords do not match",
      passwordMinLen: "Password must be at least 6 characters",
    },
    courses: {
      heading: "Enrolled Courses",
      noCourses: "You haven't enrolled in any course yet",
      enrollNow: "Enroll Now",
      progress: "Progress",
      accessMaterials: "Access Materials",
      viewRecordings: "View Recordings",
    },
    orders: {
      heading: "Order History",
      noOrders: "No orders yet",
      shopNow: "Browse Workbooks",
      orderNum: "Order #",
      date: "Date",
      status: "Status",
      total: "Total",
      statuses: { pending: "Pending", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered" },
    },
    schedule: {
      heading: "Schedule",
      noSchedule: "No sessions currently scheduled",
      upcoming: "Upcoming Sessions",
      yourProgram: "Your program",
      joinZoom: "Join via Zoom",
      date: "Date",
      time: "Time",
      type: "Type",
      online: "Online",
      inPerson: "In-Person",
      location: "Location",
    },
    backHome: "Back to Home",
    logout: "Log Out",
  },
};

const tabIcons = {
  account: User,
  courses: BookOpen,
  orders: ShoppingCart,
  schedule: Calendar,
  assignments: ClipboardList,
  evaluations: Mic,
  certificates: ShieldCheck,
  achievements: Award,
  skills: Sparkles,
  workbooks: BookMarked,
  continue: Play,
};

type Tab = "account" | "courses" | "orders" | "schedule" | "assignments" | "evaluations" | "certificates" | "achievements" | "skills" | "workbooks" | "continue";

type NextLessonData = {
  courseId: string;
  courseSlug: string | null;
  courseTitleAr: string;
  courseTitleEn: string | null;
  courseImageUrl: string | null;
  lessonId: string;
  lessonTitleAr: string;
  lessonTitleEn: string | null;
  durationMinutes: number | null;
  completedCount: number;
  totalLessons: number;
  progressPct: number;
  deepLink: string;
};

// Certificates / achievements / evaluations / workbooks panes have moved to
// their own lazy-loaded modules under `@/components/dashboard/`. The types
// and constants that used to live here moved with them.


function getApiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function AccountTab({ apiBase, lang, t, user }: { apiBase: string; lang: Lang; t: typeof dashT.ar; user: { firstName?: string | null; lastName?: string | null; email?: string | null; profileImageUrl?: string | null } | null | undefined }) {
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl ?? "");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/me/profile`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.user) return;
        setFirstName(d.user.firstName ?? "");
        setLastName(d.user.lastName ?? "");
        setPhone(d.user.phone ?? "");
        setBio(d.user.bio ?? "");
        setProfileImageUrl(d.user.profileImageUrl ?? "");
      })
      .catch(() => {});
  }, [apiBase]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`${apiBase}/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, bio, profileImageUrl }),
      });
      if (res.ok) setProfileMsg({ type: "ok", text: t.account.saved });
      else setProfileMsg({ type: "err", text: t.account.saveError });
    } catch {
      setProfileMsg({ type: "err", text: t.account.saveError });
    }
    setProfileSaving(false);
    setTimeout(() => setProfileMsg(null), 3500);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 6) {
      setPwMsg({ type: "err", text: t.account.passwordMinLen });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwMsg({ type: "err", text: t.account.passwordMismatch });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`${apiBase}/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPwMsg({ type: "ok", text: t.account.passwordChanged });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else if (res.status === 401) {
        setPwMsg({ type: "err", text: t.account.passwordError });
      } else {
        const j = await res.json().catch(() => ({}));
        setPwMsg({ type: "err", text: j.error || t.account.saveError });
      }
    } catch {
      setPwMsg({ type: "err", text: t.account.saveError });
    }
    setPwSaving(false);
    setTimeout(() => setPwMsg(null), 4500);
  };

  const initials = `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase() || (user?.email?.charAt(0).toUpperCase() ?? "?");

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardContent className="p-6 md:p-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t.account.heading}
          </h3>
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-primary/20">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                )}
              </div>
              <div className="flex-1 w-full space-y-1">
                <label htmlFor="profile-image-url" className="text-xs text-muted-foreground font-medium">{t.account.profileImageUrl}</label>
                <Input id="profile-image-url" type="url" dir="ltr" placeholder={t.account.profileImagePlaceholder} value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} className="rounded-xl" data-testid="input-profile-image-url" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="first-name" className="text-xs text-muted-foreground font-medium">{t.account.firstName}</label>
                <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl" data-testid="input-first-name" />
              </div>
              <div className="space-y-1">
                <label htmlFor="last-name" className="text-xs text-muted-foreground font-medium">{t.account.lastName}</label>
                <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-xl" data-testid="input-last-name" />
              </div>
              <div className="space-y-1">
                <label htmlFor="account-email" className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Mail className="w-3 h-3" />{t.account.email}</label>
                <Input id="account-email" type="email" dir="ltr" value={user?.email ?? ""} readOnly disabled className="rounded-xl bg-muted/40" />
                <p className="text-[10px] text-muted-foreground">{t.account.emailReadonly}</p>
              </div>
              <div className="space-y-1">
                <label htmlFor="phone" className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Phone className="w-3 h-3" />{t.account.phone}</label>
                <PhoneInput id="phone" lang={lang} value={phone} onChange={setPhone} testId="input-phone" />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="bio" className="text-xs text-muted-foreground font-medium">{t.account.bio}</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                placeholder={t.account.bioPlaceholder}
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none"
                data-testid="textarea-bio"
              />
              <p className="text-[10px] text-muted-foreground text-end">{bio.length}/500</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={profileSaving} className="rounded-full bg-primary text-white gap-2" data-testid="button-save-profile">
                <Save className="w-4 h-4" />
                {profileSaving ? "…" : t.account.saveChanges}
              </Button>
              {profileMsg && (
                <span className={`text-sm font-medium ${profileMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{profileMsg.text}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-6 md:p-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            {t.account.passwordHeading}
          </h3>
          <form onSubmit={changePassword} className="space-y-4 max-w-md">
            <div className="space-y-1">
              <label htmlFor="current-password" className="text-xs text-muted-foreground font-medium">{t.account.currentPassword}</label>
              <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl" required data-testid="input-current-password" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-password" className="text-xs text-muted-foreground font-medium">{t.account.newPassword}</label>
              <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl" required minLength={6} data-testid="input-new-password" />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm-new-password" className="text-xs text-muted-foreground font-medium">{t.account.confirmNewPassword}</label>
              <Input id="confirm-new-password" type="password" autoComplete="new-password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="rounded-xl" required minLength={6} data-testid="input-confirm-new-password" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={pwSaving || !currentPassword || !newPassword} className="rounded-full bg-primary text-white gap-2" data-testid="button-change-password">
                <KeyRound className="w-4 h-4" />
                {pwSaving ? "…" : t.account.changePassword}
              </Button>
              {pwMsg && (
                <span className={`text-sm font-medium ${pwMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{pwMsg.text}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduleTab({ lang, t, courses }: { lang: Lang; t: typeof dashT.ar; courses: Array<{ programId: string | null }> }) {
  const isRtl = lang === "ar";
  const l = (lang === "ar" ? "ar" : "en") as "ar" | "en";
  const enrolledProgramIds = new Set(courses.map(c => c.programId).filter((x): x is string => !!x));

  const sorted = [...upcomingEvents].sort((a, b) => {
    const aMine = enrolledProgramIds.has(a.programId) ? 0 : 1;
    const bMine = enrolledProgramIds.has(b.programId) ? 0 : 1;
    if (aMine !== bMine) return aMine - bMine;
    const parse = (d: string) => {
      const [dd, mm, yyyy] = d.split("/").map(Number);
      return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
    };
    return parse(a.startDate) - parse(b.startDate);
  });

  if (sorted.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 md:p-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t.schedule.heading}
          </h3>
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-primary/50" />
            </div>
            <p className="text-muted-foreground text-lg">{t.schedule.noSchedule}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 md:p-8">
        <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          {t.schedule.heading}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">{t.schedule.upcoming}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {sorted.map(ev => {
            const prog = programs.find(p => p.id === ev.programId);
            const lp = prog ? getLocalizedProgram(prog, lang) : null;
            const isOnline = ev.type === "online";
            const isMine = enrolledProgramIds.has(ev.programId);
            return (
              <div key={ev.id} className={`relative border-2 rounded-2xl p-4 transition-all hover:shadow-md ${isOnline ? "border-blue-200 bg-blue-50/30" : "border-amber-200 bg-amber-50/30"} ${isMine ? "ring-2 ring-primary/30" : ""}`} data-testid={`schedule-event-${ev.id}`}>
                {isMine && (
                  <span className="absolute -top-2 start-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow">
                    <Star className="w-3 h-3" />
                    {t.schedule.yourProgram}
                  </span>
                )}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {lp && <span className="text-xs font-bold text-primary uppercase tracking-wide truncate">{lp.shortTitle}</span>}
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isOnline ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}>
                    {isOnline ? <Wifi className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {isOnline ? t.schedule.online : t.schedule.inPerson}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{ev.trainer[l] || ev.trainer.ar}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{ev.days[l] || ev.days.ar} · {ev.timeSlot[l] || ev.timeSlot.ar}</span>
                  </div>
                  <div className="flex items-center gap-2" dir="ltr">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{ev.startDate} → {ev.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{ev.location[l] || ev.location.ar}</span>
                  </div>
                </div>
                {!isMine && (
                  <ExternalLinkDialog href={ev.registrationLink}>
                    <Button size="sm" className="mt-3 w-full bg-primary hover:bg-primary/90 text-white rounded-full text-xs gap-1" data-testid={`schedule-register-${ev.id}`}>
                      <ExternalLink className="w-3 h-3" />
                      {isRtl ? "سجّل عبر الموقع الرسمي" : "Register at Official Site"}
                    </Button>
                  </ExternalLinkDialog>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CourseAttendanceLine({
  courseId,
  slug,
  lessons,
  summary,
  isRtl,
}: {
  courseId: string;
  slug: string | null;
  lessons: { id: string; titleAr: string; titleEn: string }[];
  summary?: { present: number; absent: number; excused: number; tracked: number };
  isRtl: boolean;
}) {
  const apiBase = getApiBase();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<{ lessonId: string; status: string; note: string | null; markedAt: string }[]>([]);

  const tracked = summary?.tracked ?? 0;
  const attended = (summary?.present ?? 0) + (summary?.excused ?? 0);
  const absent = summary?.absent ?? 0;

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (!slug || entries.length > 0) return;
    setLoading(true);
    try {
      const r = await fetch(`${apiBase}/my/courses/${slug}/attendance`, { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setEntries(d.entries ?? []);
      }
    } finally { setLoading(false); }
  };

  if (tracked === 0) {
    return (
      <div
        className="mt-0.5 text-xs text-muted-foreground text-start"
        data-testid={`attendance-empty-${courseId}`}
      >
        {isRtl ? "لم تُسجَّل أي جلسات حضور بعد." : "No attendance recorded yet."}
      </div>
    );
  }

  return (
    <div className="mt-0.5">
      <button
        type="button"
        onClick={toggle}
        className="text-xs text-emerald-700 text-start hover:underline focus:outline-none"
        data-testid={`attendance-summary-${courseId}`}
      >
        {isRtl ? `حضرت ${attended} من ${tracked} جلسات` : `Attended ${attended} of ${tracked} sessions`}
        {absent > 0 && (
          <span className="text-red-600"> • {isRtl ? `${absent} غياب` : `${absent} absent`}</span>
        )}
        <span className="ms-1 text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-1 p-2 rounded-lg bg-muted/30 border text-[11px] space-y-1" data-testid={`attendance-breakdown-${courseId}`}>
          {loading ? (
            <p className="text-muted-foreground text-center">…</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-center" data-testid={`attendance-breakdown-empty-${courseId}`}>
              {isRtl ? "لا توجد سجلات حضور بعد." : "No attendance records yet."}
            </p>
          ) : (
            entries.map((e) => {
              const lesson = lessons.find((l) => l.id === e.lessonId);
              const title = lesson ? (isRtl ? lesson.titleAr : lesson.titleEn) : e.lessonId;
              const label =
                e.status === "present" ? (isRtl ? "حاضر" : "Present")
                : e.status === "absent" ? (isRtl ? "غائب" : "Absent")
                : (isRtl ? "معذور" : "Excused");
              const color =
                e.status === "present" ? "bg-emerald-100 text-emerald-700"
                : e.status === "absent" ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700";
              return (
                <div key={e.lessonId} className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded font-bold ${color}`}>{label}</span>
                  <span className="flex-1 truncate text-start">{title}</span>
                  {e.note && <span className="text-muted-foreground italic truncate max-w-[40%]" title={e.note}>“{e.note}”</span>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0`} className="w-full aspect-video rounded-xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  }
  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return <iframe src={`https://player.vimeo.com/video/${vimeoId}`} className="w-full aspect-video rounded-xl" allow="autoplay; fullscreen" allowFullScreen />;
  }
  return <div className="w-full aspect-video rounded-xl bg-muted flex items-center justify-center text-muted-foreground"><Video className="w-10 h-10" /></div>;
}

type CourseData = {
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

type OrderData = {
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

type LmsOrderData = {
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

type RequestData = {
  id: string;
  applicantType: string;
  fullName: string;
  programId: string;
  status: string;
  createdAt: string;
};

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const { user: meUser, refresh: refreshMe } = useMe();
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const handleResendVerification = async () => {
    setResendState("sending");
    try {
      const r = await fetch(`${apiBase}/auth/resend-verification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error("failed");
      setResendState("sent");
      setTimeout(() => { setResendState("idle"); refreshMe(); }, 5000);
    } catch {
      setResendState("error");
      setTimeout(() => setResendState("idle"), 4000);
    }
  };
  const [location, navigate] = useLocation();
  const { lang } = useLang();
  const readTabFromUrl = (): Tab => {
    if (typeof window === "undefined") return "account";
    const t = new URLSearchParams(window.location.search).get("tab");
    const allowed: Tab[] = ["account", "courses", "orders", "assignments", "evaluations", "certificates", "achievements", "schedule", "skills", "workbooks", "continue"];
    return (allowed as string[]).includes(t ?? "") ? (t as Tab) : "courses";
  };
  const [activeTab, setActiveTab] = useState<Tab>(readTabFromUrl());
  useEffect(() => {
    const handler = () => setActiveTab(readTabFromUrl());
    window.addEventListener("popstate", handler);
    setActiveTab(readTabFromUrl());
    return () => window.removeEventListener("popstate", handler);
  }, [location]);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [viewingCourse, setViewingCourse] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const apiBase = getApiBase();

  useEffect(() => {
    if (!errorToast) return;
    const t = setTimeout(() => setErrorToast(null), 5000);
    return () => clearTimeout(t);
  }, [errorToast]);

  // Shared React Query layer. Every /my/* and /me/* call below dedupes
  // automatically across components and stays parallel — RQ kicks each
  // request off as soon as `enabled` flips on, instead of awaiting the
  // previous one inside a sequential async block.
  // Prefer the auth context's user.id so dashboard fetches can start as
  // soon as the session is known, without waiting on /me to resolve.
  const userId = user?.id ?? meUser?.id ?? null;
  const invalidateDashboard = useInvalidateDashboard(userId);
  const fetchData = useCallback(() => invalidateDashboard(), [invalidateDashboard]);

  // Core data — needed for the dashboard chrome itself (continue card,
  // sidebar program badges) so it's loaded as soon as the user authenticates.
  const coursesQuery = useMyCourses(userId, isAuthenticated);
  const nextLessonQuery = useMyNextLesson(userId, isAuthenticated);
  const courses = (coursesQuery.data ?? []) as CourseData[];
  const nextLesson = (nextLessonQuery.data ?? null) as NextLessonData | null;
  const dataLoading = coursesQuery.isLoading || nextLessonQuery.isLoading;

  useEffect(() => {
    if (coursesQuery.isError || nextLessonQuery.isError) {
      setErrorToast(
        lang === "ar"
          ? "تعذّر تحميل بعض البيانات. حاول التحديث."
          : "Some data failed to load. Try refreshing.",
      );
    }
  }, [coursesQuery.isError, nextLessonQuery.isError, lang]);

  // Tab-scoped queries — only run when the relevant tab is active. The
  // shared cache means switching back later is instant.
  const enrollmentRequestsQuery = useMyEnrollmentRequests(userId, isAuthenticated && activeTab === "courses");
  const attendanceQuery = useMyAttendanceSummary(userId, isAuthenticated && activeTab === "courses");
  const lmsOrdersQuery = useMyLmsOrders(userId, isAuthenticated && activeTab === "orders");
  // Workbook orders are needed inside both the Orders pane and the Workbooks
  // pane (status badges); enable for either.
  const workbookOrdersQuery = useMyWorkbookOrders(
    userId,
    isAuthenticated && (activeTab === "orders" || activeTab === "workbooks"),
  );
  const requests = (enrollmentRequestsQuery.data ?? []) as RequestData[];
  const attendanceByCourse = attendanceQuery.data ?? {};
  const lmsOrders = (lmsOrdersQuery.data ?? []) as LmsOrderData[];
  const orders = (workbookOrdersQuery.data ?? []) as OrderData[];

  // /admin/check only matters for the admin-link UI in the dashboard
  // chrome. Defer it past first paint so the dashboard becomes
  // interactive without waiting on an admin probe most users don't need.
  const [adminCheckEnabled, setAdminCheckEnabled] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) return;
    const idle = (cb: () => void) => {
      type IdleScheduler = (cb: IdleRequestCallback) => number;
      const ric = (window as unknown as { requestIdleCallback?: IdleScheduler }).requestIdleCallback;
      if (typeof ric === "function") return ric(() => cb());
      return window.setTimeout(cb, 200);
    };
    const handle = idle(() => setAdminCheckEnabled(true));
    return () => {
      const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (typeof cic === "function") cic(handle);
      else window.clearTimeout(handle);
    };
  }, [isAuthenticated]);
  const adminCheckQuery = useAdminCheck(userId, adminCheckEnabled);
  const isAdmin = !!adminCheckQuery.data;

  const [badgeToast, setBadgeToast] = useState<{ titleAr: string; titleEn: string; icon: string; colorClass: string } | null>(null);
  useEffect(() => {
    if (!badgeToast) return;
    const t = setTimeout(() => setBadgeToast(null), 5000);
    return () => clearTimeout(t);
  }, [badgeToast]);

  // Badges drive both the Achievements tab and a "fresh badge" toast.
  // Sharing the query means visiting the tab afterwards costs zero extra
  // round-trips.
  const badgesQuery = useMyBadges(userId, isAuthenticated && !!meUser?.id);
  useEffect(() => {
    if (!isAuthenticated || !meUser?.id) return;
    const d = badgesQuery.data;
    if (!d?.badges) return;
    const seenKey = `bikalima:seen-badges:${meUser.id}`;
    let seen: string[] = [];
    try { seen = JSON.parse(localStorage.getItem(seenKey) || "[]"); } catch {}
    const seenSet = new Set(seen);
    const earned = d.badges.filter((b) => b.earned);
    const fresh = earned.filter((b) => !seenSet.has(b.key));
    if (fresh.length > 0) {
      const newest = fresh.slice().sort((a, b) =>
        (b.earnedAt ? new Date(b.earnedAt).getTime() : 0) - (a.earnedAt ? new Date(a.earnedAt).getTime() : 0))[0];
      setBadgeToast({ titleAr: newest.titleAr, titleEn: newest.titleEn, icon: newest.icon, colorClass: newest.colorClass });
    }
    const allKeys = earned.map((b) => b.key);
    try { localStorage.setItem(seenKey, JSON.stringify(allKeys)); } catch {}
  }, [isAuthenticated, meUser?.id, badgesQuery.data]);

  const markComplete = async (lessonId: string) => {
    try {
      const r = await fetch(`${apiBase}/my/lessons/${lessonId}/complete`, { method: "POST", credentials: "include" });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        const awarded: Array<{ titleAr: string; titleEn: string; icon: string; colorClass: string }> = d.awardedBadges ?? [];
        if (awarded.length > 0) setBadgeToast(awarded[0]);
      }
    } catch {}
    fetchData();
  };

  const t = dashT[lang];
  const isRtl = lang === "ar";
  const getTitle = (item: { titleAr: string; titleEn: string; titleFr?: string }) =>
    lang === "ar" ? item.titleAr : (item.titleEn || item.titleAr);
  const getDesc = (item: { descriptionAr?: string | null; descriptionEn?: string | null; descriptionFr?: string | null }) =>
    lang === "ar" ? item.descriptionAr : (item.descriptionEn || item.descriptionAr);

  if (authLoading) {
    return (
      <AppShell containerClassName="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    // Hand off to the dedicated /login page so anonymous visitors don't
    // pay the cost of the full dashboard tree just to see a login form.
    const currentRedirect = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect")
      : null;
    const target = currentRedirect && currentRedirect.startsWith("/") && !currentRedirect.startsWith("//")
      ? currentRedirect
      : "/dashboard";
    return <Redirect to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  // Spec order: Courses · Continue · Assignments · Speech Evaluations ·
  // Workbooks · Certificates · Orders · Schedule · Account.
  // Achievements/skills are kept after certificates so badges still show.
  const allTabs: Tab[] = ["courses", "continue", "assignments", "evaluations", "workbooks", "certificates", "achievements", "skills", "orders", "schedule", "account"];
  // Hide tabs we know are empty from parent-level data. Tabs that fetch
  // their own data (assignments/evaluations/certificates/achievements/
  // skills/schedule/account) stay visible — each renders its own warm
  // empty state.
  // `courses`, `workbooks`, `orders` are kept always-visible because
  // their detail data is fetched lazily on tab activation. Hiding them
  // when local data is empty would lock out users whose actual data
  // simply hasn't been fetched yet (e.g., a user with pending enrollment
  // requests but no active courses must still be able to open Courses).
  // Each pane renders its own warm empty state when genuinely empty.
  const tabs: Tab[] = allTabs.filter((tab) => {
    if (tab === "continue") return !!nextLesson;
    return true;
  });
  // While the first fetch is still running we don't yet know which tabs
  // have data, so always show the static ones to avoid layout flicker.
  const visibleTabs: Tab[] = dataLoading
    ? allTabs.filter((tab) => tab !== "continue")
    : tabs;

  // If the current tab becomes hidden (e.g., user landed on ?tab=continue
  // but has no in-progress lesson), rebase to the first visible tab and
  // sync the URL so we never render hidden-tab content.
  useEffect(() => {
    if (dataLoading) return;
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.includes(activeTab)) {
      const fallback = visibleTabs[0];
      setActiveTab(fallback);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", fallback);
        window.history.replaceState({}, "", url.toString());
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, visibleTabs.join(","), activeTab]);

  const currentCourse = viewingCourse ? courses.find(c => c.courseId === viewingCourse) : null;
  const currentLesson = currentCourse && activeLesson ? currentCourse.lessons.find(l => l.id === activeLesson) : null;

  const statusLabel = (s: string) => {
    const labels: Record<string, Record<string, string>> = {
      ar: { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل", paid: "مدفوع", cancelled: "ملغى" },
      en: { pending: "Pending", approved: "Approved", rejected: "Rejected", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", paid: "Paid", cancelled: "Cancelled" },
    };
    return labels[lang]?.[s] || s;
  };

  const statusColor = (s: string) => {
    const c: Record<string, string> = { pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", confirmed: "bg-blue-100 text-blue-800", shipped: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800", paid: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
    return c[s] || "bg-gray-100 text-gray-800";
  };

  if (currentCourse && currentLesson) {
    const lessonIdx = currentCourse.lessons.findIndex(l => l.id === currentLesson.id);
    const isCompleted = currentCourse.progress.some(p => p.lessonId === currentLesson.id && p.completed);
    const prevLesson = lessonIdx > 0 ? currentCourse.lessons[lessonIdx - 1] : null;
    const nextLesson = lessonIdx < currentCourse.lessons.length - 1 ? currentCourse.lessons[lessonIdx + 1] : null;

    return (
      <AppShell
        containerClassName=""
        breadcrumb={[
          { label: isRtl ? "منصتي" : "My Platform", href: "/dashboard" },
          { label: getTitle(currentCourse) },
          { label: getTitle(currentLesson) },
        ]}
      >
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setActiveLesson(null)} className="gap-1">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "العودة" : "Back"}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{getTitle(currentCourse)}</p>
              <p className="font-bold truncate">{getTitle(currentLesson)}</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              {currentLesson.videoUrl ? (
                <VideoEmbed url={currentLesson.videoUrl} />
              ) : (
                <div className="w-full aspect-video rounded-xl bg-muted flex items-center justify-center">
                  <Video className="w-12 h-12 text-muted-foreground" />
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!isCompleted ? (
                    <Button onClick={() => markComplete(currentLesson.id)} className="bg-primary text-white rounded-full gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {isRtl ? "تمت المشاهدة" : "Mark Complete"}
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {isRtl ? "مكتمل" : "Completed"}
                    </span>
                  )}
                  {currentLesson.durationMinutes && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {currentLesson.durationMinutes} {isRtl ? "دقيقة" : "min"}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {prevLesson && <Button variant="outline" size="sm" onClick={() => setActiveLesson(prevLesson.id)} className="gap-1">{isRtl ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />} {isRtl ? "السابق" : "Prev"}</Button>}
                  {nextLesson && <Button variant="outline" size="sm" onClick={() => setActiveLesson(nextLesson.id)} className="gap-1">{isRtl ? "التالي" : "Next"} {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}</Button>}
                </div>
              </div>
            </div>

            <div className="lg:w-80 shrink-0">
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <h4 className="font-bold mb-3 text-sm">{isRtl ? "قائمة الدروس" : "Lesson List"}</h4>
                  <div className="space-y-1">
                    {currentCourse.lessons.map((l, idx) => {
                      const done = currentCourse.progress.some(p => p.lessonId === l.id && p.completed);
                      const isCurrent = l.id === currentLesson.id;
                      return (
                        <button key={l.id} onClick={() => setActiveLesson(l.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-start text-sm transition-colors ${isCurrent ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"}`}>
                          {done ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : isCurrent ? <Play className="w-4 h-4 text-primary shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                          <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                          <span className="truncate">{getTitle(l)}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (currentCourse) {
    const completedCount = currentCourse.progress.filter(p => p.completed).length;
    const totalLessons = currentCourse.lessons.length;
    const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return (
      <AppShell
        containerClassName=""
        breadcrumb={[
          { label: isRtl ? "منصتي" : "My Platform", href: "/dashboard" },
          { label: isRtl ? "دوراتي" : "My Courses" },
          { label: getTitle(currentCourse) },
        ]}
      >
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setViewingCourse(null)} className="gap-1">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "دوراتي" : "My Courses"}
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{getTitle(currentCourse)}</h2>
            {getDesc(currentCourse) && <p className="text-muted-foreground mt-1">{getDesc(currentCourse)}</p>}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-sm font-bold text-primary">{progressPct}%</span>
            <span className="text-xs text-muted-foreground">{completedCount}/{totalLessons}</span>
          </div>

          <div className="space-y-2">
            {currentCourse.lessons.map((lesson, idx) => {
              const done = currentCourse.progress.some(p => p.lessonId === lesson.id && p.completed);
              return (
                <button key={lesson.id} onClick={() => setActiveLesson(lesson.id)} className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors text-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-green-100" : "bg-primary/10"}`}>
                    {done ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Play className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{getTitle(lesson)}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? `الدرس ${idx + 1}` : `Lesson ${idx + 1}`}{lesson.durationMinutes ? ` • ${lesson.durationMinutes} ${isRtl ? "دقيقة" : "min"}` : ""}</p>
                  </div>
                  {lesson.videoUrl && <Video className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
              );
            })}
            {currentCourse.lessons.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{isRtl ? "لم تُضَف دروس بعد" : "No lessons added yet"}</p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      containerClassName=""
      breadcrumb={[{ label: lang === "ar" ? "منصتي" : "My Platform" }]}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{t.welcome}، {user?.firstName || user?.email} 👋</h2>
        </div>

        {/* Hero "أكمل التعلم" CTA — visible on every tab */}
        {dataLoading ? (
          <div
            className="mb-6 rounded-2xl border border-border bg-card p-5 md:p-6 animate-pulse"
            data-testid="hero-skeleton"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-2 w-full bg-muted rounded" />
              </div>
              <div className="h-10 w-28 bg-muted rounded-full hidden sm:block" />
            </div>
          </div>
        ) : nextLesson ? (
          <div
            className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-amber-50 to-card p-5 md:p-6 shadow-sm"
            data-testid="hero-continue-cta"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  {isRtl ? "أكمل التعلم" : "Continue learning"}
                </p>
                <p className="font-bold text-base md:text-lg mt-0.5 truncate">
                  {isRtl ? nextLesson.lessonTitleAr : (nextLesson.lessonTitleEn || nextLesson.lessonTitleAr)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {isRtl ? nextLesson.courseTitleAr : (nextLesson.courseTitleEn || nextLesson.courseTitleAr)}
                  {nextLesson.durationMinutes ? ` • ${nextLesson.durationMinutes} ${isRtl ? "دقيقة" : "min"}` : ""}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-xs">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${nextLesson.progressPct}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-primary">{nextLesson.progressPct}%</span>
                </div>
              </div>
              <Button
                onClick={() => navigate(nextLesson.deepLink)}
                className="rounded-full bg-primary text-white gap-2 shrink-0 px-5"
                data-testid="hero-continue-button"
              >
                <Play className="w-4 h-4" />
                {isRtl ? "تابع الآن" : "Resume"}
              </Button>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div
            className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-amber-50 to-card p-5 md:p-6"
            data-testid="hero-empty"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-8 h-8 text-primary/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base md:text-lg">
                  {isRtl ? "ابدأ رحلتك التدريبية" : "Start your learning journey"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRtl
                    ? "تصفّح برامج بكلمة وسجّل في أول دورة لك."
                    : "Browse Bikalima's programs and enroll in your first course."}
                </p>
              </div>
              <Button onClick={() => navigate("/courses")} className="rounded-full bg-primary text-white shrink-0">
                {isRtl ? "تصفّح الدورات" : "Browse courses"}
              </Button>
            </div>
          </div>
        ) : null}

        {meUser && meUser.emailVerified === false && (
          <div
            className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            data-testid="email-verify-banner"
          >
            <div className="flex items-start gap-3 flex-1">
              <Mail className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-900 text-sm md:text-base">
                  {lang === "ar" ? "أكّد بريدك الإلكتروني" : "Verify your email"}
                </p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  {lang === "ar"
                    ? `أرسلنا رابط التأكيد إلى ${meUser.email}. رجاءً افتح الرسالة وانقر الرابط لتفعيل حسابك بالكامل.`
                    : `We sent a verification link to ${meUser.email}. Please open it and click the link to fully activate your account.`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendVerification}
              disabled={resendState === "sending" || resendState === "sent"}
              className="rounded-full border-amber-400 text-amber-900 hover:bg-amber-100 shrink-0"
              data-testid="resend-verification-btn"
            >
              {resendState === "sending"
                ? (lang === "ar" ? "جارٍ الإرسال..." : "Sending...")
                : resendState === "sent"
                ? (lang === "ar" ? "تم الإرسال ✓" : "Sent ✓")
                : resendState === "error"
                ? (lang === "ar" ? "تعذّر الإرسال" : "Failed")
                : (lang === "ar" ? "إعادة إرسال الرابط" : "Resend link")}
            </Button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <nav className="md:w-64 shrink-0">
            <div className="bg-card rounded-2xl border border-border p-2 space-y-1 sticky top-24">
              {visibleTabs.map((tab) => {
                const Icon = tabIcons[tab];
                return (
                  <button
                    key={tab}
                    data-testid={`dashboard-tab-${tab}`}
                    onClick={() => {
                      setActiveTab(tab);
                      setViewingCourse(null);
                      setActiveLesson(null);
                      try {
                        const url = new URL(window.location.href);
                        url.searchParams.set("tab", tab);
                        window.history.replaceState({}, "", url.toString());
                      } catch {}
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-start ${
                      activeTab === tab
                        ? "bg-primary text-white font-bold shadow-md"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{t.tabs[tab]}</span>
                    <ChevronRight className={`w-4 h-4 ms-auto ${isRtl ? "rotate-180" : ""} ${activeTab === tab ? "opacity-100" : "opacity-30"}`} />
                  </button>
                );
              })}
              <hr className="border-border my-2" />
              {isAdmin && (
                <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50 text-amber-700 text-start font-medium">
                  <Shield className="w-5 h-5" />
                  <span>{lang === "ar" ? "لوحة الإدارة" : "Admin Panel"}</span>
                </button>
              )}
              <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary text-muted-foreground text-start">
                <Home className="w-5 h-5" />
                <span>{t.backHome}</span>
              </button>
            </div>
          </nav>

          <main className="flex-1 min-w-0">
            {activeTab === "account" && (
              <AccountTab apiBase={apiBase} lang={lang} t={t} user={user} />
            )}

            {activeTab === "courses" && (
              <Card className="rounded-2xl">
                <CardContent className="p-6 md:p-8">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {t.courses.heading}
                  </h3>
                  {dataLoading ? (
                    <div className="py-12 text-center"><div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full mx-auto" /></div>
                  ) : courses.length > 0 ? (
                    <div className="space-y-3">
                      {courses.map(course => {
                        const completedCount = course.progress.filter(p => p.completed).length;
                        const totalLessons = course.lessons.length;
                        const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                        return (
                          <div key={course.courseId} className={`w-full flex items-center gap-4 bg-background border rounded-xl p-4 transition-colors ${pct === 100 ? "border-green-500/40" : "border-border hover:border-primary/40"}`}>
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${pct === 100 ? "bg-green-100" : "bg-primary/10"}`}>
                              {pct === 100 ? <CheckCircle className="w-7 h-7 text-green-600" /> : <BookOpen className="w-7 h-7 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-start">{getTitle(course)}</p>
                                {pct === 100 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                                    <CheckCircle className="w-3 h-3" />
                                    {isRtl ? "مكتمل" : "Completed"}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground text-start">{totalLessons} {isRtl ? "درس" : "lessons"} • {pct}% {t.courses.progress.toLowerCase()}</p>
                              <CourseAttendanceLine
                                courseId={course.courseId}
                                slug={course.slug}
                                lessons={course.lessons}
                                summary={attendanceByCourse[course.courseId]}
                                isRtl={isRtl}
                              />
                              
                              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              {course.slug && (
                                <button
                                  onClick={() => navigate(`/courses/${course.slug}/learn`)}
                                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1.5 whitespace-nowrap ${pct === 100 ? "bg-green-600 text-white hover:bg-green-700" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                                >
                                  {pct === 100 ? <CheckCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                  {pct === 0
                                    ? (isRtl ? "ابدأ التعلّم" : "Start Learning")
                                    : pct === 100
                                      ? (isRtl ? "عرض الشهادة" : "View Certificate")
                                      : (isRtl ? "متابعة التعلّم" : "Continue Learning")}
                                </button>
                              )}
                              <button
                                onClick={() => setViewingCourse(course.courseId)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
                              >
                                {isRtl ? "تفاصيل" : "Details"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 space-y-4">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen className="w-10 h-10 text-primary/50" />
                      </div>
                      <p className="text-muted-foreground text-lg">{t.courses.noCourses}</p>
                      <Button onClick={() => navigate("/")} className="rounded-full bg-primary text-white">
                        {t.courses.enrollNow}
                      </Button>
                    </div>
                  )}

                  {requests.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-border">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {isRtl ? "طلبات التسجيل" : "Enrollment Requests"}
                      </h4>
                      <div className="space-y-2">
                        {requests.map(r => (
                          <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 text-sm">
                            <div>
                              <p className="font-medium">{r.programId}</p>
                              <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString(isRtl ? "ar-SA" : undefined)}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "orders" && (
              <div className="space-y-6">
                {/* LMS Course Orders */}
                <Card className="rounded-2xl">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      {isRtl ? "طلبات الدورات" : "Course Orders"}
                    </h3>
                    {dataLoading ? (
                      <div className="py-8 text-center"><div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full mx-auto" /></div>
                    ) : lmsOrders.length > 0 ? (
                      <div className="space-y-3">
                        {lmsOrders.map((o) => (
                          <div key={o.id} className="flex items-center justify-between bg-muted/30 border border-border/40 rounded-xl p-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{isRtl ? (o.courseTitleAr || "—") : (o.courseTitleEn || o.courseTitleAr || "—")}</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(o.createdAt).toLocaleDateString(isRtl ? "ar-SA" : undefined)}</p>
                              {o.paymentNotes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{o.paymentNotes}</p>}
                            </div>
                            <div className="flex items-center gap-3 ms-4 shrink-0">
                              {o.amount && <span className="font-bold text-primary text-sm">{o.amount} JOD</span>}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 space-y-3">
                        <BookOpen className="w-10 h-10 text-primary/30 mx-auto" />
                        <p className="text-muted-foreground">{isRtl ? "لم تُقدّم أي طلب للدورات بعد" : "No course orders yet"}</p>
                        <Button onClick={() => navigate("/courses")} className="rounded-full bg-primary text-white text-sm">
                          {isRtl ? "تصفح الدورات" : "Browse Courses"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Workbook Orders */}
                <Card className="rounded-2xl">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                      {isRtl ? "طلبات الكراسات" : "Workbook Orders"}
                    </h3>
                    {dataLoading ? (
                      <div className="py-8 text-center"><div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full mx-auto" /></div>
                    ) : orders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b text-muted-foreground">
                            <th className="text-start py-2 px-3 font-medium">{t.orders.orderNum}</th>
                            <th className="text-start py-2 px-3 font-medium">{isRtl ? "الكراسة" : "Workbook"}</th>
                            <th className="text-start py-2 px-3 font-medium">{isRtl ? "الصيغة" : "Format"}</th>
                            <th className="text-start py-2 px-3 font-medium">{t.orders.total}</th>
                            <th className="text-start py-2 px-3 font-medium">{t.orders.status}</th>
                            <th className="text-start py-2 px-3 font-medium">{t.orders.date}</th>
                          </tr></thead>
                          <tbody>
                            {orders.map((o, idx) => (
                              <tr key={o.id} className="border-b border-border/30">
                                <td className="py-3 px-3 font-medium">#{idx + 1}</td>
                                <td className="py-3 px-3">{o.workbookId}</td>
                                <td className="py-3 px-3">{o.format === "pdf" ? (isRtl ? "رقمية" : "PDF") : (isRtl ? "مطبوعة" : "Print")}</td>
                                <td className="py-3 px-3 font-bold">{o.totalPrice} JOD</td>
                                <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(o.status)}`}>{statusLabel(o.status)}</span></td>
                                <td className="py-3 px-3 text-muted-foreground text-xs">{new Date(o.createdAt).toLocaleDateString(isRtl ? "ar-SA" : undefined)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10 space-y-3">
                        <ShoppingCart className="w-10 h-10 text-primary/30 mx-auto" />
                        <p className="text-muted-foreground">{t.orders.noOrders}</p>
                        <Button onClick={() => navigate("/")} className="rounded-full bg-primary text-white text-sm">
                          {t.orders.shopNow}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "evaluations" && (
              <Suspense fallback={<TabSuspenseFallback />}>
                <StudentEvaluationsTab lang={lang} />
              </Suspense>
            )}

            {activeTab === "assignments" && (
              <Suspense fallback={<TabSuspenseFallback />}>
                <StudentAssignmentsTab apiBase={apiBase} lang={lang} />
              </Suspense>
            )}

            {activeTab === "certificates" && (
              <Suspense fallback={<TabSuspenseFallback />}>
                <StudentCertificatesTab lang={lang} />
              </Suspense>
            )}

            {activeTab === "achievements" && (
              <Suspense fallback={<TabSuspenseFallback />}>
                <StudentAchievementsTab lang={lang} />
              </Suspense>
            )}

            {activeTab === "schedule" && (
              <ScheduleTab lang={lang} t={t} courses={courses} />
            )}

            {activeTab === "skills" && (
              <Card className="rounded-2xl">
                <CardContent className="p-6 md:p-8">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    {t.tabs.skills}
                  </h3>
                  <SkillsAndBadgesSection />
                </CardContent>
              </Card>
            )}

            {activeTab === "continue" && (
              <Card className="rounded-2xl" data-testid="continue-tab">
                <CardContent className="p-6 md:p-8 space-y-4">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    {t.tabs.continue}
                  </h3>
                  {dataLoading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (() => {
                    const inProgress = courses
                      .map((c) => {
                        const total = c.lessons.length;
                        const done = c.progress.filter((p) => p.completed).length;
                        const next = c.lessons.find((l) => !c.progress.some((p) => p.lessonId === l.id && p.completed));
                        return { course: c, total, done, next, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
                      })
                      .filter((r) => r.next && r.total > 0);
                    if (inProgress.length === 0) {
                      return (
                        <div className="text-center py-10 space-y-3">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-primary/60" />
                          </div>
                          <p className="text-muted-foreground">
                            {isRtl ? "أحسنت! لا توجد دروس متبقية حالياً." : "Great work! No lessons left to continue."}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        {inProgress.map(({ course, total, done, next, pct }) => (
                          <div key={course.courseId} className="border border-border rounded-xl p-4 flex items-center gap-4 bg-background">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Play className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{getTitle(course)}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {isRtl ? "التالي:" : "Next:"} {next ? getTitle(next) : ""}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-xs">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[11px] text-muted-foreground">{done}/{total}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => course.slug && next && navigate(`/courses/${course.slug}/learn?lesson=${encodeURIComponent(next.id)}`)}
                              className="rounded-full bg-primary text-white shrink-0 gap-1"
                              data-testid={`continue-resume-${course.courseId}`}
                            >
                              <Play className="w-3.5 h-3.5" />
                              {isRtl ? "تابع" : "Resume"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {activeTab === "workbooks" && (
              <Suspense fallback={<TabSuspenseFallback />}>
                <StudentWorkbooksTab lang={lang} heading={t.tabs.workbooks} />
              </Suspense>
            )}
          </main>
        </div>
      </div>
      {errorToast && (
        <div
          className={`fixed bottom-6 ${isRtl ? "right-6" : "left-6"} z-50 max-w-sm rounded-2xl shadow-lg border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4`}
          role="alert"
          data-testid="dashboard-error-toast"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-700" />
          </div>
          <p className="flex-1 text-sm text-rose-900 leading-relaxed">{errorToast}</p>
          <button
            onClick={() => setErrorToast(null)}
            className="text-rose-700 hover:text-rose-900 shrink-0"
            aria-label={isRtl ? "إغلاق" : "Dismiss"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {badgeToast && (() => {
        const BADGE_TOAST_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
          "play-circle": Play,
          "mic": Mic,
          "clipboard-check": ClipboardList,
          "trending-up": Star,
          "graduation-cap": Award,
          "sparkles": Sparkles,
          "shield-check": ShieldCheck,
          "award": Award,
        };
        const Icon = BADGE_TOAST_ICONS[badgeToast.icon] ?? Award;
        return (
          <div
            className={`fixed bottom-6 ${isRtl ? "left-6" : "right-6"} z-50 max-w-sm rounded-2xl shadow-lg border border-border bg-card p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4`}
            role="status"
            data-testid="badge-toast"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${badgeToast.colorClass}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary">
                {isRtl ? "🎉 شارة جديدة!" : "🎉 New badge!"}
              </p>
              <p className="font-bold text-sm">{isRtl ? badgeToast.titleAr : badgeToast.titleEn}</p>
            </div>
            <button
              onClick={() => setBadgeToast(null)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none"
              aria-label="dismiss"
            >×</button>
          </div>
        );
      })()}
    </AppShell>
  );
}
