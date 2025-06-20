import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, TrendingUp, Users } from "lucide-react";

export default function Grades() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

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

  const { data: levels } = useQuery({
    queryKey: ["/api/levels"],
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const filteredSubjects = subjects?.filter((subject: any) => 
    selectedLevel === "all" || subject.levelId === parseInt(selectedLevel)
  ) || [];

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
          title="Grade Management" 
          subtitle="Enter and track student academic performance" 
        />
        
        <div className="p-6">
          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Grades</h2>
              <p className="text-slate-600">Manage student grades and academic performance</p>
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
              
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {filteredSubjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {user?.role === 'admin' && (
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Enter Grades
                </Button>
              )}
            </div>
          </div>

          {/* Grade Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.3%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Graded Assignments</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">
                  Across all subjects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students Graded</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-muted-foreground">
                  Total active students
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subject Grade Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No subjects found for the selected level.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubjects.map((subject: any) => {
                    const level = levels?.find((l: any) => l.id === subject.levelId);
                    const levelStudents = students?.filter((s: any) => s.currentLevelId === subject.levelId) || [];
                    
                    return (
                      <Card key={subject.id} className="border border-slate-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base font-medium">{subject.name}</CardTitle>
                              <Badge variant="secondary" className="mt-1">
                                {level?.name}
                              </Badge>
                            </div>
                            <BookOpen className="h-5 w-5 text-slate-400" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Students:</span>
                              <span className="font-medium">{levelStudents.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Avg. Grade:</span>
                              <span className="font-medium text-green-600">85.2%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Assignments:</span>
                              <span className="font-medium">12</span>
                            </div>
                          </div>
                          
                          {user?.role === 'admin' && (
                            <div className="mt-4 pt-3 border-t border-slate-200">
                              <Button variant="outline" size="sm" className="w-full">
                                Enter Grades
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Grade Entries */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Grade Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-slate-500">Grade history will appear here once grades are entered.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
