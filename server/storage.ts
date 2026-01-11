import {
  users,
  students,
  levels,
  subjects,
  grades,
  forums,
  forumPosts,
  levelProgressions,
  teachers,
  teacherSubjects,
  assessments,
  assessmentResults,
  campuses,
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
  type Teacher,
  type InsertTeacher,
  type TeacherSubject,
  type InsertTeacherSubject,
  type Assessment,
  type InsertAssessment,
  type AssessmentResult,
  type InsertAssessmentResult,
  type Campus,
  type InsertCampus,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations - required for external OIDC auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: Partial<User>): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  
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

  // Teacher operations
  getAllTeachers(): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherByUserId(userId: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher>;
  assignTeacherToSubject(teacherId: number, subjectId: number): Promise<TeacherSubject>;
  getTeacherSubjects(teacherId: number): Promise<TeacherSubject[]>;
  
  // Campus operations
  getAllCampuses(): Promise<Campus[]>;
  createCampus(campus: InsertCampus): Promise<Campus>;
  
  // Assessment operations
  getAllAssessments(): Promise<Assessment[]>;
  getAssessmentsBySubject(subjectId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessmentResults(assessmentId: number): Promise<AssessmentResult[]>;
  createAssessmentResult(result: InsertAssessmentResult): Promise<AssessmentResult>;
  updateAssessmentResult(id: number, result: Partial<InsertAssessmentResult>): Promise<AssessmentResult>;
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

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'student',
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
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
    // Determine campus prefix if provided
    let prefix = 'STU';
    if ((student as any).campusId) {
      const [camp] = await db.select().from(campuses).where(eq(campuses.id, (student as any).campusId));
      if (camp) {
        prefix = (camp.code || (camp.name || '').slice(0,4)).toString().replace(/\s+/g,'').toUpperCase();
      }
    }
    const studentNumber = `${prefix}-${year}-${studentCount.toString().padStart(3, '0')}`;

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

  // Teacher operations
  async getAllTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers).where(eq(teachers.status, 'active')).orderBy(teachers.firstName);
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async getTeacherByUserId(userId: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, userId));
    return teacher;
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [newTeacher] = await db.insert(teachers).values(teacher).returning();
    return newTeacher;
  }

  async updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher> {
    const [updatedTeacher] = await db
      .update(teachers)
      .set(teacher)
      .where(eq(teachers.id, id))
      .returning();
    return updatedTeacher;
  }

  async assignTeacherToSubject(teacherId: number, subjectId: number): Promise<TeacherSubject> {
    const [assignment] = await db
      .insert(teacherSubjects)
      .values({
        teacherId,
        subjectId,
        assignedDate: new Date().toISOString().split('T')[0],
      })
      .returning();
    return assignment;
  }

  async getTeacherSubjects(teacherId: number): Promise<TeacherSubject[]> {
    return await db.select().from(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
  }

  // Campus operations
  async getAllCampuses(): Promise<Campus[]> {
    return await db.select().from(campuses).orderBy(campuses.name);
  }

  async createCampus(campus: InsertCampus): Promise<Campus> {
    const [newCampus] = await db.insert(campuses).values(campus).returning();
    return newCampus;
  }

  // Assessment operations
  async getAllAssessments(): Promise<Assessment[]> {
    return await db.select().from(assessments).orderBy(desc(assessments.assessmentDate));
  }

  async getAssessmentsBySubject(subjectId: number): Promise<Assessment[]> {
    return await db.select().from(assessments).where(eq(assessments.subjectId, subjectId)).orderBy(desc(assessments.assessmentDate));
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    try {
      console.log('Creating assessment:', assessment);
      const [newAssessment] = await db.insert(assessments).values(assessment).returning();
      return newAssessment;
    } catch (err) {
      console.error('Error during createAssessment insert:', err);
      throw err;
    }
  }

  async getAssessmentResults(assessmentId: number): Promise<AssessmentResult[]> {
    return await db.select().from(assessmentResults).where(eq(assessmentResults.assessmentId, assessmentId));
  }

  async createAssessmentResult(result: InsertAssessmentResult): Promise<AssessmentResult> {
    const [newResult] = await db.insert(assessmentResults).values(result).returning();
    return newResult;
  }

  async updateAssessmentResult(id: number, result: Partial<InsertAssessmentResult>): Promise<AssessmentResult> {
    const [updatedResult] = await db
      .update(assessmentResults)
      .set(result)
      .where(eq(assessmentResults.id, id))
      .returning();
    return updatedResult;
  }
}

export const storage = new DatabaseStorage();
