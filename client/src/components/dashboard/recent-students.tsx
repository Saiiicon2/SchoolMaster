import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Plus, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RecentStudentsProps {
  searchTerm?: string;
}

export default function RecentStudents({ searchTerm = "" }: RecentStudentsProps) {
  const { user } = useAuth();
  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: levels } = useQuery({
    queryKey: ["/api/levels"],
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Student Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  // Apply search across all students, then show the most recent matching rows.
  const recentStudents = (students || []).filter((student: any) => {
    if (!normalizedSearch) return true;
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return (
      fullName.includes(normalizedSearch) ||
      student.email?.toLowerCase().includes(normalizedSearch) ||
      student.studentNumber?.toLowerCase().includes(normalizedSearch)
    );
  }).slice(0, 5);

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
      <CardHeader>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Student Registrations</CardTitle>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {user?.role === 'admin' && (
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => window.location.href = '/students'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {recentStudents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">
              {normalizedSearch ? "No students match your search." : "No students found."}
            </p>
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
                {recentStudents.map((student: any) => {
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
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                          {user?.role === 'admin' && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
  );
}
