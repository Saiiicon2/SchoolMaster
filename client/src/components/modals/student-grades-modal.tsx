import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number | null;
}

export default function StudentGradesModal({ open, onOpenChange, studentId }: Props) {
  const { toast } = useToast();

  const { data: grades, isLoading } = useQuery({
    queryKey: ["/api/grades/student", studentId],
    enabled: !!studentId && open,
    queryFn: async () => (await apiRequest("GET", `/api/grades/student/${studentId}`)).json(),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Student Grades</DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Grades</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">Loading...</div>
            ) : !grades || grades.length === 0 ? (
              <div className="py-8 text-center">No grades found for this student.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase">
                      <th className="px-4 py-2">Subject</th>
                      <th className="px-4 py-2">Score</th>
                      <th className="px-4 py-2">Max</th>
                      <th className="px-4 py-2">Entered By</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g: any) => (
                      <tr key={g.id} className="border-t">
                        <td className="px-4 py-2">{g.subjectName || g.subjectId}</td>
                        <td className="px-4 py-2">{g.score}</td>
                        <td className="px-4 py-2">{g.maxScore ?? g.max_score ?? ''}</td>
                        <td className="px-4 py-2">{g.enteredBy || g.entered_by || ''}</td>
                        <td className="px-4 py-2">{g.enteredAt ? new Date(g.enteredAt * 1000).toLocaleDateString() : ''}</td>
                        <td className="px-4 py-2">{g.comments || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
