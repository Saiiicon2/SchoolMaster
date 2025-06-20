import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("student"), // 'admin' or 'student'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Levels table (Level 1, Level 2, etc.)
export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  durationMonths: integer("duration_months").notNull().default(6),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentNumber: varchar("student_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull().unique(),
  currentLevelId: integer("current_level_id").references(() => levels.id),
  enrollmentDate: date("enrollment_date").notNull(),
  status: varchar("status").notNull().default("active"), // 'active', 'graduated', 'suspended'
  createdAt: timestamp("created_at").defaultNow(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  levelId: integer("level_id").references(() => levels.id).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grades table
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).notNull().default("100"),
  enteredBy: varchar("entered_by").references(() => users.id).notNull(),
  enteredAt: timestamp("entered_at").defaultNow(),
  comments: text("comments"),
});

// Level Progressions table
export const levelProgressions = pgTable("level_progressions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  fromLevelId: integer("from_level_id").references(() => levels.id),
  toLevelId: integer("to_level_id").references(() => levels.id).notNull(),
  progressionDate: date("progression_date").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Forums table
export const forums = pgTable("forums", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // 'general' or 'subject'
  subjectId: integer("subject_id").references(() => subjects.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Forum Posts table
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  forumId: integer("forum_id").references(() => forums.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  title: varchar("title"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  students: many(students),
  grades: many(grades),
  forumPosts: many(forumPosts),
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
  grades: many(grades),
  forums: many(forums),
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
