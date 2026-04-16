import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, Edit, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import TeacherDetailsModal from "@/components/modals/teacher-details-modal";

const addTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  employmentDate: z.string().min(1, "Employment date is required"),
});

type AddTeacherForm = z.infer<typeof addTeacherSchema>;

export default function Teachers() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Check authorization
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
    if (!isLoading && user && user.role !== 'admin' && user.role !== 'superadmin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can manage teachers",
        variant: "destructive",
      });
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/teachers");
      return await response.json();
    },
  });

  const { data: levels = [] } = useQuery({
    queryKey: ["/api/levels"],
  });

  const form = useForm<AddTeacherForm>({
    resolver: zodResolver(addTeacherSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      employmentDate: new Date().toISOString().split('T')[0],
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (data: AddTeacherForm) => {
      const r = await apiRequest("POST", "/api/auth/register-teacher", data);
      if (!r.ok) {
        const err = await r.json().catch(() => ({ message: "Failed to add teacher" }));
        throw new Error(err.message);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to add teacher",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <TopBar title="Teachers" subtitle="Manage institute teachers" />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Teachers Directory</h2>
              <p className="text-slate-600 mt-1">Total: {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}</p>
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createTeacherMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
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
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Login Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Min. 6 characters" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="employmentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTeacherMutation.isPending}>
                        {createTeacherMutation.isPending ? "Adding..." : "Add Teacher"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {teachersLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : teachers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-600">No teachers found</p>
                <p className="text-sm text-slate-500">Add a teacher to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {teachers.map((teacher: any) => (
                <Card key={teacher.id} className="border border-slate-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {teacher.firstName} {teacher.lastName}
                        </CardTitle>
                        <CardDescription>{teacher.email}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Employment Date</p>
                        <p className="text-sm font-medium">{teacher.employmentDate}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                          {teacher.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                        {teacher.specialties && (
                          <Badge variant="outline">
                            {teacher.specialties.split(",").length} specialt{teacher.specialties.split(",").length !== 1 ? 'ies' : 'y'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacherId(teacher.id);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <TeacherDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        teacherId={selectedTeacherId}
        isAdmin={user?.role === 'admin' || user?.role === 'superadmin'}
        levels={levels}
      />
    </div>
  );
}
