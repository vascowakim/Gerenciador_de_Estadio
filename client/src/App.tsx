import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Advisors from "@/pages/advisors";
import Companies from "@/pages/companies";
import Internships from "@/pages/internships";
import MandatoryInternships from "@/pages/mandatory-internships";
import NonMandatoryInternships from "@/pages/non-mandatory-internships";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/students" component={Students} />
      <Route path="/advisors" component={Advisors} />
      <Route path="/companies" component={Companies} />
      <Route path="/internships" component={Internships} />
      <Route path="/mandatory-internships" component={MandatoryInternships} />
      <Route path="/non-mandatory-internships" component={NonMandatoryInternships} />
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
