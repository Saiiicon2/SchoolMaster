import {
  users,
  students,
  levels,
  subjects,
  grades,
  forums,
  forumPosts,
  levelProgressions,
  type User,
  type UpsertUser,
  type Student,
  type InsertStudent,
  type Level,
  type InsertLevel,
  type Subject,
  type InsertSubject,
  type Grade,
  type InsertGrade,
  type Forum,
  type InsertForum,
  type ForumPost,
  type InsertForumPost,
  type LevelProgression,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Student operations
  getAllStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByNumber(studentNumber: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  
  // Level operations
  getAllLevels(): Promise<Level[]>;
  getLevel(id: number): Promise<Level | undefined>;
  createLevel(level: InsertLevel): Promise<Level>;
  updateLevel(id: number, level: Partial<InsertLevel>): Promise<Level>;
  
  // Subject operations
  getAllSubjects(): Promise<Subject[]>;
  getSubjectsByLevel(levelId: number): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject>;
  
  // Grade operations
  getGradesByStudent(studentId: number): Promise<Grade[]>;
  getGradesBySubject(subjectId: number): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<InsertGrade>): Promise<Grade>;
  
  // Forum operations
  getAllForums(): Promise<Forum[]>;
  getForumPosts(forumId: number): Promise<ForumPost[]>;
  createForum(forum: InsertForum): Promise<Forum>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  
  // Statistics
  getDashboardStats(): Promise<any>;
  getRecentActivity(): Promise<any[]>;
  
  // Level progression
  progressStudent(studentId: number, toLevelId: number): Promise<LevelProgression>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Student operations
  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByNumber(studentNumber: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentNumber, studentNumber));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    // Generate unique student number
    const year = new Date().getFullYear();
    const countResult = await db.select({ count: count() }).from(students);
    const studentCount = countResult[0].count + 1;
    const studentNumber = `STU-${year}-${studentCount.toString().padStart(3, '0')}`;

    const [newStudent] = await db
      .insert(students)
      .values({ ...student, studentNumber })
      .returning();
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  // Level operations
  async getAllLevels(): Promise<Level[]> {
    return await db.select().from(levels).orderBy(levels.name);
  }

  async getLevel(id: number): Promise<Level | undefined> {
    const [level] = await db.select().from(levels).where(eq(levels.id, id));
    return level;
  }

  async createLevel(level: InsertLevel): Promise<Level> {
    const [newLevel] = await db.insert(levels).values(level).returning();
    return newLevel;
  }

  async updateLevel(id: number, level: Partial<InsertLevel>): Promise<Level> {
    const [updatedLevel] = await db
      .update(levels)
      .set(level)
      .where(eq(levels.id, id))
      .returning();
    return updatedLevel;
  }

  // Subject operations
  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(subjects.name);
  }

  async getSubjectsByLevel(levelId: number): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.levelId, levelId));
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject> {
    const [updatedSubject] = await db
      .update(subjects)
      .set(subject)
      .where(eq(subjects.id, id))
      .returning();
    return updatedSubject;
  }

  // Grade operations
  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    return await db.select().from(grades).where(eq(grades.studentId, studentId));
  }

  async getGradesBySubject(subjectId: number): Promise<Grade[]> {
    return await db.select().from(grades).where(eq(grades.subjectId, subjectId));
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [newGrade] = await db.insert(grades).values(grade).returning();
    return newGrade;
  }

  async updateGrade(id: number, grade: Partial<InsertGrade>): Promise<Grade> {
    const [updatedGrade] = await db
      .update(grades)
      .set(grade)
      .where(eq(grades.id, id))
      .returning();
    return updatedGrade;
  }

  // Forum operations
  async getAllForums(): Promise<Forum[]> {
    return await db.select().from(forums).where(eq(forums.isActive, true));
  }

  async getForumPosts(forumId: number): Promise<ForumPost[]> {
    return await db.select().from(forumPosts).where(eq(forumPosts.forumId, forumId)).orderBy(desc(forumPosts.createdAt));
  }

  async createForum(forum: InsertForum): Promise<Forum> {
    const [newForum] = await db.insert(forums).values(forum).returning();
    return newForum;
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    return newPost;
  }

  // Statistics
  async getDashboardStats(): Promise<any> {
    const totalStudentsResult = await db.select({ count: count() }).from(students).where(eq(students.status, 'active'));
    const totalSubjectsResult = await db.select({ count: count() }).from(subjects).where(eq(subjects.isActive, true));
    const activeLevelsResult = await db.select({ count: count() }).from(levels).where(eq(levels.isActive, true));
    
    // Calculate average grade
    const avgGradeResult = await db
      .select({ 
        avgScore: sql<number>`AVG(${grades.score})`,
        avgMaxScore: sql<number>`AVG(${grades.maxScore})`
      })
      .from(grades);

    const avgGrade = avgGradeResult[0].avgScore && avgGradeResult[0].avgMaxScore 
      ? (avgGradeResult[0].avgScore / avgGradeResult[0].avgMaxScore) * 100 
      : 0;

    return {
      totalStudents: totalStudentsResult[0].count,
      totalSubjects: totalSubjectsResult[0].count,
      activeLevels: activeLevelsResult[0].count,
      averageGrade: Math.round(avgGrade * 10) / 10,
    };
  }

  async getRecentActivity(): Promise<any[]> {
    // Get recent student enrollments
    const recentStudents = await db
      .select({
        id: students.id,
        type: sql<string>`'enrollment'`,
        studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
        levelName: levels.name,
        timestamp: students.createdAt,
      })
      .from(students)
      .leftJoin(levels, eq(students.currentLevelId, levels.id))
      .orderBy(desc(students.createdAt))
      .limit(5);

    // Get recent grade entries
    const recentGrades = await db
      .select({
        id: grades.id,
        type: sql<string>`'grade'`,
        studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
        subjectName: subjects.name,
        timestamp: grades.enteredAt,
      })
      .from(grades)
      .leftJoin(students, eq(grades.studentId, students.id))
      .leftJoin(subjects, eq(grades.subjectId, subjects.id))
      .orderBy(desc(grades.enteredAt))
      .limit(3);

    // Combine and sort by timestamp
    const activities = [...recentStudents, ...recentGrades]
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, 10);

    return activities;
  }

  // Level progression
  async progressStudent(studentId: number, toLevelId: number): Promise<LevelProgression> {
    const student = await this.getStudent(studentId);
    if (!student) throw new Error('Student not found');

    // Create progression record
    const [progression] = await db
      .insert(levelProgressions)
      .values({
        studentId,
        fromLevelId: student.currentLevelId,
        toLevelId,
        progressionDate: new Date().toISOString().split('T')[0],
      })
      .returning();

    // Update student's current level
    await this.updateStudent(studentId, { currentLevelId: toLevelId });

    return progression;
  }
}

export const storage = new DatabaseStorage();
