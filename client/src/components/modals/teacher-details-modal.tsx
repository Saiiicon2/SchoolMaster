import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const teacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  userId: z.string().min(1, "User ID is required"),
  employmentDate: z.string().min(1, "Employment date is required"),
  specialties: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type TeacherForm = z.infer<typeof teacherSchema>;

interface TeacherDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId?: number;
  isAdmin?: boolean;
  levels?: any[];
}

export default function TeacherDetailsModal({
  open,
  onOpenChange,
  teacherId,
  isAdmin = false,
  levels = [],
}: TeacherDetailsModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

  const { data: teacher, isLoading } = useQuery({
    queryKey: ["/api/teachers", teacherId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/teachers/${teacherId}`);
      return await response.json();
    },
    enabled: open && !!teacherId,
  });

  const { data: teacherLevels } = useQuery({
    queryKey: ["/api/teachers", teacherId, "levels"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/teachers/${teacherId}/levels`);
      return await response.json();
    },
    enabled: open && !!teacherId,
  });

  const { data: teacherSubjectAssignments = [] } = useQuery({
    queryKey: ["/api/teachers", teacherId, "subjects"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/teachers/${teacherId}/subjects`);
      return await response.json();
    },
    enabled: open && !!teacherId,
  });

  const { data: allSubjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subjects");
      return await response.json();
    },
    enabled: open && isAdmin,
  });

  const form = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      userId: "",
      employmentDate: "",
      specialties: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (teacher) {
      form.reset({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        userId: teacher.userId,
        employmentDate: teacher.employmentDate,
        specialties: teacher.specialties || "",
        status: teacher.status || "active",
      });
    }
    if (teacherLevels) {
      setSelectedLevels(teacherLevels.map((tl: any) => tl.levelId));
    }
    if (teacherSubjectAssignments) {
      setSelectedSubjects(teacherSubjectAssignments.map((ts: any) => ts.subjectId));
    }
  }, [teacher, teacherLevels, teacherSubjectAssignments, form]);

  const updateTeacherMutation = useMutation({
    mutationFn: async (data: TeacherForm) => {
      await apiRequest("PUT", `/api/teachers/${teacherId}`, data);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Teacher updated successfully",
      });

      // Handle level assignments
      if (teacherLevels) {
        const currentLevelIds = teacherLevels.map((tl: any) => tl.levelId);
        for (const levelId of currentLevelIds) {
          if (!selectedLevels.includes(levelId)) {
            await apiRequest("DELETE", `/api/teachers/${teacherId}/levels/${levelId}`);
          }
        }
        for (const levelId of selectedLevels) {
          if (!currentLevelIds.includes(levelId)) {
            await apiRequest("POST", `/api/teachers/${teacherId}/levels`, { levelId });
          }
        }
      }

      // Handle subject assignments
      const currentSubjectIds = teacherSubjectAssignments.map((ts: any) => ts.subjectId);
      for (const subjectId of currentSubjectIds) {
        if (!selectedSubjects.includes(subjectId)) {
          await apiRequest("DELETE", `/api/teachers/${teacherId}/subjects/${subjectId}`);
        }
      }
      for (const subjectId of selectedSubjects) {
        if (!currentSubjectIds.includes(subjectId)) {
          await apiRequest("POST", `/api/teachers/${teacherId}/subjects`, { subjectId });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/teachers", teacherId] });
      await queryClient.invalidateQueries({ queryKey: ["/api/teachers", teacherId, "subjects"] });
      setIsEditing(false);
      onOpenChange(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update teacher. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/teachers/${teacherId}`);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      onOpenChange(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete teacher. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeacherForm) => {
    updateTeacherMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!teacher) {
    return null;
  }

  const specialtiesList = teacher.specialties ? teacher.specialties.split(",").map((s: string) => s.trim()) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isEditing ? "Edit Teacher" : `${teacher.firstName} ${teacher.lastName}`}</DialogTitle>
            <div className="flex gap-2">
              {isAdmin && !isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              {isAdmin && isEditing && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this teacher?")) {
                      deleteTeacherMutation.mutate();
                    }
                  }}
                  disabled={deleteTeacherMutation.isPending}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1">
        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">First Name</label>
                <p className="text-slate-900 mt-1">{teacher.firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Last Name</label>
                <p className="text-slate-900 mt-1">{teacher.lastName}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Email</label>
              <p className="text-slate-900 mt-1">{teacher.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Employment Date</label>
              <p className="text-slate-900 mt-1">{teacher.employmentDate}</p>
            </div>

            {specialtiesList.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600">Specialties</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {specialtiesList.map((specialty: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedLevels.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600">Assigned Levels</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {levels
                    .filter((l) => selectedLevels.includes(l.id))
                    .map((level) => (
                      <Badge key={level.id} className="bg-blue-100 text-blue-800">
                        {level.name}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {selectedSubjects.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600">Assigned Subjects</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allSubjects
                    .filter((s: any) => selectedSubjects.includes(s.id))
                    .map((subject: any) => (
                      <Badge key={subject.id} className="bg-purple-100 text-purple-800">
                        {subject.name}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-600">Status</label>
              <Badge className={teacher.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {teacher.status}
              </Badge>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialties (Optional, comma-separated)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Mathematics, Physics, Chemistry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Assign to Levels</label>
                <div className="space-y-2 border rounded-md p-3">
                  {levels.map((level) => (
                    <div key={level.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`level-${level.id}`}
                        checked={selectedLevels.includes(level.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLevels([...selectedLevels, level.id]);
                          } else {
                            setSelectedLevels(selectedLevels.filter((id) => id !== level.id));
                          }
                        }}
                      />
                      <label htmlFor={`level-${level.id}`} className="text-sm cursor-pointer">
                        {level.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Assign Subjects</label>
                <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                  {allSubjects.length === 0 && (
                    <p className="text-sm text-slate-400">No subjects available</p>
                  )}
                  {allSubjects.map((subject: any) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSubjects([...selectedSubjects, subject.id]);
                          } else {
                            setSelectedSubjects(selectedSubjects.filter((id) => id !== subject.id));
                          }
                        }}
                      />
                      <label htmlFor={`subject-${subject.id}`} className="text-sm cursor-pointer">
                        {subject.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTeacherMutation.isPending}>
                  {updateTeacherMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
