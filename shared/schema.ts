import {
  sqliteTable,
  text,
  blob,
  integer,
  index,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for external OIDC auth
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: blob("sess").notNull(),
    expire: integer("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for external OIDC auth
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("student"), // 'admin', 'teacher', or 'student'
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Levels table (Level 1, Level 2, etc.)
export const levels = sqliteTable("levels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  durationMonths: integer("duration_months").notNull().default(6),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Students table
export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentNumber: text("student_number").notNull().unique(),
  userId: text("user_id").references(() => users.id),
  campusId: integer("campus_id").references(() => campuses.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  currentLevelId: integer("current_level_id").references(() => levels.id),
  enrollmentDate: text("enrollment_date").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'graduated', 'suspended'
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Campuses table
export const campuses = sqliteTable("campuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  address: text("address"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Subjects table
export const subjects = sqliteTable("subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  levelId: integer("level_id").references(() => levels.id).notNull(),
  createdById: text("created_by_id").references(() => users.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Teachers table
export const teachers = sqliteTable("teachers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id).notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  employmentDate: text("employment_date").notNull(),
  specialties: text("specialties"), // optional: comma-separated specialties
  status: text("status").notNull().default("active"), // 'active', 'inactive'
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Teacher Subject Assignment table (teachers can teach multiple subjects)
export const teacherSubjects = sqliteTable("teacher_subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacherId: integer("teacher_id").references(() => teachers.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  assignedDate: text("assigned_date").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Teacher Level Assignment table (teachers can teach at multiple levels)
export const teacherLevels = sqliteTable("teacher_levels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacherId: integer("teacher_id").references(() => teachers.id).notNull(),
  levelId: integer("level_id").references(() => levels.id).notNull(),
  assignedDate: text("assigned_date").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Assessments table (tests, exams, continuous assessments)
export const assessments = sqliteTable("assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'test', 'exam', 'continuous', 'assignment'
  description: text("description"),
  totalMarks: real("total_marks").notNull().default(100),
  assessmentDate: text("assessment_date").notNull(),
  createdById: text("created_by_id").references(() => users.id).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Assessment Results table (student scores on assessments)
export const assessmentResults = sqliteTable("assessment_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assessmentId: integer("assessment_id").references(() => assessments.id).notNull(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  score: real("score").notNull(),
  enteredBy: text("entered_by").references(() => users.id).notNull(),
  enteredAt: integer("entered_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
  comments: text("comments"),
});

// Grades table
export const grades = sqliteTable("grades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").references(() => students.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  score: real("score").notNull(),
  maxScore: real("max_score").notNull().default(100),
  enteredBy: text("entered_by").references(() => users.id).notNull(),
  enteredAt: integer("entered_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
  comments: text("comments"),
});

// Level Progressions table
export const levelProgressions = sqliteTable("level_progressions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").references(() => students.id).notNull(),
  fromLevelId: integer("from_level_id").references(() => levels.id),
  toLevelId: integer("to_level_id").references(() => levels.id).notNull(),
  progressionDate: text("progression_date").notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Forums table
export const forums = sqliteTable("forums", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'general' or 'subject'
  subjectId: integer("subject_id").references(() => subjects.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Forum Posts table
export const forumPosts = sqliteTable("forum_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  forumId: integer("forum_id").references(() => forums.id).notNull(),
  authorId: text("author_id").references(() => users.id).notNull(),
  title: text("title"),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  students: many(students),
  grades: many(grades),
  forumPosts: many(forumPosts),
  teacher: many(teachers),
  createdSubjects: many(subjects),
  createdAssessments: many(assessments),
  assessmentResults: many(assessmentResults),
}));

export const levelsRelations = relations(levels, ({ many }) => ({
  students: many(students),
  subjects: many(subjects),
  progressionsFrom: many(levelProgressions, { relationName: "fromLevel" }),
  progressionsTo: many(levelProgressions, { relationName: "toLevel" }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  currentLevel: one(levels, { fields: [students.currentLevelId], references: [levels.id] }),
  grades: many(grades),
  progressions: many(levelProgressions),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  level: one(levels, { fields: [subjects.levelId], references: [levels.id] }),
  createdBy: one(users, { fields: [subjects.createdById], references: [users.id] }),
  grades: many(grades),
  forums: many(forums),
  teacherAssignments: many(teacherSubjects),
  assessments: many(assessments),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  student: one(students, { fields: [grades.studentId], references: [students.id] }),
  subject: one(subjects, { fields: [grades.subjectId], references: [subjects.id] }),
  enteredByUser: one(users, { fields: [grades.enteredBy], references: [users.id] }),
}));

export const levelProgressionsRelations = relations(levelProgressions, ({ one }) => ({
  student: one(students, { fields: [levelProgressions.studentId], references: [students.id] }),
  fromLevel: one(levels, { fields: [levelProgressions.fromLevelId], references: [levels.id], relationName: "fromLevel" }),
  toLevel: one(levels, { fields: [levelProgressions.toLevelId], references: [levels.id], relationName: "toLevel" }),
}));

export const forumsRelations = relations(forums, ({ one, many }) => ({
  subject: one(subjects, { fields: [forums.subjectId], references: [subjects.id] }),
  posts: many(forumPosts),
}));

export const forumPostsRelations = relations(forumPosts, ({ one }) => ({
  forum: one(forums, { fields: [forumPosts.forumId], references: [forums.id] }),
  author: one(users, { fields: [forumPosts.authorId], references: [users.id] }),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  subjectAssignments: many(teacherSubjects),
  levelAssignments: many(teacherLevels),
}));

export const teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
  teacher: one(teachers, { fields: [teacherSubjects.teacherId], references: [teachers.id] }),
  subject: one(subjects, { fields: [teacherSubjects.subjectId], references: [subjects.id] }),
}));

export const teacherLevelsRelations = relations(teacherLevels, ({ one }) => ({
  teacher: one(teachers, { fields: [teacherLevels.teacherId], references: [teachers.id] }),
  level: one(levels, { fields: [teacherLevels.levelId], references: [levels.id] }),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  subject: one(subjects, { fields: [assessments.subjectId], references: [subjects.id] }),
  createdBy: one(users, { fields: [assessments.createdById], references: [users.id] }),
  results: many(assessmentResults),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({ one }) => ({
  assessment: one(assessments, { fields: [assessmentResults.assessmentId], references: [assessments.id] }),
  student: one(students, { fields: [assessmentResults.studentId], references: [students.id] }),
  enteredByUser: one(users, { fields: [assessmentResults.enteredBy], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  studentNumber: true,
  createdAt: true,
});

export const insertCampusSchema = createInsertSchema(campuses).omit({
  id: true,
  createdAt: true,
});

export const insertLevelSchema = createInsertSchema(levels).omit({
  id: true,
  createdAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  enteredAt: true,
});

export const insertForumSchema = createInsertSchema(forums).omit({
  id: true,
  createdAt: true,
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherSubjectSchema = createInsertSchema(teacherSubjects).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherLevelSchema = createInsertSchema(teacherLevels).omit({
  id: true,
  createdAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export const insertAssessmentResultSchema = createInsertSchema(assessmentResults).omit({
  id: true,
  enteredAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertLevel = z.infer<typeof insertLevelSchema>;
export type Level = typeof levels.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;
export type InsertForum = z.infer<typeof insertForumSchema>;
export type Forum = typeof forums.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type LevelProgression = typeof levelProgressions.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacherSubject = z.infer<typeof insertTeacherSubjectSchema>;
export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type InsertTeacherLevel = z.infer<typeof insertTeacherLevelSchema>;
export type TeacherLevel = typeof teacherLevels.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessmentResult = z.infer<typeof insertAssessmentResultSchema>;
export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertCampus = z.infer<typeof insertCampusSchema>;
export type Campus = typeof campuses.$inferSelect;
