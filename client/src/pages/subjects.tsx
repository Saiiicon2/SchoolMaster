import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, Users } from "lucide-react";
import AddSubjectModal from "@/components/modals/add-subject-modal";
import SubjectDetailsModal from "@/components/modals/subject-details-modal";

export default function Subjects() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
    // Redirect students to dashboard - they shouldn't manage subjects
    if (!isLoading && user && user.role === 'student') {
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: levels } = useQuery({
    queryKey: ["/api/levels"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const filteredSubjects = subjects?.filter((subject: any) => 
    selectedLevel === "all" || subject.levelId === parseInt(selectedLevel)
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
          title="Subject Management" 
          subtitle="Manage subjects and academic content" 
        />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Subjects</h2>
              <p className="text-slate-600">Configure subjects for each academic level</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels?.map((level: any) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {user?.role === 'admin' && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              )}
            </div>
          </div>

          {subjectsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading subjects...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-slate-500">
                  {selectedLevel === "all" 
                    ? "No subjects found. Add your first subject to get started."
                    : "No subjects found for the selected level."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject: any) => {
                const level = levels?.find((l: any) => l.id === subject.levelId);
                const levelStudents = students?.filter((s: any) => s.currentLevelId === subject.levelId) || [];
                
                return (
                  <Card key={subject.id} className="border border-slate-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-semibold text-slate-900">{subject.name}</CardTitle>
                          <Badge className="bg-primary/10 text-primary mt-2">
                            {level?.name}
                          </Badge>
                        </div>
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      {subject.description && (
                        <p className="text-sm text-slate-600 mt-2">{subject.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Enrolled Students:</span>
                          </div>
                          <span className="font-medium">{levelStudents.length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Status:</span>
                          <Badge className={subject.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {subject.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedSubjectId(subject.id);
                              setShowDetailsModal(true);
                            }}
                          >
                            View Details
                          </Button>
                          {user?.role === 'admin' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                setSelectedSubjectId(subject.id);
                                setShowDetailsModal(true);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AddSubjectModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        levels={levels || []}
      />

      <SubjectDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        subjectId={selectedSubjectId}
        levels={levels || []}
        isAdmin={user?.role === 'admin'}
      />
    </div>
  );
}
