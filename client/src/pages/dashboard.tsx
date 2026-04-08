import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import StatsOverview from "@/components/dashboard/stats-overview";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentActivity from "@/components/dashboard/recent-activity";
import LevelOverview from "@/components/dashboard/level-overview";
import RecentStudents from "@/components/dashboard/recent-students";
import StudentAbsenteeismReport from "@/components/dashboard/student-absenteeism-report";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <TopBar 
          title="Admin Dashboard" 
          subtitle="Manage your educational institution" 
        />
        <div className="p-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="relative max-w-xl">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student by name, email, or student number"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Filters student-related dashboard sections: recent students, activity, and absenteeism report.
            </p>
          </div>

          <StatsOverview />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <QuickActions />
            <div className="lg:col-span-2">
              <RecentActivity searchTerm={studentSearch} />
            </div>
          </div>

          <LevelOverview />
          <StudentAbsenteeismReport searchTerm={studentSearch} />
          <RecentStudents searchTerm={studentSearch} />
        </div>
      </main>
    </div>
  );
}
