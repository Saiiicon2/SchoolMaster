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
  teacherLevels,
  assessments,
  assessmentResults,
  campuses,
  feeConfigs,
  payments,
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
  type TeacherLevel,
  type InsertTeacherLevel,
  type Assessment,
  type InsertAssessment,
  type AssessmentResult,
  type InsertAssessmentResult,
  type Campus,
  type InsertCampus,
  type FeeConfig,
  type InsertFeeConfig,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count, inArray, gte, lte, like } from "drizzle-orm";

export interface IStorage {
  // User operations - required for external OIDC auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: Partial<User>): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  
  // Student operations
  getAllStudents(campusId?: number): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByNumber(studentNumber: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  
  // Level operations
  getAllLevels(): Promise<Level[]>;
  getLevel(id: number): Promise<Level | undefined>;
  getStudentsByLevel(levelId: number): Promise<Student[]>;
  createLevel(level: InsertLevel): Promise<Level>;
  updateLevel(id: number, level: Partial<InsertLevel>): Promise<Level>;
  deleteLevel(id: number): Promise<void>;
  
  // Subject operations
  getAllSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
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
  getDashboardStats(campusId?: number): Promise<any>;
  getRecentActivity(campusId?: number): Promise<any[]>;
  
  // Level progression
  progressStudent(studentId: number, toLevelId: number): Promise<LevelProgression>;

  // Teacher operations
  getAllTeachers(campusId?: number): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherByUserId(userId: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher>;
  deleteTeacher(id: number): Promise<void>;
  assignTeacherToSubject(teacherId: number, subjectId: number): Promise<TeacherSubject>;
  getTeacherSubjects(teacherId: number): Promise<TeacherSubject[]>;
  assignTeacherToLevel(teacherId: number, levelId: number): Promise<TeacherLevel>;
  removeTeacherFromLevel(teacherId: number, levelId: number): Promise<void>;
  getTeacherLevels(teacherId: number): Promise<TeacherLevel[]>;
  
  // Campus operations
  getAllCampuses(): Promise<Campus[]>;
  getCampus(id: number): Promise<Campus | undefined>;
  createCampus(campus: InsertCampus): Promise<Campus>;
  
  // Assessment operations
  getAllAssessments(): Promise<Assessment[]>;
  getAssessmentsBySubject(subjectId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessmentResults(assessmentId: number): Promise<AssessmentResult[]>;
  getAssessmentResultsBySubject(subjectId: number): Promise<AssessmentResult[]>;
  createAssessmentResult(result: InsertAssessmentResult): Promise<AssessmentResult>;
  updateAssessmentResult(id: number, result: Partial<InsertAssessmentResult>): Promise<AssessmentResult>;
  upsertAssessmentResult(assessmentId: number, studentId: number, score: number, enteredBy: string): Promise<AssessmentResult>;

  // Finance operations
  getActiveFeeConfig(campusId?: number): Promise<FeeConfig | undefined>;
  getAllFeeConfigs(campusId?: number): Promise<FeeConfig[]>;
  createFeeConfig(config: InsertFeeConfig): Promise<FeeConfig>;
  getPayments(campusId?: number, periodLabel?: string): Promise<Payment[]>;
  getPaymentsByStudent(studentId: number): Promise<Payment[]>;
  upsertPayment(data: InsertPayment): Promise<Payment>;
  updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment>;
  getFinanceDashboardStats(campusId?: number): Promise<any>;
  generatePaymentsForPeriod(campusId: number | undefined, periodLabel: string, billingPeriod: string, dueDate: string, createdById: string): Promise<number>;
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
        campusId: userData.campusId ?? null,
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
  async getAllStudents(campusId?: number): Promise<Student[]> {
    if (campusId !== undefined) {
      return await db.select().from(students).where(eq(students.campusId, campusId)).orderBy(desc(students.createdAt));
    }
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
    // Derive enrollment year (last 2 digits) from enrollmentDate or current year
    const enrollYear = student.enrollmentDate
      ? student.enrollmentDate.slice(2, 4)
      : String(new Date().getFullYear()).slice(2);

    // Determine campus prefix from campus code
    let prefix = 'STU';
    if ((student as any).campusId) {
      const [camp] = await db.select().from(campuses).where(eq(campuses.id, (student as any).campusId));
      if (camp?.code) {
        prefix = camp.code.trim().toUpperCase();
      }
    }

    // Count existing students for this campus+year combo to build a scoped sequence
    const numberPrefix = `${prefix}-${enrollYear}`;
    const countResult = await db
      .select({ count: count() })
      .from(students)
      .where(like(students.studentNumber, `${numberPrefix}%`));
    const seq = (countResult[0].count + 1).toString().padStart(3, '0');
    const studentNumber = `${numberPrefix}${seq}`;

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

  async getStudentsByLevel(levelId: number): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.currentLevelId, levelId));
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

  async deleteLevel(id: number): Promise<void> {
    // Remove association records before deleting the level.
    await db.delete(teacherLevels).where(eq(teacherLevels.levelId, id));
    await db
      .delete(levelProgressions)
      .where(or(eq(levelProgressions.fromLevelId, id), eq(levelProgressions.toLevelId, id)));
    await db.delete(levels).where(eq(levels.id, id));
  }

  // Subject operations
  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(subjects.name);
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
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
  async getDashboardStats(campusId?: number): Promise<any> {
    const campusFilter = campusId !== undefined ? and(eq(students.status, 'active'), eq(students.campusId, campusId)) : eq(students.status, 'active');
    const totalStudentsResult = await db.select({ count: count() }).from(students).where(campusFilter);
    const totalSubjectsResult = await db.select({ count: count() }).from(subjects).where(eq(subjects.isActive, true));
    const activeLevelsResult = await db.select({ count: count() }).from(levels).where(eq(levels.isActive, true));
    
    // Calculate average grade (scoped by campus if provided)
    const avgGradeQuery = campusId !== undefined
      ? db.select({ avgScore: sql<number>`AVG(${grades.score})`, avgMaxScore: sql<number>`AVG(${grades.maxScore})` })
          .from(grades).leftJoin(students, eq(grades.studentId, students.id)).where(eq(students.campusId, campusId))
      : db.select({ avgScore: sql<number>`AVG(${grades.score})`, avgMaxScore: sql<number>`AVG(${grades.maxScore})` }).from(grades);
    const avgGradeResult = await avgGradeQuery;

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

  async getRecentActivity(campusId?: number): Promise<any[]> {
    // Get recent student enrollments
    const studentQuery = db
      .select({
        id: students.id,
        type: sql<string>`'enrollment'`,
        studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
        levelName: levels.name,
        timestamp: students.createdAt,
      })
      .from(students)
      .leftJoin(levels, eq(students.currentLevelId, levels.id));
    const recentStudents = await (campusId !== undefined
      ? studentQuery.where(eq(students.campusId, campusId))
      : studentQuery)
      .orderBy(desc(students.createdAt))
      .limit(5);

    // Get recent grade entries
    const gradeQuery = db
      .select({
        id: grades.id,
        type: sql<string>`'grade'`,
        studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
        subjectName: subjects.name,
        timestamp: grades.enteredAt,
      })
      .from(grades)
      .leftJoin(students, eq(grades.studentId, students.id))
      .leftJoin(subjects, eq(grades.subjectId, subjects.id));
    const recentGrades = await (campusId !== undefined
      ? gradeQuery.where(eq(students.campusId, campusId))
      : gradeQuery)
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
  async getAllTeachers(campusId?: number): Promise<Teacher[]> {
    if (campusId !== undefined) {
      // Filter teachers whose linked user belongs to this campus
      return await db
        .select({ id: teachers.id, userId: teachers.userId, firstName: teachers.firstName, lastName: teachers.lastName, email: teachers.email, employmentDate: teachers.employmentDate, specialties: teachers.specialties, status: teachers.status, createdAt: teachers.createdAt })
        .from(teachers)
        .innerJoin(users, eq(teachers.userId, users.id))
        .where(and(eq(teachers.status, 'active'), eq(users.campusId, campusId)))
        .orderBy(teachers.firstName);
    }
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

  async deleteTeacher(id: number): Promise<void> {
    // Delete teacher level assignments
    await db.delete(teacherLevels).where(eq(teacherLevels.teacherId, id));
    // Delete teacher subject assignments
    await db.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, id));
    // Delete teacher
    await db.delete(teachers).where(eq(teachers.id, id));
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

  async assignTeacherToLevel(teacherId: number, levelId: number): Promise<TeacherLevel> {
    const [assignment] = await db
      .insert(teacherLevels)
      .values({
        teacherId,
        levelId,
        assignedDate: new Date().toISOString().split('T')[0],
      })
      .returning();
    return assignment;
  }

  async removeTeacherFromLevel(teacherId: number, levelId: number): Promise<void> {
    await db
      .delete(teacherLevels)
      .where(
        and(
          eq(teacherLevels.teacherId, teacherId),
          eq(teacherLevels.levelId, levelId)
        )
      );
  }

  async getTeacherLevels(teacherId: number): Promise<TeacherLevel[]> {
    return await db.select().from(teacherLevels).where(eq(teacherLevels.teacherId, teacherId));
  }

  // Campus operations
  async getAllCampuses(): Promise<Campus[]> {
    return await db.select().from(campuses).orderBy(campuses.name);
  }

  async getCampus(id: number): Promise<Campus | undefined> {
    const [campus] = await db.select().from(campuses).where(eq(campuses.id, id));
    return campus;
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

  async getAssessmentResultsBySubject(subjectId: number): Promise<AssessmentResult[]> {
    const subjectAssessments = await db
      .select({ id: assessments.id })
      .from(assessments)
      .where(eq(assessments.subjectId, subjectId));
    if (subjectAssessments.length === 0) return [];
    const assessmentIds = subjectAssessments.map((a) => a.id);
    return await db
      .select()
      .from(assessmentResults)
      .where(inArray(assessmentResults.assessmentId, assessmentIds));
  }

  async upsertAssessmentResult(
    assessmentId: number,
    studentId: number,
    score: number,
    enteredBy: string
  ): Promise<AssessmentResult> {
    const existing = await db
      .select()
      .from(assessmentResults)
      .where(
        and(
          eq(assessmentResults.assessmentId, assessmentId),
          eq(assessmentResults.studentId, studentId)
        )
      );
    if (existing.length > 0) {
      const [updated] = await db
        .update(assessmentResults)
        .set({ score, enteredBy })
        .where(eq(assessmentResults.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(assessmentResults)
      .values({ assessmentId, studentId, score, enteredBy })
      .returning();
    return created;
  }

  // Finance operations
  async getActiveFeeConfig(campusId?: number): Promise<FeeConfig | undefined> {
    const q = db.select().from(feeConfigs).orderBy(desc(feeConfigs.effectiveFrom)).limit(1);
    if (campusId !== undefined) {
      const [cfg] = await q.where(eq(feeConfigs.campusId, campusId));
      return cfg;
    }
    const [cfg] = await q;
    return cfg;
  }

  async getAllFeeConfigs(campusId?: number): Promise<FeeConfig[]> {
    if (campusId !== undefined) {
      return await db.select().from(feeConfigs).where(eq(feeConfigs.campusId, campusId)).orderBy(desc(feeConfigs.effectiveFrom));
    }
    return await db.select().from(feeConfigs).orderBy(desc(feeConfigs.effectiveFrom));
  }

  async createFeeConfig(config: InsertFeeConfig): Promise<FeeConfig> {
    const [newConfig] = await db.insert(feeConfigs).values(config).returning();
    return newConfig;
  }

  async getPayments(campusId?: number, periodLabel?: string): Promise<Payment[]> {
    const conditions: any[] = [];
    if (campusId !== undefined) conditions.push(eq(payments.campusId, campusId));
    if (periodLabel) conditions.push(eq(payments.periodLabel, periodLabel));
    if (conditions.length === 0) return await db.select().from(payments).orderBy(desc(payments.dueDate));
    return await db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.dueDate));
  }

  async getPaymentsByStudent(studentId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.studentId, studentId)).orderBy(desc(payments.dueDate));
  }

  async upsertPayment(data: InsertPayment): Promise<Payment> {
    const existing = await db.select().from(payments).where(
      and(eq(payments.studentId, data.studentId), eq(payments.periodLabel, data.periodLabel))
    );
    if (existing.length > 0) {
      const [updated] = await db.update(payments).set({ ...data, updatedAt: new Date() }).where(eq(payments.id, existing[0].id)).returning();
      return updated;
    }
    const [created] = await db.insert(payments).values(data).returning();
    return created;
  }

  async updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db.update(payments).set({ ...data, updatedAt: new Date() }).where(eq(payments.id, id)).returning();
    return updated;
  }

  async getFinanceDashboardStats(campusId?: number): Promise<any> {
    const campusCond = campusId !== undefined ? eq(payments.campusId, campusId) : undefined;
    const allPayments = campusCond
      ? await db.select().from(payments).where(campusCond)
      : await db.select().from(payments);
    const total = allPayments.length;
    const paid = allPayments.filter(p => p.status === 'paid').length;
    const unpaid = allPayments.filter(p => p.status === 'unpaid').length;
    const partial = allPayments.filter(p => p.status === 'partial').length;
    const flagged = allPayments.filter(p => p.status === 'flagged').length;
    const totalRevenue = allPayments.reduce((s, p) => s + (p.amountPaid ?? 0), 0);
    const totalOutstanding = allPayments.reduce((s, p) => s + Math.max(0, p.amountDue - (p.amountPaid ?? 0)), 0);
    return { total, paid, unpaid, partial, flagged, totalRevenue, totalOutstanding };
  }

  async generatePaymentsForPeriod(
    campusId: number | undefined,
    periodLabel: string,
    billingPeriod: string,
    dueDate: string,
    createdById: string
  ): Promise<number> {
    const config = await this.getActiveFeeConfig(campusId);
    if (!config) throw new Error('No active fee config found for this campus');
    const allStudents = campusId !== undefined
      ? await db.select().from(students).where(and(eq(students.campusId, campusId), eq(students.status, 'active')))
      : await db.select().from(students).where(eq(students.status, 'active'));
    let created = 0;
    for (const student of allStudents) {
      const existing = await db.select().from(payments).where(
        and(eq(payments.studentId, student.id), eq(payments.periodLabel, periodLabel))
      );
      if (existing.length === 0) {
        await db.insert(payments).values({
          studentId: student.id,
          campusId: student.campusId ?? campusId,
          feeConfigId: config.id,
          billingPeriod,
          periodLabel,
          amountDue: config.baseFee,
          amountPaid: 0,
          status: 'unpaid',
          dueDate,
          recordedById: createdById,
        });
        created++;
      }
    }
    return created;
  }
}

export const storage = new DatabaseStorage();
