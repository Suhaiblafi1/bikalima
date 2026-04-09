import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AdminPanel from "@/pages/admin";
import GalleryPage from "@/pages/gallery";
import WorkbooksPage from "@/pages/workbooks";
import CoursesPage from "@/pages/courses";
import CourseDetailPage from "@/pages/course-detail";
import LearnPage from "@/pages/learn";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/workbooks" component={WorkbooksPage} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/courses/:slug/learn" component={LearnPage} />
      <Route path="/courses/:slug" component={CourseDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
