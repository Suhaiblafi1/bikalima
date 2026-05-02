import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminRoute } from "@/components/route-guards";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AdminPanel from "@/pages/admin";
import GalleryPage from "@/pages/gallery";
import WorkbooksPage from "@/pages/workbooks";
import CourseDetailPage from "@/pages/course-detail";
import LearnPage from "@/pages/learn";
import CheckoutPage from "@/pages/checkout";
import ConfirmationPage from "@/pages/confirmation";
import NotFound from "@/pages/not-found";

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
            {() => (
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            )}
          </Route>
          <Route path="/gallery" component={GalleryPage} />
          <Route path="/workbooks" component={WorkbooksPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/confirmation" component={ConfirmationPage} />
          <Route path="/courses/:slug/learn" component={LearnPage} />
          <Route path="/courses/:slug" component={CourseDetailPage} />
          <Route path="/courses">
            {() => <Redirect to="/" />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <AnimatedRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
