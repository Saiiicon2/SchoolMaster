import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStudentSchema, insertLevelSchema, insertSubjectSchema, insertGradeSchema, insertForumSchema, insertForumPostSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create students" });
      }

      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put('/api/students/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
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
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create levels" });
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
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create subjects" });
      }

      const validatedData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validatedData);
      res.status(201).json(subject);
    } catch (error) {
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
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
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can enter grades" });
      }

      const validatedData = insertGradeSchema.parse({
        ...req.body,
        enteredBy: req.user.claims.sub,
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
      const user = await storage.getUser(req.user.claims.sub);
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
        authorId: req.user.claims.sub,
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
      const user = await storage.getUser(req.user.claims.sub);
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

  const httpServer = createServer(app);
  return httpServer;
}
