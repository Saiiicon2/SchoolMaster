import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface AttendanceRecord {
  studentId: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  status?: string | null;
  note?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AttendanceModal({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchRecords(date);
  }, [open, date]);

  async function fetchRecords(d: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${d}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setRecords(data.map((r: any) => ({
        studentId: r.studentId,
        studentNumber: r.studentNumber,
        firstName: r.firstName,
        lastName: r.lastName,
        status: r.status || 'absent',
        note: r.note || '',
      })));
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not load students', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function setStatus(studentId: number, status: string) {
    setRecords((prev) => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  }

  function setNote(studentId: number, note: string) {
    setRecords((prev) => prev.map(r => r.studentId === studentId ? { ...r, note } : r));
  }

  async function save() {
    setLoading(true);
    try {
      const payload = records.map(r => ({ studentId: r.studentId, attendanceDate: date, status: r.status, note: r.note }));
      await apiRequest('POST', '/api/attendance', { records: payload });
      toast({ title: 'Saved', description: 'Attendance saved' });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to save attendance', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <label className="text-sm">Date:</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="max-h-80 overflow-y-auto border rounded p-2">
            {loading ? (
              <p>Loading...</p>
            ) : records.length === 0 ? (
              <p className="text-sm text-slate-500">No students found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th>Student</th>
                    <th>Status</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.studentId} className="border-t">
                      <td className="py-2">{r.studentNumber} — {r.firstName} {r.lastName}</td>
                      <td className="py-2">
                        <select value={r.status || 'absent'} onChange={(e) => setStatus(r.studentId, e.target.value)} className="border rounded px-2 py-1">
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                        </select>
                      </td>
                      <td className="py-2">
                        <input value={r.note || ''} onChange={(e) => setNote(r.studentId, e.target.value)} className="border rounded px-2 py-1 w-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save Attendance'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
