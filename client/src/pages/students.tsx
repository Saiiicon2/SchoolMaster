import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Plus, Search } from "lucide-react";
import AddStudentModal from "@/components/modals/add-student-modal";
import StudentGradesModal from "@/components/modals/student-grades-modal";

export default function Students() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

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
    // Redirect students to dashboard - they shouldn't be able to manage students
    if (!isLoading && user && user.role === 'student') {
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: levels } = useQuery({
    queryKey: ["/api/levels"],
  });

  const filteredStudents = students?.filter((student: any) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading || !isAuthenticated || user?.role === 'student') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <TopBar 
          title="Student Management" 
          subtitle="Manage student enrollment and information" 
        />
        
        <div className="p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">Students</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <Button 
                      onClick={() => setShowAddModal(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-slate-600">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No students found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Enrollment Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredStudents.map((student: any) => {
                        const level = levels?.find((l: any) => l.id === student.currentLevelId);
                        return (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-slate-600">
                                    {student.firstName[0]}{student.lastName[0]}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-slate-900">
                                    {student.firstName} {student.lastName}
                                  </div>
                                  <div className="text-sm text-slate-500">{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-mono">
                              {student.studentNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className="bg-primary/10 text-primary">
                                {level?.name || 'No Level'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {new Date(student.enrollmentDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                className={
                                  student.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : student.status === 'graduated'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {student.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedStudentId(student.id); setShowGradesModal(true); }}>
                                  <Eye className="h-4 w-4 text-primary" />
                                </Button>
                                {user?.role === 'admin' && (
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4 text-slate-400" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <AddStudentModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        levels={levels || []}
      />
      <StudentGradesModal
        open={showGradesModal}
        onOpenChange={(open) => { if (!open) setSelectedStudentId(null); setShowGradesModal(open); }}
        studentId={selectedStudentId}
      />
    </div>
  );
}
