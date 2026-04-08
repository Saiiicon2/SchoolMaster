import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface StudentAbsenteeismReportProps {
  searchTerm?: string;
}

export default function StudentAbsenteeismReport({ searchTerm = "" }: StudentAbsenteeismReportProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: attendance, isLoading } = useQuery({
    queryKey: ["/api/attendance", date],
    queryFn: async () => {
      const res = await fetch(`/api/attendance?date=${date}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch attendance report");
      }
      return res.json();
    },
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const rows = Array.isArray(attendance) ? attendance : [];
  const filteredRows = rows.filter((row: any) => {
    if (!normalizedSearch) return true;
    const fullName = `${row.firstName || ""} ${row.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(normalizedSearch) ||
      row.studentNumber?.toLowerCase().includes(normalizedSearch)
    );
  });

  const absentRows = filteredRows.filter((row: any) => (row.status || "absent") === "absent");
  const lateRows = filteredRows.filter((row: any) => row.status === "late");
  const presentRows = filteredRows.filter((row: any) => row.status === "present");

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Student Report & Absenteeism</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Attendance summary and absent students by selected date.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-slate-500">Loading attendance report...</div>
        ) : filteredRows.length === 0 ? (
          <div className="text-sm text-slate-500">
            {normalizedSearch ? "No attendance rows match your student search." : "No attendance records found for this date."}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Present</p>
                <p className="text-xl font-semibold text-green-700">{presentRows.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Late</p>
                <p className="text-xl font-semibold text-amber-700">{lateRows.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Absent</p>
                <p className="text-xl font-semibold text-red-700">{absentRows.length}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2">Absent Students</h4>
              {absentRows.length === 0 ? (
                <p className="text-sm text-slate-500">No absent students for this filter/date.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 py-2">Student</th>
                        <th className="text-left px-3 py-2">Student ID</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-left px-3 py-2">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absentRows.slice(0, 10).map((row: any) => (
                        <tr key={row.studentId} className="border-t border-slate-100">
                          <td className="px-3 py-2">{row.firstName} {row.lastName}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.studentNumber}</td>
                          <td className="px-3 py-2">
                            <Badge className="bg-red-100 text-red-800">Absent</Badge>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{row.note || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
