import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sqlite, pg } from "./db";
import { isAuthenticated as externalIsAuthenticated } from "./auth";
import { setupLocalAuth, isAuthenticated as localIsAuthenticated } from "./localAuth";
import { 
  insertStudentSchema, 
  insertLevelSchema, 
  insertSubjectSchema, 
  insertGradeSchema, 
  insertForumSchema, 
  insertForumPostSchema,
  insertTeacherSchema,
  insertTeacherLevelSchema,
  insertAssessmentSchema,
  insertAssessmentResultSchema,
  insertCampusSchema,
} from "@shared/schema";

// Use local auth for development, external OIDC auth is optional
const isAuthenticated = process.env.AUTH_DOMAINS ? externalIsAuthenticated : localIsAuthenticated;

// Helper to unified user id access regardless of auth provider
function getUserId(req: any) {
  return req.user?.claims?.sub ?? req.user?.id;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth (local or external OIDC)
  if (process.env.AUTH_DOMAINS) {
    // External OIDC auth
    const { setupAuth } = await import("./auth");
    await setupAuth(app);
  } else {
    // Local auth for development
    setupLocalAuth(app);
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/activity', isAuthenticated, async (req: any, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Student routes
  app.get('/api/students', isAuthenticated, async (req: any, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get('/api/students/:id', isAuthenticated, async (req: any, res) => {
    try {
      const student = await storage.getStudent(parseInt(req.params.id));
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post('/api/students', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only admins and teachers can create students" });
      }

      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  // Attendance routes
  app.get('/api/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      if (pg) {
        const rows = await pg`
          SELECT s.id as "studentId", s.student_number as "studentNumber", s.first_name as "firstName", s.last_name as "lastName",
                 a.status as status, a.note as note
          FROM students s
          LEFT JOIN attendance a ON s.id = a.student_id AND a.attendance_date = ${date}
          ORDER BY s.student_number
        `;
        res.json(rows);
      } else {
        const rows = sqlite.prepare(`
          SELECT s.id as studentId, s.student_number as studentNumber, s.first_name as firstName, s.last_name as lastName,
                 a.status as status, a.note as note
          FROM students s
          LEFT JOIN attendance a ON s.id = a.student_id AND a.attendance_date = ?
          ORDER BY s.student_number
        `).all(date);
        res.json(rows);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ message: 'Failed to fetch attendance' });
    }
  });

  app.post('/api/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const records = req.body.records || [];
      const now = Date.now();
      if (pg) {
        for (const r of records) {
          await pg`
            INSERT INTO attendance (student_id, attendance_date, status, note, created_at)
            VALUES (${r.studentId}, ${r.attendanceDate}, ${r.status}, ${r.note || null}, ${now})
            ON CONFLICT (student_id, attendance_date) DO UPDATE SET
              status = EXCLUDED.status,
              note = EXCLUDED.note,
              created_at = EXCLUDED.created_at
          `;
        }
        res.json({ success: true });
      } else {
        const stmt = sqlite.prepare(`
          INSERT INTO attendance (student_id, attendance_date, status, note, created_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(student_id, attendance_date) DO UPDATE SET
            status=excluded.status,
            note=excluded.note,
            created_at=excluded.created_at
        `);

        const insertMany = sqlite.transaction((items: any[]) => {
          for (const r of items) {
            stmt.run(r.studentId, r.attendanceDate, r.status, r.note || null, now);
          }
        });

        insertMany(records);
        res.json({ success: true });
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      res.status(500).json({ message: 'Failed to save attendance' });
    }
  });

  app.put('/api/students/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update students" });
      }

      const student = await storage.updateStudent(parseInt(req.params.id), req.body);
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  // Level routes
  app.get('/api/levels', isAuthenticated, async (req: any, res) => {
    try {
      const levels = await storage.getAllLevels();
      res.json(levels);
    } catch (error) {
      console.error("Error fetching levels:", error);
      res.status(500).json({ message: "Failed to fetch levels" });
    }
  });

  app.post('/api/levels', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only admins and teachers can create levels" });
      }

      const validatedData = insertLevelSchema.parse(req.body);
      const level = await storage.createLevel(validatedData);
      res.status(201).json(level);
    } catch (error) {
      console.error("Error creating level:", error);
      res.status(500).json({ message: "Failed to create level" });
    }
  });

  // Subject routes
  app.get('/api/subjects', isAuthenticated, async (req: any, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get('/api/subjects/level/:levelId', isAuthenticated, async (req: any, res) => {
    try {
      const subjects = await storage.getSubjectsByLevel(parseInt(req.params.levelId));
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects by level:", error);
      res.status(500).json({ message: "Failed to fetch subjects by level" });
    }
  });

  app.post('/api/subjects', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only admins and teachers can create subjects" });
      }

      const validatedData = insertSubjectSchema.parse({
        ...req.body,
        createdById: getUserId(req),
      });
      const subject = await storage.createSubject(validatedData);
      res.status(201).json(subject);
    } catch (error) {
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  app.get('/api/subjects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const subject = await storage.getSubject(parseInt(req.params.id));
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  app.put('/api/subjects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only admins and teachers can update subjects" });
      }

      const validatedData = insertSubjectSchema.parse(req.body);
      const subject = await storage.updateSubject(parseInt(req.params.id), validatedData);
      res.json(subject);
    } catch (error) {
      console.error("Error updating subject:", error);
      res.status(500).json({ message: "Failed to update subject" });
    }
  });

  // Campus routes
  app.get('/api/campuses', isAuthenticated, async (req: any, res) => {
    try {
      const campuses = await storage.getAllCampuses();
      res.json(campuses);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      res.status(500).json({ message: 'Failed to fetch campuses' });
    }
  });

  app.post('/api/campuses', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        return res.status(403).json({ message: 'Only admins and teachers can create campuses' });
      }

      const validated = insertCampusSchema.parse(req.body);
      const campus = await storage.createCampus(validated);
      res.status(201).json(campus);
    } catch (error) {
      console.error('Error creating campus:', error);
      res.status(500).json({ message: 'Failed to create campus' });
    }
  });

  // Grade routes
  app.get('/api/grades/student/:studentId', isAuthenticated, async (req: any, res) => {
    try {
      const grades = await storage.getGradesByStudent(parseInt(req.params.studentId));
      res.json(grades);
    } catch (error) {
      console.error("Error fetching grades by student:", error);
      res.status(500).json({ message: "Failed to fetch grades by student" });
    }
  });

  app.get('/api/grades/subject/:subjectId', isAuthenticated, async (req: any, res) => {
    try {
      const grades = await storage.getGradesBySubject(parseInt(req.params.subjectId));
      res.json(grades);
    } catch (error) {
      console.error("Error fetching grades by subject:", error);
      res.status(500).json({ message: "Failed to fetch grades by subject" });
    }
  });

  app.post('/api/grades', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only admins and teachers can enter grades" });
      }

      const validatedData = insertGradeSchema.parse({
        ...req.body,
        enteredBy: getUserId(req),
      });
      const grade = await storage.createGrade(validatedData);
      res.status(201).json(grade);
    } catch (error) {
      console.error("Error creating grade:", error);
      res.status(500).json({ message: "Failed to create grade" });
    }
  });

  // Forum routes
  app.get('/api/forums', isAuthenticated, async (req: any, res) => {
    try {
      const forums = await storage.getAllForums();
      res.json(forums);
    } catch (error) {
      console.error("Error fetching forums:", error);
      res.status(500).json({ message: "Failed to fetch forums" });
    }
  });

  app.get('/api/forums/:id/posts', isAuthenticated, async (req: any, res) => {
    try {
      const posts = await storage.getForumPosts(parseInt(req.params.id));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  app.post('/api/forums', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create forums" });
      }

      const validatedData = insertForumSchema.parse(req.body);
      const forum = await storage.createForum(validatedData);
      res.status(201).json(forum);
    } catch (error) {
      console.error("Error creating forum:", error);
      res.status(500).json({ message: "Failed to create forum" });
    }
  });

  app.post('/api/forums/:id/posts', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertForumPostSchema.parse({
        ...req.body,
        forumId: parseInt(req.params.id),
        authorId: getUserId(req),
      });
      const post = await storage.createForumPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating forum post:", error);
      res.status(500).json({ message: "Failed to create forum post" });
    }
  });

  // Level progression
  app.post('/api/students/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can progress students" });
      }

      const { toLevelId } = req.body;
      const progression = await storage.progressStudent(parseInt(req.params.id), toLevelId);
      res.status(201).json(progression);
    } catch (error) {
      console.error("Error progressing student:", error);
      res.status(500).json({ message: "Failed to progress student" });
    }
  });

  // Teacher routes
  app.get('/api/teachers', isAuthenticated, async (req: any, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.get('/api/teachers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const teacher = await storage.getTeacher(parseInt(req.params.id));
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      console.error("Error fetching teacher:", error);
      res.status(500).json({ message: "Failed to fetch teacher" });
    }
  });

  app.post('/api/teachers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create teachers" });
      }

      const validatedData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(validatedData);
      res.status(201).json(teacher);
    } catch (error) {
      console.error("Error creating teacher:", error);
      res.status(500).json({ message: "Failed to create teacher" });
    }
  });

  app.get('/api/teachers/:id/subjects', isAuthenticated, async (req: any, res) => {
    try {
      const subjects = await storage.getTeacherSubjects(parseInt(req.params.id));
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
      res.status(500).json({ message: "Failed to fetch teacher subjects" });
    }
  });

  app.post('/api/teachers/:id/subjects', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can assign subjects to teachers" });
      }

      const { subjectId } = req.body;
      const assignment = await storage.assignTeacherToSubject(parseInt(req.params.id), subjectId);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning subject to teacher:", error);
      res.status(500).json({ message: "Failed to assign subject to teacher" });
    }
  });

  app.put('/api/teachers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update teachers" });
      }

      const validatedData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.updateTeacher(parseInt(req.params.id), validatedData);
      res.json(teacher);
    } catch (error) {
      console.error("Error updating teacher:", error);
      res.status(500).json({ message: "Failed to update teacher" });
    }
  });

  app.delete('/api/teachers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete teachers" });
      }

      await storage.deleteTeacher(parseInt(req.params.id));
      res.json({ message: "Teacher deleted successfully" });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      res.status(500).json({ message: "Failed to delete teacher" });
    }
  });

  app.get('/api/teachers/:id/levels', isAuthenticated, async (req: any, res) => {
    try {
      const levels = await storage.getTeacherLevels(parseInt(req.params.id));
      res.json(levels);
    } catch (error) {
      console.error("Error fetching teacher levels:", error);
      res.status(500).json({ message: "Failed to fetch teacher levels" });
    }
  });

  app.post('/api/teachers/:id/levels', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can assign levels to teachers" });
      }

      const { levelId } = req.body;
      const assignment = await storage.assignTeacherToLevel(parseInt(req.params.id), levelId);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning level to teacher:", error);
      res.status(500).json({ message: "Failed to assign level to teacher" });
    }
  });

  app.delete('/api/teachers/:id/levels/:levelId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can remove level assignments" });
      }

      await storage.removeTeacherFromLevel(parseInt(req.params.id), parseInt(req.params.levelId));
      res.json({ message: "Teacher removed from level successfully" });
    } catch (error) {
      console.error("Error removing teacher from level:", error);
      res.status(500).json({ message: "Failed to remove teacher from level" });
    }
  });

  // Assessment routes
  app.get('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const assessments = await storage.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get('/api/assessments/subject/:subjectId', isAuthenticated, async (req: any, res) => {
    try {
      const assessments = await storage.getAssessmentsBySubject(parseInt(req.params.subjectId));
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments by subject:", error);
      res.status(500).json({ message: "Failed to fetch assessments by subject" });
    }
  });

  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only admins and teachers can create assessments" });
      }

      const validatedData = insertAssessmentSchema.parse({
        ...req.body,
        createdById: getUserId(req),
      });
      const assessment = await storage.createAssessment(validatedData);
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.get('/api/assessments/:id/results', isAuthenticated, async (req: any, res) => {
    try {
      const results = await storage.getAssessmentResults(parseInt(req.params.id));
      res.json(results);
    } catch (error) {
      console.error("Error fetching assessment results:", error);
      res.status(500).json({ message: "Failed to fetch assessment results" });
    }
  });

  app.post('/api/assessment-results', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only admins and teachers can enter assessment results" });
      }

      const validatedData = insertAssessmentResultSchema.parse({
        ...req.body,
        enteredBy: getUserId(req),
      });
      const result = await storage.createAssessmentResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating assessment result:", error);
      res.status(500).json({ message: "Failed to create assessment result" });
    }
  });

  app.put('/api/assessment-results/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only admins and teachers can update assessment results" });
      }

      const result = await storage.updateAssessmentResult(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error) {
      console.error("Error updating assessment result:", error);
      res.status(500).json({ message: "Failed to update assessment result" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
