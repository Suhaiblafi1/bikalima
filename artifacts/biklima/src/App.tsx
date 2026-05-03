import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminRoute } from "@/components/route-guards";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AdminOverview from "@/pages/admin/overview";
import TrainerDashboard from "@/pages/trainer";
import AdminUsers from "@/pages/admin/users";
import AdminCourses from "@/pages/admin/courses";
import AdminEnrollments from "@/pages/admin/enrollments";
import AdminWorkbookOrders from "@/pages/admin/workbook-orders";
import AdminAssignments from "@/pages/admin/assignments";
import AdminReviews from "@/pages/admin/reviews";
import AdminSpeechEvaluations from "@/pages/admin/speech-evaluations";
import AdminSettings from "@/pages/admin/settings";
import AdminHomePage from "@/pages/admin/home-page";
import AdminWorkbooksCms from "@/pages/admin/workbooks";
import AdminFieldMedia from "@/pages/admin/field-media";
import AdminCertificates from "@/pages/admin/certificates";
import VerifyPage from "@/pages/verify";
import VerifyEmailPage from "@/pages/verify-email";
import CertificateDetailPage from "@/pages/certificate-detail";
import GraduatesPage from "@/pages/graduates";
import GalleryPage from "@/pages/gallery";
import WorkbooksPage from "@/pages/workbooks";
import ProgramPage from "@/pages/program";
import LearnPage from "@/pages/learn";
import InstructorReviewsPage from "@/pages/instructor-reviews";
import CheckoutPage from "@/pages/checkout";
import ConfirmationPage from "@/pages/confirmation";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import NotFound from "@/pages/not-found";
import { LiveChatWidget } from "@/components/live-chat-widget";
import { MobileStickyCta } from "@/components/mobile-sticky-cta";
import AdminChatPage from "@/pages/admin/chat";
import AdminLeadsPage from "@/pages/admin/leads";
import AdminLeadDetailPage from "@/pages/admin/lead-detail";
import AdminPipelinePage from "@/pages/admin/pipeline";
import AdminTasksPage from "@/pages/admin/tasks";
import AdminAutomationsPage from "@/pages/admin/automations";
import AdminMessageTemplatesPage from "@/pages/admin/message-templates";
import AdminFunnelsPage from "@/pages/admin/funnels";
import AdminAuditLogPage from "@/pages/admin/audit-log";
import AdminFeatureFlagsPage from "@/pages/admin/feature-flags";
import AdminImpactStatsPage from "@/pages/admin/impact-stats";
import ImpactPage from "@/pages/impact";
import ConsultationPage from "@/pages/consultation";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { SLUG_TO_PROGRAM_ID, PROGRAM_PAGE_SLUGS } from "@/lib/site-config";

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // Skip when navigating to a hash anchor — the target page handles that scroll
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);
  return null;
}

function AnimatedRouter() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <Switch location={location}>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
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
      </motion.div>
    </AnimatePresence>
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
          <AnimatedRouter />
          <LiveChatGate />
          <MobileStickyCta />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
