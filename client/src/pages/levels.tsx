import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, BookOpen, Clock } from "lucide-react";
import AddLevelModal from "@/components/modals/add-level-modal";

export default function Levels() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

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

  const { data: levels, isLoading: levelsLoading } = useQuery({
    queryKey: ["/api/levels"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  if (isLoading || !isAuthenticated) {
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
          title="Level Management" 
          subtitle="Manage academic levels and progression" 
        />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Academic Levels</h2>
              <p className="text-slate-600">Configure levels and track student progression</p>
            </div>
            {user?.role === 'admin' && (
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Level
              </Button>
            )}
          </div>

          {levelsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading levels...</p>
            </div>
          ) : levels?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-slate-500">No levels found. Add your first level to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {levels?.map((level: any) => {
                const levelStudents = students?.filter((s: any) => s.currentLevelId === level.id) || [];
                const levelSubjects = subjects?.filter((s: any) => s.levelId === level.id) || [];
                
                return (
                  <Card key={level.id} className="border border-slate-200">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <CardTitle className="font-semibold text-slate-900">{level.name}</CardTitle>
                        <Badge className={level.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {level.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {level.description && (
                        <p className="text-sm text-slate-600">{level.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Students:</span>
                          </div>
                          <span className="font-medium">{levelStudents.length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-600">
                            <BookOpen className="h-4 w-4 mr-2" />
                            <span>Subjects:</span>
                          </div>
                          <span className="font-medium">{levelSubjects.length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Duration:</span>
                          </div>
                          <span className="font-medium">{level.durationMonths} months</span>
                        </div>
                      </div>

                      {/* Progress simulation for active levels */}
                      {level.isActive && levelStudents.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progress</span>
                            <span>68%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: '68%' }}></div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AddLevelModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}
