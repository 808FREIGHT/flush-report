// Design philosophy reminder: Coastal Public-Service News for The Flush Report.
// The app shell must default to a light coastal-news environment so pages inherit
// professional white surfaces, ocean-blue accents, and warmer public-service messaging.

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Featured from "@/pages/Featured";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import StorySubmit from "@/pages/StorySubmit";
import TermsConditions from "@/pages/TermsConditions";
import Contact from "@/pages/Contact";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import News from "./pages/News";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/news"} component={News} />
      <Route path={"/featured"} component={Featured} />
      <Route path={"/submit-story"} component={StorySubmit} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/terms"} component={TermsConditions} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
