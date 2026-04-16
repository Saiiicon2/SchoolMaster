import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Save,
  ChevronRight,
  GraduationCap,
  Calendar,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeacherProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employmentDate: string;
  status: string;
}

interface AssignedSubject {
  id: number;
  name: string;
  description?: string;
  levelId: number;
  levelName: string;
}

interface Student {
  id: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  currentLevelId: number;
  status: string;
}

interface AttendanceRow {
  studentId: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  status: string | null;
  note: string | null;
}

interface Assessment {
  id: number;
  title: string;
  totalMarks: number;
  assessmentDate: string;
  type: string;
}

interface AssessmentResult {
  id: number;
  assessmentId: number;
  studentId: number;
  score: number;
}

// ─── Student Info Modal ───────────────────────────────────────────────────────

function StudentInfoModal({
  student,
  level,
  open,
  onClose,
}: {
  student: Student | null;
  level: { id: number; name: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!student) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Student Information
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-500">Full Name</span>
            <span className="font-medium">{student.firstName} {student.lastName}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-500">Student Number</span>
            <span className="font-mono font-medium">{student.studentNumber}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-500">Email</span>
            <span className="font-medium">{student.email}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-500">Level</span>
            <Badge variant="outline">{level?.name ?? "–"}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <Badge
              variant={student.status === "active" ? "default" : "secondary"}
              className="capitalize"
            >
              {student.status}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Printable Mark Register ──────────────────────────────────────────────────

function MarkRegister({
  students,
  assessments,
  results,
  levelName,
  subjectName,
  onSave,
  saving,
}: {
  students: Student[];
  assessments: Assessment[];
  results: AssessmentResult[];
  levelName: string;
  subjectName: string;
  onSave: (entries: { assessmentId: number; studentId: number; score: number }[]) => void;
  saving: boolean;
}) {
  // Local marks state: key = `${assessmentId}-${studentId}`
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    results.forEach((r) => {
      init[`${r.assessmentId}-${r.studentId}`] = String(r.score);
    });
    return init;
  });

  // Sync when results change
  useEffect(() => {
    setMarks((prev) => {
      const next = { ...prev };
      results.forEach((r) => {
        const key = `${r.assessmentId}-${r.studentId}`;
        if (!(key in next)) next[key] = String(r.score);
        else next[key] = String(r.score);
      });
      return next;
    });
  }, [results]);

  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`
      <html><head><title>Mark Register – ${subjectName} – ${levelName}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
        h2 { margin-bottom: 4px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #333; padding: 5px 8px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
        input { border: none; width: 100%; font-size: 12px; }
      </style></head><body>${printContents}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }

  function setMark(assessmentId: number, studentId: number, val: string) {
    setMarks((prev) => ({ ...prev, [`${assessmentId}-${studentId}`]: val }));
  }

  function handleSave() {
    const entries: { assessmentId: number; studentId: number; score: number }[] = [];
    for (const [key, val] of Object.entries(marks)) {
      const score = parseFloat(val);
      if (isNaN(score)) continue;
      const [aId, sId] = key.split("-").map(Number);
      entries.push({ assessmentId: aId, studentId: sId, score });
    }
    onSave(entries);
  }

  function getOverallPercentage(studentId: number): number {
    if (assessments.length === 0) return 0;

    let total = 0;
    assessments.forEach((a) => {
      const raw = marks[`${a.id}-${studentId}`];
      const score = parseFloat(raw ?? "0");
      total += isNaN(score) ? 0 : score;
    });

    return total / assessments.length;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Assessment Mark Register — {subjectName} ({levelName})
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Marks"}
          </Button>
        </div>
      </div>

      <div ref={printRef}>
        <h2 className="text-sm font-bold mb-2 hidden print:block">
          {subjectName} — {levelName} — Mark Register
        </h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left text-slate-600 font-medium w-8">#</th>
                <th className="px-3 py-2 text-left text-slate-600 font-medium">Surname</th>
                <th className="px-3 py-2 text-left text-slate-600 font-medium">Name</th>
                <th className="px-3 py-2 text-left text-slate-600 font-medium">Student No.</th>
                {assessments.map((a, i) => (
                  <th key={a.id} className="px-3 py-2 text-center text-slate-600 font-medium min-w-[90px]">
                    {a.title || `Assessment ${i + 1}`}
                    <div className="text-xs text-slate-400 font-normal">/{a.totalMarks}</div>
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-slate-600 font-medium min-w-[100px]">
                  Overall %
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-3 py-1.5 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-3 py-1.5 font-medium text-slate-800">{s.lastName}</td>
                  <td className="px-3 py-1.5 text-slate-700">{s.firstName}</td>
                  <td className="px-3 py-1.5 font-mono text-xs text-slate-500">{s.studentNumber}</td>
                  {assessments.map((a) => (
                    <td key={a.id} className="px-2 py-1 text-center">
                      <Input
                        type="number"
                        min={0}
                        max={a.totalMarks}
                        value={marks[`${a.id}-${s.id}`] ?? ""}
                        onChange={(e) => setMark(a.id, s.id, e.target.value)}
                        className="text-center h-7 px-1 text-sm w-20 mx-auto"
                        placeholder="–"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-center font-semibold text-slate-800">
                    {getOverallPercentage(s.id).toFixed(1)}%
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5 + assessments.length} className="px-4 py-6 text-center text-slate-400 text-sm">
                    No students enrolled in this level.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Subject Panel ────────────────────────────────────────────────────────────

function SubjectPanel({
  subject,
  teacher,
}: {
  subject: AssignedSubject;
  teacher: TeacherProfile;
}) {
  const { toast } = useToast();
  const [attendanceDate, setAttendanceDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);

  // Fetch students for this subject's level
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: [`/api/students/level/${subject.levelId}`],
    queryFn: async () => {
      const r = await fetch(`/api/students/level/${subject.levelId}`, { credentials: "include" });
      return r.json();
    },
  });

  // Attendance scoped to this subject
  const { data: attendance = [], refetch: refetchAttendance } = useQuery<AttendanceRow[]>({
    queryKey: [`/api/attendance/subject/${subject.id}`, attendanceDate],
    queryFn: async () => {
      const r = await fetch(
        `/api/attendance/subject/${subject.id}?date=${attendanceDate}`, { credentials: "include" }
      );
      return r.json();
    },
  });

  const [localAttendance, setLocalAttendance] = useState<Record<number, string>>({});

  useEffect(() => {
    const map: Record<number, string> = {};
    attendance.forEach((a) => {
      map[a.studentId] = a.status ?? "absent";
    });
    setLocalAttendance(map);
  }, [attendance]);

  function setStatus(studentId: number, status: string) {
    setLocalAttendance((prev) => ({ ...prev, [studentId]: status }));
  }

  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      const records = students.map((s) => ({
        studentId: s.id,
        attendanceDate,
        subjectId: subject.id,
        status: localAttendance[s.id] ?? "absent",
        note: null,
      }));
      const r = await apiRequest("POST", "/api/attendance", { records });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      refetchAttendance();
      toast({ title: "Attendance saved" });
    },
    onError: () => toast({ title: "Error", description: "Could not save attendance", variant: "destructive" }),
  });

  // Assessments for this subject
  const { data: assessments = [] } = useQuery<Assessment[]>({
    queryKey: [`/api/assessments/subject/${subject.id}`],
    queryFn: async () => {
      const r = await fetch(`/api/assessments/subject/${subject.id}`, { credentials: "include" });
      return r.json();
    },
  });

  // Assessment results for this subject
  const { data: results = [], refetch: refetchResults } = useQuery<AssessmentResult[]>({
    queryKey: [`/api/assessment-results/subject/${subject.id}`],
    queryFn: async () => {
      const r = await fetch(`/api/assessment-results/subject/${subject.id}`, { credentials: "include" });
      return r.json();
    },
  });

  const saveMarksMutation = useMutation({
    mutationFn: async (entries: { assessmentId: number; studentId: number; score: number }[]) => {
      const r = await apiRequest("POST", "/api/assessment-results/bulk", { entries });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      refetchResults();
      toast({ title: "Marks saved successfully" });
    },
    onError: () => toast({ title: "Error", description: "Could not save marks", variant: "destructive" }),
  });

  const statusIcon = (status: string) =>
    status === "present" ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : status === "late" ? (
      <Clock className="h-4 w-4 text-amber-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-400" />
    );

  // Dummy level object for StudentInfoModal
  const levelForModal = { id: subject.levelId, name: subject.levelName, subjects: [] };

  return (
    <div className="space-y-6">
      {/* Attendance section */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Attendance — {subject.name}
          </h3>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="h-8 text-sm w-40"
            />
            <Button
              size="sm"
              onClick={() => saveAttendanceMutation.mutate()}
              disabled={saveAttendanceMutation.isPending}
              className="gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              {saveAttendanceMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">
            No students enrolled in {subject.levelName}.
          </p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {students.map((student) => {
              const status = localAttendance[student.id] ?? "absent";
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <button
                    className="flex items-center gap-3 text-left flex-1"
                    onClick={() => { setSelectedStudent(student); setStudentModalOpen(true); }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {student.lastName}, {student.firstName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{student.studentNumber}</p>
                    </div>
                  </button>
                  <div className="flex gap-1.5 items-center">
                    {(["present", "late", "absent"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(student.id, s)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors border ${
                          status === s
                            ? s === "present"
                              ? "bg-green-500 text-white border-green-500"
                              : s === "late"
                              ? "bg-amber-400 text-white border-amber-400"
                              : "bg-red-400 text-white border-red-400"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    {statusIcon(status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mark Register */}
      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            No assessments have been added for <strong>{subject.name}</strong> yet.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            An admin or teacher with access can add assessments from the Grades &amp; Assessments page.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <MarkRegister
            students={students}
            assessments={assessments}
            results={results}
            levelName={subject.levelName}
            subjectName={subject.name}
            onSave={(entries) => saveMarksMutation.mutate(entries)}
            saving={saveMarksMutation.isPending}
          />
        </div>
      )}

      <StudentInfoModal
        student={selectedStudent}
        level={levelForModal}
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
      />
    </div>
  );
}

// ─── Main Teacher Dashboard ───────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export default function TeacherDashboard() {
  const { user: rawUser, isLoading: authLoading } = useAuth();
  const user = rawUser as AuthUser | undefined;
  const { toast } = useToast();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  // Fetch teacher profile
  const { data: teacher, isLoading: profileLoading } = useQuery<TeacherProfile>({
    queryKey: ["/api/teacher/profile"],
    queryFn: async () => {
      const r = await fetch("/api/teacher/profile", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load profile");
      return r.json();
    },
    enabled: !!user && user.role === "teacher",
  });

  // Fetch teacher's assigned subjects
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<AssignedSubject[]>({
    queryKey: ["/api/teacher/my-subjects"],
    queryFn: async () => {
      const r = await fetch("/api/teacher/my-subjects", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load subjects");
      return r.json();
    },
    enabled: !!user && user.role === "teacher",
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      window.location.href = "/";
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (subjects.length > 0 && selectedSubjectId === null) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  if (authLoading || (user?.role === "teacher" && profileLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "teacher") return null;

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome, {teacher ? `${teacher.firstName} ${teacher.lastName}` : user.firstName ?? "Teacher"}
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">Teacher Dashboard — Select a subject to begin</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">{teacher?.email ?? user.email}</p>
                <Badge variant="outline" className="text-xs">Teacher</Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Subject cards */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Your Assigned Subjects
            </h3>

            {subjectsLoading ? (
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 w-44 rounded-xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">
                  You have not been assigned to any subjects yet.
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Please ask your administrator to assign you to a subject.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {subjects.map((subj) => {
                  const active = selectedSubjectId === subj.id;
                  return (
                    <button
                      key={subj.id}
                      onClick={() => setSelectedSubjectId(subj.id)}
                      className={`relative flex flex-col items-start px-5 py-4 rounded-xl border-2 transition-all shadow-sm min-w-[160px] ${
                        active
                          ? "border-primary bg-primary text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-700 hover:border-primary/50 hover:shadow"
                      }`}
                    >
                      <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${active ? "text-white/70" : "text-slate-400"}`}>
                        {subj.levelName}
                      </div>
                      <div className={`text-base font-bold leading-tight ${active ? "text-white" : "text-slate-800"}`}>
                        {subj.name}
                      </div>
                      {active && <ChevronRight className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-white/60" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active subject content */}
          {selectedSubject && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedSubject.name}</h2>
                  <p className="text-sm text-slate-500">{selectedSubject.levelName}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" /> Students
                  </Badge>
                </div>
              </div>

              <SubjectPanel subject={selectedSubject} teacher={teacher!} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
