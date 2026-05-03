import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminRoute } from "@/components/route-guards";

// Eager: small public pages that show on the most common landing flows
// (home, program, checkout, login, confirmation). Keeping these eager
// avoids a Suspense flash on the most-trafficked routes.
import Home from "@/pages/home";
import ProgramPage from "@/pages/program";
import CheckoutPage from "@/pages/checkout";
import ConfirmationPage from "@/pages/confirmation";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import { LiveChatWidget } from "@/components/live-chat-widget";
import { MobileStickyCta } from "@/components/mobile-sticky-cta";

// Lazy: heavy authenticated / admin / rarely-visited routes. These only
// load when the user actually navigates to them, so an anonymous visitor
// hitting /, /programs/* or /login never downloads admin or dashboard
// code.
const Dashboard = lazy(() => import("@/pages/dashboard"));
const TrainerDashboard = lazy(() => import("@/pages/trainer"));
const ParentPage = lazy(() => import("@/pages/parent"));
const LearnPage = lazy(() => import("@/pages/learn"));
const InstructorReviewsPage = lazy(() => import("@/pages/instructor-reviews"));
const GalleryPage = lazy(() => import("@/pages/gallery"));
const WorkbooksPage = lazy(() => import("@/pages/workbooks"));
const VerifyPage = lazy(() => import("@/pages/verify"));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email"));
const CertificateDetailPage = lazy(() => import("@/pages/certificate-detail"));
const GraduatesPage = lazy(() => import("@/pages/graduates"));
const ImpactPage = lazy(() => import("@/pages/impact"));
const ConsultationPage = lazy(() => import("@/pages/consultation"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const TermsPage = lazy(() => import("@/pages/terms"));

// Admin pages — group into a single chunk per page; they all require an
// authenticated admin so an anonymous visitor never pays for them.
const AdminOverview = lazy(() => import("@/pages/admin/overview"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminCourses = lazy(() => import("@/pages/admin/courses"));
const AdminEnrollments = lazy(() => import("@/pages/admin/enrollments"));
const AdminWorkbookOrders = lazy(() => import("@/pages/admin/workbook-orders"));
const AdminAssignments = lazy(() => import("@/pages/admin/assignments"));
const AdminReviews = lazy(() => import("@/pages/admin/reviews"));
const AdminSpeechEvaluations = lazy(() => import("@/pages/admin/speech-evaluations"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminHomePage = lazy(() => import("@/pages/admin/home-page"));
const AdminWorkbooksCms = lazy(() => import("@/pages/admin/workbooks"));
const AdminFieldMedia = lazy(() => import("@/pages/admin/field-media"));
const AdminCertificates = lazy(() => import("@/pages/admin/certificates"));
const AdminChatPage = lazy(() => import("@/pages/admin/chat"));
const AdminLeadsPage = lazy(() => import("@/pages/admin/leads"));
const AdminLeadDetailPage = lazy(() => import("@/pages/admin/lead-detail"));
const AdminPipelinePage = lazy(() => import("@/pages/admin/pipeline"));
const AdminTasksPage = lazy(() => import("@/pages/admin/tasks"));
const AdminAutomationsPage = lazy(() => import("@/pages/admin/automations"));
const AdminMessageTemplatesPage = lazy(() => import("@/pages/admin/message-templates"));
const AdminFunnelsPage = lazy(() => import("@/pages/admin/funnels"));
const AdminAuditLogPage = lazy(() => import("@/pages/admin/audit-log"));
const AdminFeatureFlagsPage = lazy(() => import("@/pages/admin/feature-flags"));
const AdminImpactStatsPage = lazy(() => import("@/pages/admin/impact-stats"));

import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { SLUG_TO_PROGRAM_ID, PROGRAM_PAGE_SLUGS } from "@/lib/site-config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Most of our queries are session-bound and don't need to refetch on
      // every focus / reconnect. Page-level data fetches that need fresher
      // data should opt in explicitly.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);
  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

/**
 * Route-level gate for /dashboard. Reads the shared React Query auth
 * cache and short-circuits to /login BEFORE the heavy Dashboard chunk
 * is requested, so anonymous users hitting /dashboard?redirect=... only
 * download the small login chunk.
 */
function DashboardRoute() {
  const { isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <RouteFallback />;
  if (!isAuthenticated) {
    const currentRedirect = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect")
      : null;
    const target = currentRedirect && currentRedirect.startsWith("/") && !currentRedirect.startsWith("//")
      ? currentRedirect
      : "/dashboard";
    return <Redirect to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }
  return <Dashboard />;
}

function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={LoginPage} />
        <Route path="/dashboard" component={DashboardRoute} />
        <Route path="/parent" component={ParentPage} />
        <Route path="/admin">
          {() => <Redirect to="/admin/overview" />}
        </Route>
        <Route path="/trainer">
          {() => (<AdminRoute><TrainerDashboard /></AdminRoute>)}
        </Route>
        <Route path="/admin/overview">
          {() => (<AdminRoute><AdminOverview /></AdminRoute>)}
        </Route>
        <Route path="/admin/users">
          {() => (<AdminRoute><AdminUsers /></AdminRoute>)}
        </Route>
        <Route path="/admin/courses">
          {() => (<AdminRoute><AdminCourses /></AdminRoute>)}
        </Route>
        <Route path="/admin/enrollments">
          {() => (<AdminRoute><AdminEnrollments /></AdminRoute>)}
        </Route>
        <Route path="/admin/workbook-orders">
          {() => (<AdminRoute><AdminWorkbookOrders /></AdminRoute>)}
        </Route>
        <Route path="/admin/assignments">
          {() => (<AdminRoute><AdminAssignments /></AdminRoute>)}
        </Route>
        <Route path="/admin/reviews">
          {() => (<AdminRoute><AdminReviews /></AdminRoute>)}
        </Route>
        <Route path="/admin/speech-evaluations">
          {() => (<AdminRoute><AdminSpeechEvaluations /></AdminRoute>)}
        </Route>
        <Route path="/admin/home-page">
          {() => (<AdminRoute><AdminHomePage /></AdminRoute>)}
        </Route>
        <Route path="/admin/workbooks">
          {() => (<AdminRoute><AdminWorkbooksCms /></AdminRoute>)}
        </Route>
        <Route path="/admin/field-media">
          {() => (<AdminRoute><AdminFieldMedia /></AdminRoute>)}
        </Route>
        <Route path="/admin/certificates">
          {() => (<AdminRoute><AdminCertificates /></AdminRoute>)}
        </Route>
        <Route path="/admin/chat">
          {() => (<AdminRoute><AdminChatPage /></AdminRoute>)}
        </Route>
        <Route path="/admin/leads/:id">
          {(params) => (<AdminRoute><AdminLeadDetailPage id={params.id} /></AdminRoute>)}
        </Route>
        <Route path="/admin/leads">
          {() => (<AdminRoute><AdminLeadsPage /></AdminRoute>)}
        </Route>
        <Route path="/admin/pipeline">
          {() => (<AdminRoute><AdminPipelinePage /></AdminRoute>)}
        </Route>
        <Route path="/admin/tasks">
          {() => (<AdminRoute><AdminTasksPage /></AdminRoute>)}
        </Route>
        <Route path="/admin/automations">
          {() => (<AdminRoute><AdminAutomationsPage /></AdminRoute>)}
        </Route>
        <Route path="/admin/message-templates">
          {() => (<AdminRoute><AdminMessageTemplatesPage /></AdminRoute>)}
        </Route>
        <Route path="/admin/funnels">
          {() => (<AdminRoute><AdminFunnelsPage /></AdminRoute>)}
        </Route>
        <Route path="/admin/audit-log">
          {() => (<AdminRoute><AdminAuditLogPage /></AdminRoute>)}
        </Route>
        <Route path="/admin/feature-flags">
          {() => (<AdminRoute><AdminFeatureFlagsPage /></AdminRoute>)}
        </Route>
        <Route path="/admin/impact-stats">
          {() => (<AdminRoute><AdminImpactStatsPage /></AdminRoute>)}
        </Route>
        <Route path="/impact" component={ImpactPage} />
        <Route path="/consultation" component={ConsultationPage} />
        <Route path="/admin/settings">
          {() => (<AdminRoute><AdminSettings /></AdminRoute>)}
        </Route>
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/gallery" component={GalleryPage} />
        <Route path="/workbooks" component={WorkbooksPage} />
        <Route path="/verify" component={VerifyPage} />
        <Route path="/verify-email" component={VerifyEmailPage} />
        <Route path="/certificates/:code" component={CertificateDetailPage} />
        <Route path="/graduates">
          {() => <GraduatesRouteGate />}
        </Route>
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/confirmation" component={ConfirmationPage} />
        <Route path="/courses/:slug/learn" component={LearnPage} />
        <Route path="/instructor/reviews" component={InstructorReviewsPage} />
        <Route path="/courses/:slug">
          {(params) => {
            const programId = SLUG_TO_PROGRAM_ID[params.slug];
            const pageSlug = programId ? PROGRAM_PAGE_SLUGS[programId] : null;
            return <Redirect to={pageSlug ? `/programs/${pageSlug}` : "/#structure"} replace />;
          }}
        </Route>
        <Route path="/courses">
          {() => <Redirect to="/" />}
        </Route>
        <Route path="/programs/:slug" component={ProgramPage} />
        <Route path="/programs">
          {() => <Redirect to="/#structure" />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function GraduatesRouteGate() {
  const enabled = useFeatureFlag("graduates_page");
  if (!enabled) return <Redirect to="/" />;
  return <GraduatesPage />;
}

function LiveChatGate() {
  const enabled = useFeatureFlag("live_chat");
  if (!enabled) return null;
  return <LiveChatWidget />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <AppRouter />
          <LiveChatGate />
          <MobileStickyCta />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
