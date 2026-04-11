import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, TrendingUp, Users, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const createAssessmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["test", "exam", "continuous", "assignment"]),
  subjectId: z.coerce.number().min(1, "Subject is required"),
  totalMarks: z.coerce.number().min(1, "Total marks required"),
  assessmentDate: z.string().min(1, "Assessment date is required"),
  description: z.string().optional(),
});

type CreateAssessmentForm = z.infer<typeof createAssessmentSchema>;

const addScoreSchema = z.object({
  assessmentId: z.coerce.number().min(1, "Assessment is required"),
  studentId: z.coerce.number().min(1, "Student is required"),
  score: z.coerce.number().min(0, "Score must be non-negative"),
  comments: z.string().optional(),
});

type AddScoreForm = z.infer<typeof addScoreSchema>;

export default function Grades() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);

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
    queryFn: async () => (await apiRequest("GET", "/api/levels")).json(),
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => (await apiRequest("GET", "/api/subjects")).json(),
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => (await apiRequest("GET", "/api/students")).json(),
  });

  const { data: assessments, refetch: refetchAssessments } = useQuery({
    queryKey: ["/api/assessments"],
    queryFn: async () => (await apiRequest("GET", "/api/assessments")).json(),
  });

  const assessmentForm = useForm<CreateAssessmentForm>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: {
      title: "",
      type: "test",
      subjectId: 0,
      totalMarks: 100,
      assessmentDate: new Date().toISOString().split('T')[0],
      description: "",
    },
  });

  const scoreForm = useForm<AddScoreForm>({
    resolver: zodResolver(addScoreSchema),
    defaultValues: {
      assessmentId: 0,
      studentId: 0,
      score: 0,
      comments: "",
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (data: CreateAssessmentForm) => {
      await apiRequest("POST", "/api/assessments", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Assessment created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      assessmentForm.reset();
      setAssessmentOpen(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create assessment",
        variant: "destructive",
      });
    },
  });

  const addScoreMutation = useMutation({
    mutationFn: async (data: AddScoreForm) => {
      await apiRequest("POST", "/api/assessment-results", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Score added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      scoreForm.reset();
      setScoreOpen(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add score",
        variant: "destructive",
      });
    },
  });

  const filteredSubjects = subjects?.filter((subject: any) => 
    selectedLevel === "all" || subject.levelId === parseInt(selectedLevel)
  ) || [];

  const filteredAssessments = assessments?.filter((assessment: any) =>
    selectedSubject === "all" || assessment.subjectId === parseInt(selectedSubject)
  ) || [];

  const isTeacherOrAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'teacher';
  const isStudent = user?.role === 'student';

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
          title={isStudent ? "My Academic Performance" : "Grade & Assessment Management"} 
          subtitle={isStudent ? "View your grades and assessment results" : "Manage grades, tests, exams and assessments"} 
        />
        
        <div className="p-6">
          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isStudent ? "My Grades" : "Assessments & Grades"}
              </h2>
              <p className="text-slate-600">
                {isStudent ? "Track your academic performance" : "Manage student academic performance"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {!isStudent && (
                <>
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

                  {isTeacherOrAdmin && (
                    <>
                      <Dialog open={assessmentOpen} onOpenChange={setAssessmentOpen}>
                        <DialogTrigger asChild>
                          <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Assessment
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Create New Assessment</DialogTitle>
                          </DialogHeader>
                          <Form {...assessmentForm}>
                            <form onSubmit={assessmentForm.handleSubmit((data) => createAssessmentMutation.mutate(data))} className="space-y-4">
                              <FormField
                                control={assessmentForm.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Assessment Title</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Midterm Exam" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={assessmentForm.control}
                                name="type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="test">Test</SelectItem>
                                        <SelectItem value="exam">Exam</SelectItem>
                                        <SelectItem value="continuous">Continuous Assessment</SelectItem>
                                        <SelectItem value="assignment">Assignment</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={assessmentForm.control}
                                name="subjectId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {subjects?.map((subject: any) => (
                                          <SelectItem key={subject.id} value={subject.id.toString()}>
                                            {subject.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={assessmentForm.control}
                                name="totalMarks"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Total Marks</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={assessmentForm.control}
                                name="assessmentDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Assessment Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setAssessmentOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={createAssessmentMutation.isPending}>
                                  {createAssessmentMutation.isPending ? "Creating..." : "Create"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={scoreOpen} onOpenChange={setScoreOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Score
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Assessment Score</DialogTitle>
                          </DialogHeader>
                          <Form {...scoreForm}>
                            <form onSubmit={scoreForm.handleSubmit((data) => addScoreMutation.mutate(data))} className="space-y-4">
                              <FormField
                                control={scoreForm.control}
                                name="assessmentId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Assessment</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {filteredAssessments.map((assessment: any) => (
                                          <SelectItem key={assessment.id} value={assessment.id.toString()}>
                                            {assessment.title}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={scoreForm.control}
                                name="studentId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Student</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {students?.map((student: any) => (
                                          <SelectItem key={student.id} value={student.id.toString()}>
                                            {student.firstName} {student.lastName} ({student.studentNumber})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={scoreForm.control}
                                name="score"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Score</FormLabel>
                                    <FormControl>
                                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setScoreOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={addScoreMutation.isPending}>
                                  {addScoreMutation.isPending ? "Adding..." : "Add Score"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="assessments" className="space-y-4">
            {!isStudent && (
              <TabsList>
                <TabsTrigger value="assessments">Assessments</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
              </TabsList>
            )}

            {!isStudent && (
              <TabsContent value="overview">
                {/* Grade Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{filteredAssessments.length}</div>
                      <p className="text-xs text-muted-foreground">Created assessments</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{students?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">Active students</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{subjects?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">Active subjects</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            <TabsContent value="assessments">
              {/* Assessments List */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isStudent ? "Your Assessment Results" : "Assessments"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!filteredAssessments || filteredAssessments.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No assessments found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredAssessments.map((assessment: any) => {
                        const subject = subjects?.find((s: any) => s.id === assessment.subjectId);
                        return (
                          <div key={assessment.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg">{assessment.title}</h3>
                                <p className="text-sm text-slate-600">{subject?.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{assessment.assessmentDate}</p>
                              </div>
                              <Badge variant="secondary">
                                {assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                              </Badge>
                            </div>
                            <div className="mt-3">
                              <p className="text-sm text-slate-600">Total Marks: <span className="font-medium">{assessment.totalMarks}</span></p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
