import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, BookOpen, ClipboardList, BarChart3 } from "lucide-react";
import AddStudentModal from "@/components/modals/add-student-modal";
import AddSubjectModal from "@/components/modals/add-subject-modal";
import AttendanceModal from "@/components/modals/attendance-modal";
import { useQuery } from "@tanstack/react-query";

export default function QuickActions() {
  const { user } = useAuth();
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);

  const { data: levels } = useQuery({
    queryKey: ["/api/levels"],
  });

  // Don't show quick actions for students
    if (user?.role !== 'admin' && user?.role !== 'teacher') {
    return null;
  }

  const actions = [
    {
      title: "Add New Student",
      icon: UserPlus,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      onClick: () => setShowAddStudent(true),
    },
    {
      title: "Create Subject",
      icon: BookOpen,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
      onClick: () => setShowAddSubject(true),
    },
    {
      title: "Mark Attendance",
      icon: UserPlus,
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-500",
      onClick: () => setShowAttendance(true),
    },
    {
      title: "Enter Grades",
      icon: ClipboardList,
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
      onClick: () => window.location.href = '/grades',
    },
    {
      title: "Generate Report",
      icon: BarChart3,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      onClick: () => {
        // Placeholder for report generation
        alert('Report generation feature coming soon!');
      },
    },
  ];

  return (
    <>
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="w-full justify-start h-auto p-3 border-slate-200 hover:bg-slate-50"
                  onClick={action.onClick}
                >
                  <div className={`w-8 h-8 ${action.iconBg} rounded-lg flex items-center justify-center mr-3`}>
                    <Icon className={`${action.iconColor} h-4 w-4`} />
                  </div>
                  <span className="text-sm font-medium text-slate-900">{action.title}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AddStudentModal 
        open={showAddStudent} 
        onOpenChange={setShowAddStudent}
        levels={levels || []}
      />
      <AddSubjectModal 
        open={showAddSubject} 
        onOpenChange={setShowAddSubject}
        levels={levels || []}
      />
      <AttendanceModal open={showAttendance} onOpenChange={setShowAttendance} />
    </>
  );
}
