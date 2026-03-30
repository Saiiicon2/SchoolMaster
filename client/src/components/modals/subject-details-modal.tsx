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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  description: z.string().optional(),
  levelId: z.coerce.number().min(1, "Please select a level"),
  isActive: z.boolean().optional(),
});

type SubjectForm = z.infer<typeof subjectSchema>;

interface SubjectDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId?: number;
  levels: any[];
  isAdmin?: boolean;
}

export default function SubjectDetailsModal({ 
  open, 
  onOpenChange, 
  subjectId, 
  levels,
  isAdmin = false,
}: SubjectDetailsModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: subject, isLoading } = useQuery({
    queryKey: ["/api/subjects", subjectId],
    queryFn: async () => {
      const res = await fetch(`/api/subjects/${subjectId}`);
      if (!res.ok) throw new Error("Failed to fetch subject");
      return res.json();
    },
    enabled: open && !!subjectId,
  });

  const form = useForm<SubjectForm>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      description: "",
      levelId: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (subject) {
      form.reset({
        name: subject.name,
        description: subject.description || "",
        levelId: subject.levelId,
        isActive: subject.isActive ?? true,
      });
    }
  }, [subject, form]);

  const updateSubjectMutation = useMutation({
    mutationFn: async (data: SubjectForm) => {
      await apiRequest("PUT", `/api/subjects/${subjectId}`, data);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Subject updated successfully",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/subjects", subjectId] });
      await queryClient.refetchQueries({ queryKey: ["/api/subjects"] });
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
        description: "Failed to update subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubjectForm) => {
    updateSubjectMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!subject) {
    return null;
  }

  const level = levels?.find((l: any) => l.id === subject.levelId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isEditing ? "Edit Subject" : "Subject Details"}</DialogTitle>
            {isAdmin && !isEditing && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Subject Name</label>
              <p className="text-lg font-semibold text-slate-900 mt-1">{subject.name}</p>
            </div>

            {subject.description && (
              <div>
                <label className="text-sm font-medium text-slate-600">Description</label>
                <p className="text-slate-700 mt-1">{subject.description}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-600">Level</label>
              <Badge className="bg-primary/10 text-primary mt-2">
                {level?.name}
              </Badge>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Status</label>
              <Badge className={`${subject.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} mt-2`}>
                {subject.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter subject name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter subject description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="levelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value ? field.value.toString() : ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((level) => (
                            <SelectItem key={level.id} value={level.id.toString()}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateSubjectMutation.isPending}
                >
                  {updateSubjectMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
