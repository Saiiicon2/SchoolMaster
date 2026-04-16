import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const addLevelSchema = z.object({
  name: z.string().min(1, "Level name is required"),
  description: z.string().optional(),
  durationMonths: z.coerce.number().min(1, "Duration must be at least 1 month").default(6),
  sortOrder: z.coerce.number().min(0).default(0),
});

type AddLevelForm = z.infer<typeof addLevelSchema>;

interface AddLevelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddLevelModal({ open, onOpenChange }: AddLevelModalProps) {
  const { toast } = useToast();
  
  const form = useForm<AddLevelForm>({
    resolver: zodResolver(addLevelSchema),
    defaultValues: {
      name: "",
      description: "",
      durationMonths: 6,
      sortOrder: 0,
    },
  });

  const createLevelMutation = useMutation({
    mutationFn: async (data: AddLevelForm) => {
      await apiRequest("POST", "/api/levels", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Level added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/levels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
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
        description: "Failed to add level. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddLevelForm) => {
    createLevelMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Level</DialogTitle>
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
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="0 = first, 1 = second…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLevelMutation.isPending}>
                {createLevelMutation.isPending ? "Adding..." : "Add Level"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
