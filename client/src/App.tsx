import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense, type ReactNode } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthGate from "./components/AuthGate";
import SiteHeader from "./components/SiteHeader";
import { LocaleProvider, useLocale } from "./contexts/LocaleContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFoundPage from "@/pages/NotFound";
const Assessment = lazy(() => import("./pages/Assessment"));
const Admin = lazy(() => import("./pages/Admin"));
const Questionnaire = lazy(() => import("./pages/Questionnaire"));
const ReviewQueue = lazy(() => import("./pages/ReviewQueue"));
const ReviewAssessment = lazy(() => import("./pages/ReviewAssessment"));
const ReviewManager = lazy(() => import("./pages/ReviewManager"));
const ReviewInvite = lazy(() => import("./pages/ReviewInvite"));
const Workspace = lazy(() => import("./pages/Workspace"));
const Observatory = lazy(() => import("./pages/Observatory"));
const AISystemRegistry = lazy(() => import("./pages/AISystemRegistry"));
const AISystemDetail = lazy(() => import("./pages/AISystemDetail"));
const Incidents = lazy(() => import("./pages/Incidents"));

function LocalizedLoading() {
  const { isBangla } = useLocale();
  return <main role="status" style={{ padding: "2rem" }}>{isBangla ? "পৃষ্ঠা লোড হচ্ছে…" : "Loading page…"}</main>;
}

function Router() {
  const protectedRoute = (component: ReactNode, label: string) => <AuthGate label={label}>{component}</AuthGate>;
  return (
    <Suspense fallback={<LocalizedLoading />}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/readiness" component={Assessment} />
      <Route path="/observatory" component={Observatory} />
      <Route path="/observatory/systems">{() => protectedRoute(<AISystemRegistry />, "your organization AI-system register")}</Route>
      <Route path="/observatory/systems/:id">{() => protectedRoute(<AISystemDetail />, "your organization AI-system record")}</Route>
      <Route path="/incidents">{() => protectedRoute(<Incidents />, "incident reporting")}</Route>
      <Route path="/assessment/:id">{() => protectedRoute(<Questionnaire />, "your assessment")}</Route>
      <Route path="/workspace">{() => protectedRoute(<Workspace />, "your workspace")}</Route>
      <Route path="/admin">{() => protectedRoute(<Admin />, "the admin control plane")}</Route>
      <Route path="/review">{() => protectedRoute(<ReviewQueue />, "the reviewer queue")}</Route>
      <Route path="/review/manage">{() => protectedRoute(<ReviewManager />, "review management")}</Route>
      <Route path="/review/invite/:token" component={ReviewInvite} />
      <Route path="/review/:id">{() => protectedRoute(<ReviewAssessment />, "the control review")}</Route>
      <Route path="/404" component={NotFoundPage} />
      <Route component={NotFoundPage} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <SiteHeader />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LocaleProvider>
    </ErrorBoundary>
  );
}

export default App;
