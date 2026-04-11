import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import Students from "@/pages/students";
import Teachers from "@/pages/teachers";
import Levels from "@/pages/levels";
import Subjects from "@/pages/subjects";
import Grades from "@/pages/grades";
import Forums from "@/pages/forums";
import FinanceDashboard from "@/pages/finance-dashboard";
import Finance from "@/pages/finance";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const authUser = user as { role?: string } | undefined;
  const isAdminOrSuper = authUser?.role === 'admin' || authUser?.role === 'superadmin';

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
        </>
      ) : authUser?.role === "finance" ? (
        <>
          <Route path="/" component={FinanceDashboard} />
          <Route path="/finance-dashboard" component={FinanceDashboard} />
          <Route path="/finance" component={Finance} />
        </>
      ) : authUser?.role === "teacher" ? (
        <>
          <Route path="/" component={TeacherDashboard} />
          <Route path="/teacher" component={TeacherDashboard} />
          <Route path="/subjects" component={Subjects} />
          <Route path="/grades" component={Grades} />
          <Route path="/forums" component={Forums} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/students" component={Students} />
          <Route path="/teachers" component={Teachers} />
          <Route path="/levels" component={Levels} />
          <Route path="/subjects" component={Subjects} />
          <Route path="/grades" component={Grades} />
          <Route path="/forums" component={Forums} />
          <Route path="/finance-dashboard" component={FinanceDashboard} />
          <Route path="/finance" component={Finance} />
        </>
      )}
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

