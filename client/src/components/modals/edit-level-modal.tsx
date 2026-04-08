import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const editLevelSchema = z.object({
  name: z.string().min(1, "Level name is required"),
  description: z.string().optional(),
  durationMonths: z.coerce.number().min(1, "Duration must be at least 1 month").default(6),
  isActive: z.boolean().default(true),
});

type EditLevelForm = z.infer<typeof editLevelSchema>;

interface EditLevelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: any | null;
}

export default function EditLevelModal({ open, onOpenChange, level }: EditLevelModalProps) {
  const { toast } = useToast();

  const form = useForm<EditLevelForm>({
    resolver: zodResolver(editLevelSchema),
    defaultValues: {
      name: "",
      description: "",
      durationMonths: 6,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!level) return;
    form.reset({
      name: level.name || "",
      description: level.description || "",
      durationMonths: level.durationMonths || 6,
      isActive: Boolean(level.isActive),
    });
  }, [level, form]);

  const updateLevelMutation = useMutation({
    mutationFn: async (data: EditLevelForm) => {
      if (!level?.id) throw new Error("Missing level id");
      await apiRequest("PUT", `/api/levels/${level.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Level updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/levels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
        description: "Failed to update level. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditLevelForm) => {
    updateLevelMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Level</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Level 1, Level 2" {...field} />
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
                    <Textarea placeholder="Enter level description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Months)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ? "active" : "inactive"}
                      onValueChange={(value) => field.onChange(value === "active")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLevelMutation.isPending}>
                {updateLevelMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
