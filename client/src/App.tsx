import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/layout/main-layout";
import Login from "@/pages/login";
import RegisterPage from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Advisors from "@/pages/advisors";
import Companies from "@/pages/companies";
import Internships from "@/pages/internships";
import MandatoryInternships from "@/pages/mandatory-internships";
import MandatoryInternshipControl from "@/pages/mandatory-internship-control";
import AlertsPage from "@/pages/alerts";
import NonMandatoryInternships from "@/pages/non-mandatory-internships";
import ProfilePage from "./pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/students">
        <MainLayout>
          <Students />
        </MainLayout>
      </Route>
      <Route path="/advisors">
        <MainLayout>
          <Advisors />
        </MainLayout>
      </Route>
      <Route path="/companies">
        <MainLayout>
          <Companies />
        </MainLayout>
      </Route>
      <Route path="/internships">
        <MainLayout>
          <Internships />
        </MainLayout>
      </Route>
      <Route path="/mandatory-internships">
        <MainLayout>
          <MandatoryInternships />
        </MainLayout>
      </Route>
      <Route path="/mandatory-internship-control/:id">
        <MainLayout>
          <MandatoryInternshipControl />
        </MainLayout>
      </Route>
      <Route path="/non-mandatory-internships">
        <MainLayout>
          <NonMandatoryInternships />
        </MainLayout>
      </Route>
      <Route path="/alerts">
        <MainLayout>
          <AlertsPage />
        </MainLayout>
      </Route>
      <Route path="/profile">
        <MainLayout>
          <ProfilePage />
        </MainLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
