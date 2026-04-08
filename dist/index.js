var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  assessmentResults: () => assessmentResults,
  assessmentResultsRelations: () => assessmentResultsRelations,
  assessments: () => assessments,
  assessmentsRelations: () => assessmentsRelations,
  campuses: () => campuses,
  forumPosts: () => forumPosts,
  forumPostsRelations: () => forumPostsRelations,
  forums: () => forums,
  forumsRelations: () => forumsRelations,
  grades: () => grades,
  gradesRelations: () => gradesRelations,
  insertAssessmentResultSchema: () => insertAssessmentResultSchema,
  insertAssessmentSchema: () => insertAssessmentSchema,
  insertCampusSchema: () => insertCampusSchema,
  insertForumPostSchema: () => insertForumPostSchema,
  insertForumSchema: () => insertForumSchema,
  insertGradeSchema: () => insertGradeSchema,
  insertLevelSchema: () => insertLevelSchema,
  insertStudentSchema: () => insertStudentSchema,
  insertSubjectSchema: () => insertSubjectSchema,
  insertTeacherLevelSchema: () => insertTeacherLevelSchema,
  insertTeacherSchema: () => insertTeacherSchema,
  insertTeacherSubjectSchema: () => insertTeacherSubjectSchema,
  insertUserSchema: () => insertUserSchema,
  levelProgressions: () => levelProgressions,
  levelProgressionsRelations: () => levelProgressionsRelations,
  levels: () => levels,
  levelsRelations: () => levelsRelations,
  sessions: () => sessions,
  students: () => students,
  studentsRelations: () => studentsRelations,
  subjects: () => subjects,
  subjectsRelations: () => subjectsRelations,
  teacherLevels: () => teacherLevels,
  teacherLevelsRelations: () => teacherLevelsRelations,
  teacherSubjects: () => teacherSubjects,
  teacherSubjectsRelations: () => teacherSubjectsRelations,
  teachers: () => teachers,
  teachersRelations: () => teachersRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  sqliteTable,
  text,
  blob,
  integer,
  index,
  real
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var sessions, users, levels, students, campuses, subjects, teachers, teacherSubjects, teacherLevels, assessments, assessmentResults, grades, levelProgressions, forums, forumPosts, usersRelations, levelsRelations, studentsRelations, subjectsRelations, gradesRelations, levelProgressionsRelations, forumsRelations, forumPostsRelations, teachersRelations, teacherSubjectsRelations, teacherLevelsRelations, assessmentsRelations, assessmentResultsRelations, insertUserSchema, insertStudentSchema, insertCampusSchema, insertLevelSchema, insertSubjectSchema, insertGradeSchema, insertForumSchema, insertForumPostSchema, insertTeacherSchema, insertTeacherSubjectSchema, insertTeacherLevelSchema, insertAssessmentSchema, insertAssessmentResultSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    sessions = sqliteTable(
      "sessions",
      {
        sid: text("sid").primaryKey(),
        sess: blob("sess").notNull(),
        expire: integer("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = sqliteTable("users", {
      id: text("id").primaryKey().notNull(),
      email: text("email").unique(),
      password: text("password"),
      firstName: text("first_name"),
      lastName: text("last_name"),
      profileImageUrl: text("profile_image_url"),
      role: text("role").notNull().default("student"),
      // 'admin', 'teacher', or 'student'
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    levels = sqliteTable("levels", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull().unique(),
      description: text("description"),
      durationMonths: integer("duration_months").notNull().default(6),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    students = sqliteTable("students", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      studentNumber: text("student_number").notNull().unique(),
      userId: text("user_id").references(() => users.id),
      campusId: integer("campus_id").references(() => campuses.id),
      firstName: text("first_name").notNull(),
      lastName: text("last_name").notNull(),
      email: text("email").notNull().unique(),
      currentLevelId: integer("current_level_id").references(() => levels.id),
      enrollmentDate: text("enrollment_date").notNull(),
      status: text("status").notNull().default("active"),
      // 'active', 'graduated', 'suspended'
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    campuses = sqliteTable("campuses", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull().unique(),
      code: text("code").notNull().unique(),
      address: text("address"),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    subjects = sqliteTable("subjects", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      description: text("description"),
      levelId: integer("level_id").references(() => levels.id).notNull(),
      createdById: text("created_by_id").references(() => users.id),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    teachers = sqliteTable("teachers", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").references(() => users.id).notNull().unique(),
      firstName: text("first_name").notNull(),
      lastName: text("last_name").notNull(),
      email: text("email").notNull().unique(),
      employmentDate: text("employment_date").notNull(),
      specialties: text("specialties"),
      // optional: comma-separated specialties
      status: text("status").notNull().default("active"),
      // 'active', 'inactive'
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    teacherSubjects = sqliteTable("teacher_subjects", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      teacherId: integer("teacher_id").references(() => teachers.id).notNull(),
      subjectId: integer("subject_id").references(() => subjects.id).notNull(),
      assignedDate: text("assigned_date").notNull(),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    teacherLevels = sqliteTable("teacher_levels", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      teacherId: integer("teacher_id").references(() => teachers.id).notNull(),
      levelId: integer("level_id").references(() => levels.id).notNull(),
      assignedDate: text("assigned_date").notNull(),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    assessments = sqliteTable("assessments", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      subjectId: integer("subject_id").references(() => subjects.id).notNull(),
      title: text("title").notNull(),
      type: text("type").notNull(),
      // 'test', 'exam', 'continuous', 'assignment'
      description: text("description"),
      totalMarks: real("total_marks").notNull().default(100),
      assessmentDate: text("assessment_date").notNull(),
      createdById: text("created_by_id").references(() => users.id).notNull(),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    assessmentResults = sqliteTable("assessment_results", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      assessmentId: integer("assessment_id").references(() => assessments.id).notNull(),
      studentId: integer("student_id").references(() => students.id).notNull(),
      score: real("score").notNull(),
      enteredBy: text("entered_by").references(() => users.id).notNull(),
      enteredAt: integer("entered_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
      comments: text("comments")
    });
    grades = sqliteTable("grades", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      studentId: integer("student_id").references(() => students.id).notNull(),
      subjectId: integer("subject_id").references(() => subjects.id).notNull(),
      score: real("score").notNull(),
      maxScore: real("max_score").notNull().default(100),
      enteredBy: text("entered_by").references(() => users.id).notNull(),
      enteredAt: integer("entered_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
      comments: text("comments")
    });
    levelProgressions = sqliteTable("level_progressions", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      studentId: integer("student_id").references(() => students.id).notNull(),
      fromLevelId: integer("from_level_id").references(() => levels.id),
      toLevelId: integer("to_level_id").references(() => levels.id).notNull(),
      progressionDate: text("progression_date").notNull(),
      completedAt: integer("completed_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    forums = sqliteTable("forums", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      description: text("description"),
      type: text("type").notNull(),
      // 'general' or 'subject'
      subjectId: integer("subject_id").references(() => subjects.id),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    forumPosts = sqliteTable("forum_posts", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      forumId: integer("forum_id").references(() => forums.id).notNull(),
      authorId: text("author_id").references(() => users.id).notNull(),
      title: text("title"),
      content: text("content").notNull(),
      createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s','now'))`)
    });
    usersRelations = relations(users, ({ many }) => ({
      students: many(students),
      grades: many(grades),
      forumPosts: many(forumPosts),
      teacher: many(teachers),
      createdSubjects: many(subjects),
      createdAssessments: many(assessments),
      assessmentResults: many(assessmentResults)
    }));
    levelsRelations = relations(levels, ({ many }) => ({
      students: many(students),
      subjects: many(subjects),
      progressionsFrom: many(levelProgressions, { relationName: "fromLevel" }),
      progressionsTo: many(levelProgressions, { relationName: "toLevel" })
    }));
    studentsRelations = relations(students, ({ one, many }) => ({
      user: one(users, { fields: [students.userId], references: [users.id] }),
      currentLevel: one(levels, { fields: [students.currentLevelId], references: [levels.id] }),
      grades: many(grades),
      progressions: many(levelProgressions)
    }));
    subjectsRelations = relations(subjects, ({ one, many }) => ({
      level: one(levels, { fields: [subjects.levelId], references: [levels.id] }),
      createdBy: one(users, { fields: [subjects.createdById], references: [users.id] }),
      grades: many(grades),
      forums: many(forums),
      teacherAssignments: many(teacherSubjects),
      assessments: many(assessments)
    }));
    gradesRelations = relations(grades, ({ one }) => ({
      student: one(students, { fields: [grades.studentId], references: [students.id] }),
      subject: one(subjects, { fields: [grades.subjectId], references: [subjects.id] }),
      enteredByUser: one(users, { fields: [grades.enteredBy], references: [users.id] })
    }));
    levelProgressionsRelations = relations(levelProgressions, ({ one }) => ({
      student: one(students, { fields: [levelProgressions.studentId], references: [students.id] }),
      fromLevel: one(levels, { fields: [levelProgressions.fromLevelId], references: [levels.id], relationName: "fromLevel" }),
      toLevel: one(levels, { fields: [levelProgressions.toLevelId], references: [levels.id], relationName: "toLevel" })
    }));
    forumsRelations = relations(forums, ({ one, many }) => ({
      subject: one(subjects, { fields: [forums.subjectId], references: [subjects.id] }),
      posts: many(forumPosts)
    }));
    forumPostsRelations = relations(forumPosts, ({ one }) => ({
      forum: one(forums, { fields: [forumPosts.forumId], references: [forums.id] }),
      author: one(users, { fields: [forumPosts.authorId], references: [users.id] })
    }));
    teachersRelations = relations(teachers, ({ one, many }) => ({
      user: one(users, { fields: [teachers.userId], references: [users.id] }),
      subjectAssignments: many(teacherSubjects),
      levelAssignments: many(teacherLevels)
    }));
    teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
      teacher: one(teachers, { fields: [teacherSubjects.teacherId], references: [teachers.id] }),
      subject: one(subjects, { fields: [teacherSubjects.subjectId], references: [subjects.id] })
    }));
    teacherLevelsRelations = relations(teacherLevels, ({ one }) => ({
      teacher: one(teachers, { fields: [teacherLevels.teacherId], references: [teachers.id] }),
      level: one(levels, { fields: [teacherLevels.levelId], references: [levels.id] })
    }));
    assessmentsRelations = relations(assessments, ({ one, many }) => ({
      subject: one(subjects, { fields: [assessments.subjectId], references: [subjects.id] }),
      createdBy: one(users, { fields: [assessments.createdById], references: [users.id] }),
      results: many(assessmentResults)
    }));
    assessmentResultsRelations = relations(assessmentResults, ({ one }) => ({
      assessment: one(assessments, { fields: [assessmentResults.assessmentId], references: [assessments.id] }),
      student: one(students, { fields: [assessmentResults.studentId], references: [students.id] }),
      enteredByUser: one(users, { fields: [assessmentResults.enteredBy], references: [users.id] })
    }));
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertStudentSchema = createInsertSchema(students).omit({
      id: true,
      studentNumber: true,
      createdAt: true
    });
    insertCampusSchema = createInsertSchema(campuses).omit({
      id: true,
      createdAt: true
    });
    insertLevelSchema = createInsertSchema(levels).omit({
      id: true,
      createdAt: true
    });
    insertSubjectSchema = createInsertSchema(subjects).omit({
      id: true,
      createdAt: true
    });
    insertGradeSchema = createInsertSchema(grades).omit({
      id: true,
      enteredAt: true
    });
    insertForumSchema = createInsertSchema(forums).omit({
      id: true,
      createdAt: true
    });
    insertForumPostSchema = createInsertSchema(forumPosts).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertTeacherSchema = createInsertSchema(teachers).omit({
      id: true,
      createdAt: true
    });
    insertTeacherSubjectSchema = createInsertSchema(teacherSubjects).omit({
      id: true,
      createdAt: true
    });
    insertTeacherLevelSchema = createInsertSchema(teacherLevels).omit({
      id: true,
      createdAt: true
    });
    insertAssessmentSchema = createInsertSchema(assessments).omit({
      id: true,
      createdAt: true
    });
    insertAssessmentResultSchema = createInsertSchema(assessmentResults).omit({
      id: true,
      enteredAt: true
    });
  }
});

// server/db.ts
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
async function ensureDbAndSeed() {
  const isPostgres = !!process.env.DATABASE_URL;
  if (isPostgres) {
    const { default: postgres } = await import("postgres");
    const { drizzle: drizzlePg } = await import("drizzle-orm/postgres-js");
    const ssl = process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : void 0;
    pg = postgres(process.env.DATABASE_URL, { ssl });
    db = drizzlePg(pg, { schema: schema_exports });
    console.log("\u2713 Database client initialized (Postgres)");
    try {
      console.log("Ensuring Postgres tables...");
      await pg`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        role TEXT NOT NULL DEFAULT 'student',
        created_at INTEGER,
        updated_at INTEGER
      );`;
      await pg`CREATE TABLE IF NOT EXISTS campuses (
							id SERIAL PRIMARY KEY,
							name TEXT NOT NULL UNIQUE,
							code TEXT NOT NULL UNIQUE,
							address TEXT,
							is_active BOOLEAN NOT NULL DEFAULT true,
							created_at INTEGER
						);`;
      await pg`CREATE TABLE IF NOT EXISTS levels (
							id SERIAL PRIMARY KEY,
							name TEXT NOT NULL UNIQUE,
							description TEXT,
							duration_months INTEGER NOT NULL DEFAULT 6,
							is_active BOOLEAN NOT NULL DEFAULT true,
							created_at INTEGER
						);`;
      await pg`CREATE TABLE IF NOT EXISTS students (
							id SERIAL PRIMARY KEY,
							student_number TEXT NOT NULL UNIQUE,
							user_id TEXT,
							campus_id INTEGER REFERENCES campuses(id),
							first_name TEXT NOT NULL,
							last_name TEXT NOT NULL,
							email TEXT NOT NULL UNIQUE,
							current_level_id INTEGER REFERENCES levels(id),
							enrollment_date TEXT NOT NULL,
							status TEXT NOT NULL DEFAULT 'active',
							created_at INTEGER
						);`;
      await pg`CREATE TABLE IF NOT EXISTS attendance (
							id SERIAL PRIMARY KEY,
							student_id INTEGER NOT NULL REFERENCES students(id),
							attendance_date TEXT NOT NULL,
							status TEXT NOT NULL,
							note TEXT,
							created_at INTEGER,
							UNIQUE(student_id, attendance_date)
						);`;
      await pg`CREATE TABLE IF NOT EXISTS subjects (
							id SERIAL PRIMARY KEY,
							name TEXT NOT NULL,
							description TEXT,
							level_id INTEGER,
							created_by_id TEXT,
							is_active BOOLEAN NOT NULL DEFAULT true,
							created_at INTEGER
						);`;
      await pg`CREATE TABLE IF NOT EXISTS teachers (
							id SERIAL PRIMARY KEY,
							user_id TEXT NOT NULL UNIQUE,
							first_name TEXT NOT NULL,
							last_name TEXT NOT NULL,
							email TEXT NOT NULL UNIQUE,
							employment_date TEXT NOT NULL,
							specialties TEXT,
							status TEXT NOT NULL DEFAULT 'active',
							created_at INTEGER
						);`;
      await pg`CREATE TABLE IF NOT EXISTS teacher_levels (
							id SERIAL PRIMARY KEY,
							teacher_id INTEGER NOT NULL REFERENCES teachers(id),
							level_id INTEGER NOT NULL REFERENCES levels(id),
							assigned_date TEXT NOT NULL,
							is_active BOOLEAN NOT NULL DEFAULT true,
							created_at INTEGER
						);`;
      await pg`CREATE TABLE IF NOT EXISTS assessments (
							id SERIAL PRIMARY KEY,
							subject_id INTEGER NOT NULL,
							title TEXT NOT NULL,
							type TEXT NOT NULL,
							description TEXT,
							total_marks REAL NOT NULL DEFAULT 100,
							assessment_date TEXT NOT NULL,
							created_by_id TEXT NOT NULL,
							created_at INTEGER
						);`;
      await pg`CREATE TABLE IF NOT EXISTS assessment_results (
							id SERIAL PRIMARY KEY,
							assessment_id INTEGER NOT NULL,
							student_id INTEGER NOT NULL,
							score REAL NOT NULL,
							entered_by TEXT NOT NULL,
							entered_at INTEGER,
							comments TEXT
						);`;
      await pg`CREATE TABLE IF NOT EXISTS grades (
							id SERIAL PRIMARY KEY,
							student_id INTEGER NOT NULL,
							subject_id INTEGER NOT NULL,
							score REAL NOT NULL,
							max_score REAL NOT NULL DEFAULT 100,
							entered_by TEXT NOT NULL,
							entered_at INTEGER,
							comments TEXT
						);`;
      await pg`CREATE TABLE IF NOT EXISTS level_progressions (
							id SERIAL PRIMARY KEY,
							student_id INTEGER NOT NULL,
							from_level_id INTEGER,
							to_level_id INTEGER NOT NULL,
							progression_date TEXT NOT NULL,
							completed_at INTEGER
						);`;
      await pg`CREATE TABLE IF NOT EXISTS forums (
							id SERIAL PRIMARY KEY,
							name TEXT NOT NULL,
							description TEXT,
							type TEXT NOT NULL,
							subject_id INTEGER,
							is_active BOOLEAN NOT NULL DEFAULT true,
							created_at INTEGER
						);`;
      await pg`CREATE TABLE IF NOT EXISTS forum_posts (
							id SERIAL PRIMARY KEY,
							forum_id INTEGER NOT NULL,
							author_id TEXT NOT NULL,
							title TEXT,
							content TEXT NOT NULL,
							created_at INTEGER,
							updated_at INTEGER
						);`;
      const usersCountRow = await pg`SELECT count(*) AS count FROM users`;
      const usersCount = Number(usersCountRow?.[0]?.count ?? 0);
      if (usersCount === 0) {
        console.log("Seeding default users (Postgres)...");
        const now = Date.now();
        const adminPassword = await bcrypt.hash("admin123", 10);
        const userPassword = await bcrypt.hash("user123", 10);
        await pg`INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES (${randomUUID()}, ${"admin@school.com"}, ${adminPassword}, ${"Admin"}, ${"User"}, ${"admin"}, ${now}, ${now})`;
        await pg`INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES (${randomUUID()}, ${"user@school.com"}, ${userPassword}, ${"Normal"}, ${"User"}, ${"teacher"}, ${now}, ${now})`;
        console.log("Default admin and non-admin users created: admin@school.com / admin123, user@school.com / user123");
      } else {
        console.log(`Users table already has ${usersCount} rows, skipping seed.`);
      }
      const campusCountRow = await pg`SELECT count(*) AS count FROM campuses`;
      const campusCount = Number(campusCountRow?.[0]?.count ?? 0);
      if (campusCount === 0) {
        console.log("Seeding sample campuses (Postgres)...");
        const now = Date.now();
        await pg`INSERT INTO campuses (name, code, address, is_active, created_at) VALUES (${"Main Campus"}, ${"MAIN"}, ${"123 Main St"}, ${true}, ${now})`;
        await pg`INSERT INTO campuses (name, code, address, is_active, created_at) VALUES (${"North Campus"}, ${"NORT"}, ${"456 North Ave"}, ${true}, ${now})`;
        console.log("Sample campuses created: Main Campus, North Campus");
      } else {
        console.log(`Campuses table already has ${campusCount} rows, skipping campus seed.`);
      }
      const studentsCountRow = await pg`SELECT count(*) AS count FROM students`;
      const studentsCount = Number(studentsCountRow?.[0]?.count ?? 0);
      if (studentsCount === 0) {
        console.log("Seeding sample students (Postgres)...");
        const now = Date.now();
        const year = (/* @__PURE__ */ new Date()).getFullYear();
        await pg`INSERT INTO students (student_number, user_id, first_name, last_name, email, current_level_id, enrollment_date, status, created_at) VALUES (${`STU-${year}-001`}, ${null}, ${"Alice"}, ${"Anderson"}, ${"alice@example.com"}, ${null}, ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}, ${"active"}, ${now})`;
        await pg`INSERT INTO students (student_number, user_id, first_name, last_name, email, current_level_id, enrollment_date, status, created_at) VALUES (${`STU-${year}-002`}, ${null}, ${"Bob"}, ${"Brown"}, ${"bob@example.com"}, ${null}, ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}, ${"active"}, ${now})`;
        console.log("Sample students created: alice@example.com, bob@example.com");
      } else {
        console.log(`Students table already has ${studentsCount} rows, skipping student seed.`);
      }
    } catch (err) {
      console.error("Error ensuring Postgres tables:", err);
      throw err;
    }
    return;
  }
  const BetterSqlite3 = (await import("better-sqlite3")).default;
  sqlite = new BetterSqlite3("./school.db");
  try {
    sqlite.pragma("journal_mode = WAL");
  } catch (e) {
  }
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  db = drizzle(sqlite, { schema: schema_exports });
  console.log("\u2713 Database client initialized (SQLite)");
  const createUsersSQL = `
					CREATE TABLE IF NOT EXISTS users (
						id TEXT PRIMARY KEY,
						email TEXT UNIQUE,
						password TEXT,
						first_name TEXT,
						last_name TEXT,
						profile_image_url TEXT,
						role TEXT NOT NULL DEFAULT 'student',
						created_at INTEGER,
						updated_at INTEGER
					);
				`;
  sqlite.exec(createUsersSQL);
  const createLevelsSQL = `
					CREATE TABLE IF NOT EXISTS levels (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						name TEXT NOT NULL UNIQUE,
						description TEXT,
						duration_months INTEGER NOT NULL DEFAULT 6,
						is_active INTEGER NOT NULL DEFAULT 1,
						created_at INTEGER
					);
				`;
  sqlite.exec(createLevelsSQL);
  const createCampusesSQL = `
					CREATE TABLE IF NOT EXISTS campuses (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						name TEXT NOT NULL UNIQUE,
						code TEXT NOT NULL UNIQUE,
						address TEXT,
						is_active INTEGER NOT NULL DEFAULT 1,
						created_at INTEGER
					);
				`;
  sqlite.exec(createCampusesSQL);
  const createStudentsSQL = `
					CREATE TABLE IF NOT EXISTS students (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						student_number TEXT NOT NULL UNIQUE,
						user_id TEXT,
						campus_id INTEGER,
						first_name TEXT NOT NULL,
						last_name TEXT NOT NULL,
						email TEXT NOT NULL UNIQUE,
						current_level_id INTEGER,
						enrollment_date TEXT NOT NULL,
						status TEXT NOT NULL DEFAULT 'active',
						created_at INTEGER
					);
				`;
  sqlite.exec(createStudentsSQL);
  const createAttendanceSQL = `
					CREATE TABLE IF NOT EXISTS attendance (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						student_id INTEGER NOT NULL,
						attendance_date TEXT NOT NULL,
						status TEXT NOT NULL,
						note TEXT,
						created_at INTEGER,
						UNIQUE(student_id, attendance_date)
					);
				`;
  sqlite.exec(createAttendanceSQL);
  const createSubjectsSQL = `
					CREATE TABLE IF NOT EXISTS subjects (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						name TEXT NOT NULL,
						description TEXT,
						level_id INTEGER,
						created_by_id TEXT,
						is_active INTEGER NOT NULL DEFAULT 1,
						created_at INTEGER
					);
				`;
  sqlite.exec(createSubjectsSQL);
  const createTeachersSQL = `
					CREATE TABLE IF NOT EXISTS teachers (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						user_id TEXT NOT NULL UNIQUE,
						first_name TEXT NOT NULL,
						last_name TEXT NOT NULL,
						email TEXT NOT NULL UNIQUE,
						employment_date TEXT NOT NULL,
						specialties TEXT,
						status TEXT NOT NULL DEFAULT 'active',
						created_at INTEGER
					);
				`;
  sqlite.exec(createTeachersSQL);
  try {
    const checkColumn = sqlite.prepare("PRAGMA table_info(teachers)").all();
    if (!checkColumn.some((col) => col.name === "specialties")) {
      sqlite.exec("ALTER TABLE teachers ADD COLUMN specialties TEXT;");
    }
  } catch (e) {
  }
  const createTeacherSubjectsSQL = `
					CREATE TABLE IF NOT EXISTS teacher_subjects (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						teacher_id INTEGER NOT NULL,
						subject_id INTEGER NOT NULL,
						assigned_date TEXT NOT NULL,
						is_active INTEGER NOT NULL DEFAULT 1,
						created_at INTEGER
					);
				`;
  sqlite.exec(createTeacherSubjectsSQL);
  const createTeacherLevelsSQL = `
					CREATE TABLE IF NOT EXISTS teacher_levels (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						teacher_id INTEGER NOT NULL,
						level_id INTEGER NOT NULL,
						assigned_date TEXT NOT NULL,
						is_active INTEGER NOT NULL DEFAULT 1,
						created_at INTEGER
					);
				`;
  sqlite.exec(createTeacherLevelsSQL);
  const createAssessmentsSQL = `
					CREATE TABLE IF NOT EXISTS assessments (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						subject_id INTEGER NOT NULL,
						title TEXT NOT NULL,
						type TEXT NOT NULL,
						description TEXT,
						total_marks REAL NOT NULL DEFAULT 100,
						assessment_date TEXT NOT NULL,
						created_by_id TEXT NOT NULL,
						created_at INTEGER
					);
				`;
  sqlite.exec(createAssessmentsSQL);
  const createAssessmentResultsSQL = `
					CREATE TABLE IF NOT EXISTS assessment_results (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						assessment_id INTEGER NOT NULL,
						student_id INTEGER NOT NULL,
						score REAL NOT NULL,
						entered_by TEXT NOT NULL,
						entered_at INTEGER,
						comments TEXT
					);
				`;
  sqlite.exec(createAssessmentResultsSQL);
  const createGradesSQL = `
					CREATE TABLE IF NOT EXISTS grades (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						student_id INTEGER NOT NULL,
						subject_id INTEGER NOT NULL,
						score REAL NOT NULL,
						max_score REAL NOT NULL DEFAULT 100,
						entered_by TEXT NOT NULL,
						entered_at INTEGER,
						comments TEXT
					);
				`;
  sqlite.exec(createGradesSQL);
  const createLevelProgressionsSQL = `
					CREATE TABLE IF NOT EXISTS level_progressions (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						student_id INTEGER NOT NULL,
						from_level_id INTEGER,
						to_level_id INTEGER NOT NULL,
						progression_date TEXT NOT NULL,
						completed_at INTEGER
					);
				`;
  sqlite.exec(createLevelProgressionsSQL);
  const createForumsSQL = `
					CREATE TABLE IF NOT EXISTS forums (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						name TEXT NOT NULL,
						description TEXT,
						type TEXT NOT NULL,
						subject_id INTEGER,
						is_active INTEGER NOT NULL DEFAULT 1,
						created_at INTEGER
					);
				`;
  sqlite.exec(createForumsSQL);
  const createForumPostsSQL = `
					CREATE TABLE IF NOT EXISTS forum_posts (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						forum_id INTEGER NOT NULL,
						author_id TEXT NOT NULL,
						title TEXT,
						content TEXT NOT NULL,
						created_at INTEGER,
						updated_at INTEGER
					);
				`;
  sqlite.exec(createForumPostsSQL);
  try {
    const info = sqlite.prepare("PRAGMA table_info('students')").all();
    const hasCampus = info.some((c) => c.name === "campus_id");
    if (!hasCampus) {
      try {
        sqlite.exec("ALTER TABLE students ADD COLUMN campus_id INTEGER;");
        console.log("Migrated students table: added campus_id column");
      } catch (e) {
        console.warn("Could not ALTER students table to add campus_id:", e);
      }
    }
  } catch (e) {
  }
  try {
    const row = sqlite.prepare("SELECT count(*) as count FROM users").get();
    const count2 = row?.count ?? 0;
    if (count2 === 0) {
      console.log("Seeding default users...");
      const now = Date.now();
      const adminPassword = await bcrypt.hash("admin123", 10);
      const userPassword = await bcrypt.hash("user123", 10);
      const insert = sqlite.prepare(
        `INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at)
							 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      insert.run(randomUUID(), "admin@school.com", adminPassword, "Admin", "User", "admin", now, now);
      insert.run(randomUUID(), "user@school.com", userPassword, "Normal", "User", "teacher", now, now);
      console.log("Default admin and non-admin users created: admin@school.com / admin123, user@school.com / user123");
    } else {
      console.log(`Users table already has ${count2} rows, skipping seed.`);
    }
  } catch (err) {
    console.error("Error during users seeding:", err);
  }
  try {
    const campusCountRow = sqlite.prepare("SELECT count(*) as count FROM campuses").get();
    const campusCount = campusCountRow?.count ?? 0;
    if (campusCount === 0) {
      console.log("Seeding sample campuses...");
      const insertCampus = sqlite.prepare(`INSERT INTO campuses (name, code, address, is_active, created_at) VALUES (?, ?, ?, ?, ?)`);
      const now = Date.now();
      insertCampus.run("Main Campus", "MAIN", "123 Main St", 1, now);
      insertCampus.run("North Campus", "NORT", "456 North Ave", 1, now);
      console.log("Sample campuses created: Main Campus, North Campus");
    } else {
      console.log(`Campuses table already has ${campusCount} rows, skipping campus seed.`);
    }
  } catch (err) {
    console.error("Error during campuses seeding:", err);
  }
  try {
    const studentsCountRow = sqlite.prepare("SELECT count(*) as count FROM students").get();
    const studentsCount = studentsCountRow?.count ?? 0;
    if (studentsCount === 0) {
      console.log("Seeding sample students...");
      const now = Date.now();
      const year = (/* @__PURE__ */ new Date()).getFullYear();
      const insertStudent = sqlite.prepare(`
							INSERT INTO students (student_number, user_id, first_name, last_name, email, current_level_id, enrollment_date, status, created_at)
							VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
						`);
      insertStudent.run(`STU-${year}-001`, null, "Alice", "Anderson", "alice@example.com", null, (/* @__PURE__ */ new Date()).toISOString().split("T")[0], "active", now);
      insertStudent.run(`STU-${year}-002`, null, "Bob", "Brown", "bob@example.com", null, (/* @__PURE__ */ new Date()).toISOString().split("T")[0], "active", now);
      console.log("Sample students created: alice@example.com, bob@example.com");
      const studentRow = sqlite.prepare("SELECT id FROM students WHERE email = ?").get("alice@example.com");
      if (studentRow) {
        const insertAttendance = sqlite.prepare(`INSERT INTO attendance (student_id, attendance_date, status, note, created_at) VALUES (?, ?, ?, ?, ?)`);
        insertAttendance.run(studentRow.id, (/* @__PURE__ */ new Date()).toISOString().split("T")[0], "present", "On time", now);
        console.log("Sample attendance added for alice@example.com");
      }
    } else {
      console.log(`Students table already has ${studentsCount} rows, skipping student seed.`);
    }
  } catch (err) {
    console.error("Error during students seeding:", err);
  }
}
var db, sqlite, pg;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    db = null;
    sqlite = null;
    pg = null;
  }
});

// server/storage.ts
import { eq, desc, and, or, sql as sql2, count } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
      // User operations
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async upsertUser(userData) {
        const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return user;
      }
      async createUser(userData) {
        const [user] = await db.insert(users).values({
          id: userData.id,
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          role: userData.role || "student"
        }).returning();
        return user;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
      }
      async getUsers() {
        return await db.select().from(users);
      }
      // Student operations
      async getAllStudents() {
        return await db.select().from(students).orderBy(desc(students.createdAt));
      }
      async getStudent(id) {
        const [student] = await db.select().from(students).where(eq(students.id, id));
        return student;
      }
      async getStudentByNumber(studentNumber) {
        const [student] = await db.select().from(students).where(eq(students.studentNumber, studentNumber));
        return student;
      }
      async createStudent(student) {
        const year = (/* @__PURE__ */ new Date()).getFullYear();
        const countResult = await db.select({ count: count() }).from(students);
        const studentCount = countResult[0].count + 1;
        let prefix = "STU";
        if (student.campusId) {
          const [camp] = await db.select().from(campuses).where(eq(campuses.id, student.campusId));
          if (camp) {
            prefix = (camp.code || (camp.name || "").slice(0, 4)).toString().replace(/\s+/g, "").toUpperCase();
          }
        }
        const studentNumber = `${prefix}-${year}-${studentCount.toString().padStart(3, "0")}`;
        const [newStudent] = await db.insert(students).values({ ...student, studentNumber }).returning();
        return newStudent;
      }
      async updateStudent(id, student) {
        const [updatedStudent] = await db.update(students).set(student).where(eq(students.id, id)).returning();
        return updatedStudent;
      }
      // Level operations
      async getAllLevels() {
        return await db.select().from(levels).orderBy(levels.name);
      }
      async getLevel(id) {
        const [level] = await db.select().from(levels).where(eq(levels.id, id));
        return level;
      }
      async getStudentsByLevel(levelId) {
        return await db.select().from(students).where(eq(students.currentLevelId, levelId));
      }
      async createLevel(level) {
        const [newLevel] = await db.insert(levels).values(level).returning();
        return newLevel;
      }
      async updateLevel(id, level) {
        const [updatedLevel] = await db.update(levels).set(level).where(eq(levels.id, id)).returning();
        return updatedLevel;
      }
      async deleteLevel(id) {
        await db.delete(teacherLevels).where(eq(teacherLevels.levelId, id));
        await db.delete(levelProgressions).where(or(eq(levelProgressions.fromLevelId, id), eq(levelProgressions.toLevelId, id)));
        await db.delete(levels).where(eq(levels.id, id));
      }
      // Subject operations
      async getAllSubjects() {
        return await db.select().from(subjects).orderBy(subjects.name);
      }
      async getSubject(id) {
        const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
        return subject;
      }
      async getSubjectsByLevel(levelId) {
        return await db.select().from(subjects).where(eq(subjects.levelId, levelId));
      }
      async createSubject(subject) {
        const [newSubject] = await db.insert(subjects).values(subject).returning();
        return newSubject;
      }
      async updateSubject(id, subject) {
        const [updatedSubject] = await db.update(subjects).set(subject).where(eq(subjects.id, id)).returning();
        return updatedSubject;
      }
      // Grade operations
      async getGradesByStudent(studentId) {
        return await db.select().from(grades).where(eq(grades.studentId, studentId));
      }
      async getGradesBySubject(subjectId) {
        return await db.select().from(grades).where(eq(grades.subjectId, subjectId));
      }
      async createGrade(grade) {
        const [newGrade] = await db.insert(grades).values(grade).returning();
        return newGrade;
      }
      async updateGrade(id, grade) {
        const [updatedGrade] = await db.update(grades).set(grade).where(eq(grades.id, id)).returning();
        return updatedGrade;
      }
      // Forum operations
      async getAllForums() {
        return await db.select().from(forums).where(eq(forums.isActive, true));
      }
      async getForumPosts(forumId) {
        return await db.select().from(forumPosts).where(eq(forumPosts.forumId, forumId)).orderBy(desc(forumPosts.createdAt));
      }
      async createForum(forum) {
        const [newForum] = await db.insert(forums).values(forum).returning();
        return newForum;
      }
      async createForumPost(post) {
        const [newPost] = await db.insert(forumPosts).values(post).returning();
        return newPost;
      }
      // Statistics
      async getDashboardStats() {
        const totalStudentsResult = await db.select({ count: count() }).from(students).where(eq(students.status, "active"));
        const totalSubjectsResult = await db.select({ count: count() }).from(subjects).where(eq(subjects.isActive, true));
        const activeLevelsResult = await db.select({ count: count() }).from(levels).where(eq(levels.isActive, true));
        const avgGradeResult = await db.select({
          avgScore: sql2`AVG(${grades.score})`,
          avgMaxScore: sql2`AVG(${grades.maxScore})`
        }).from(grades);
        const avgGrade = avgGradeResult[0].avgScore && avgGradeResult[0].avgMaxScore ? avgGradeResult[0].avgScore / avgGradeResult[0].avgMaxScore * 100 : 0;
        return {
          totalStudents: totalStudentsResult[0].count,
          totalSubjects: totalSubjectsResult[0].count,
          activeLevels: activeLevelsResult[0].count,
          averageGrade: Math.round(avgGrade * 10) / 10
        };
      }
      async getRecentActivity() {
        const recentStudents = await db.select({
          id: students.id,
          type: sql2`'enrollment'`,
          studentName: sql2`${students.firstName} || ' ' || ${students.lastName}`,
          levelName: levels.name,
          timestamp: students.createdAt
        }).from(students).leftJoin(levels, eq(students.currentLevelId, levels.id)).orderBy(desc(students.createdAt)).limit(5);
        const recentGrades = await db.select({
          id: grades.id,
          type: sql2`'grade'`,
          studentName: sql2`${students.firstName} || ' ' || ${students.lastName}`,
          subjectName: subjects.name,
          timestamp: grades.enteredAt
        }).from(grades).leftJoin(students, eq(grades.studentId, students.id)).leftJoin(subjects, eq(grades.subjectId, subjects.id)).orderBy(desc(grades.enteredAt)).limit(3);
        const activities = [...recentStudents, ...recentGrades].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
        return activities;
      }
      // Level progression
      async progressStudent(studentId, toLevelId) {
        const student = await this.getStudent(studentId);
        if (!student) throw new Error("Student not found");
        const [progression] = await db.insert(levelProgressions).values({
          studentId,
          fromLevelId: student.currentLevelId,
          toLevelId,
          progressionDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        }).returning();
        await this.updateStudent(studentId, { currentLevelId: toLevelId });
        return progression;
      }
      // Teacher operations
      async getAllTeachers() {
        return await db.select().from(teachers).where(eq(teachers.status, "active")).orderBy(teachers.firstName);
      }
      async getTeacher(id) {
        const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
        return teacher;
      }
      async getTeacherByUserId(userId) {
        const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, userId));
        return teacher;
      }
      async createTeacher(teacher) {
        const [newTeacher] = await db.insert(teachers).values(teacher).returning();
        return newTeacher;
      }
      async updateTeacher(id, teacher) {
        const [updatedTeacher] = await db.update(teachers).set(teacher).where(eq(teachers.id, id)).returning();
        return updatedTeacher;
      }
      async deleteTeacher(id) {
        await db.delete(teacherLevels).where(eq(teacherLevels.teacherId, id));
        await db.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, id));
        await db.delete(teachers).where(eq(teachers.id, id));
      }
      async assignTeacherToSubject(teacherId, subjectId) {
        const [assignment] = await db.insert(teacherSubjects).values({
          teacherId,
          subjectId,
          assignedDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        }).returning();
        return assignment;
      }
      async getTeacherSubjects(teacherId) {
        return await db.select().from(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
      }
      async assignTeacherToLevel(teacherId, levelId) {
        const [assignment] = await db.insert(teacherLevels).values({
          teacherId,
          levelId,
          assignedDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        }).returning();
        return assignment;
      }
      async removeTeacherFromLevel(teacherId, levelId) {
        await db.delete(teacherLevels).where(
          and(
            eq(teacherLevels.teacherId, teacherId),
            eq(teacherLevels.levelId, levelId)
          )
        );
      }
      async getTeacherLevels(teacherId) {
        return await db.select().from(teacherLevels).where(eq(teacherLevels.teacherId, teacherId));
      }
      // Campus operations
      async getAllCampuses() {
        return await db.select().from(campuses).orderBy(campuses.name);
      }
      async createCampus(campus) {
        const [newCampus] = await db.insert(campuses).values(campus).returning();
        return newCampus;
      }
      // Assessment operations
      async getAllAssessments() {
        return await db.select().from(assessments).orderBy(desc(assessments.assessmentDate));
      }
      async getAssessmentsBySubject(subjectId) {
        return await db.select().from(assessments).where(eq(assessments.subjectId, subjectId)).orderBy(desc(assessments.assessmentDate));
      }
      async createAssessment(assessment) {
        try {
          console.log("Creating assessment:", assessment);
          const [newAssessment] = await db.insert(assessments).values(assessment).returning();
          return newAssessment;
        } catch (err) {
          console.error("Error during createAssessment insert:", err);
          throw err;
        }
      }
      async getAssessmentResults(assessmentId) {
        return await db.select().from(assessmentResults).where(eq(assessmentResults.assessmentId, assessmentId));
      }
      async createAssessmentResult(result) {
        const [newResult] = await db.insert(assessmentResults).values(result).returning();
        return newResult;
      }
      async updateAssessmentResult(id, result) {
        const [updatedResult] = await db.update(assessmentResults).set(result).where(eq(assessmentResults.id, id)).returning();
        return updatedResult;
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/auth.ts
var auth_exports = {};
__export(auth_exports, {
  getSession: () => getSession,
  isAuthenticated: () => isAuthenticated,
  setupAuth: () => setupAuth
});
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  if (!isExternalAuthEnabled) {
    console.log("\u23ED\uFE0F  Skipping external auth setup (not enabled)");
    return;
  }
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.AUTH_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `auth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`auth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`auth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isExternalAuthEnabled, getOidcConfig, isAuthenticated;
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_storage();
    isExternalAuthEnabled = !!process.env.AUTH_DOMAINS;
    getOidcConfig = memoize(
      async () => {
        if (!isExternalAuthEnabled) {
          throw new Error("External auth not enabled");
        }
        return await client.discovery(
          new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
          process.env.REPL_ID
        );
      },
      { maxAge: 3600 * 1e3 }
    );
    isAuthenticated = async (req, res, next) => {
      const user = req.user;
      if (!req.isAuthenticated() || !user.expires_at) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const now = Math.floor(Date.now() / 1e3);
      if (now <= user.expires_at) {
        return next();
      }
      const refreshToken = user.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(user, tokenResponse);
        return next();
      } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
init_storage();
init_db();
init_auth();
import { createServer } from "http";

// server/localAuth.ts
init_storage();
import session2 from "express-session";
import bcrypt2 from "bcryptjs";
import { randomUUID as randomUUID2 } from "crypto";
function setupLocalAuth(app2) {
  app2.use(session2({
    secret: process.env.SESSION_SECRET || "your-local-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      // Set to false for local development
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 1 week
    }
  }));
  app2.post("/api/auth/login", async (req, res) => {
    const { email, password, keepLoggedIn } = req.body;
    console.log(" Login attempt:", email);
    try {
      const users2 = await storage.getUsers();
      console.log("\u{1F4C2} Loaded users:", users2);
      if (users2.length === 0) {
        console.log("\u26A0\uFE0F No users found, creating default admin...");
        const hashedPassword = await bcrypt2.hash("admin123", 10);
        await storage.createUser({
          id: randomUUID2(),
          // 👈 Add this line
          email: "admin@school.com",
          password: hashedPassword,
          firstName: "Admin",
          lastName: "User",
          role: "admin"
        });
        console.log(" Default admin created");
      }
      const user = await storage.getUserByEmail(email);
      console.log("\u{1F50D} Found user:", user);
      if (!user || !user.password) {
        console.log(" No user found with that email");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const passwordMatches = await bcrypt2.compare(password, user.password);
      if (!passwordMatches) {
        console.log("Password mismatch");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const { password: _, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;
      console.log("\u2705 Login successful. Session set:", req.session.user);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error(" Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/auth/user", (req, res) => {
    const user = req.session?.user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    const { email, password, firstName, lastName, keepLoggedIn } = req.body;
    try {
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt2.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "admin"
      });
      const { password: _, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;
      if (keepLoggedIn) {
        req.session.cookie.maxAge = 1e3 * 60 * 60 * 24 * 30;
      } else {
        req.session.cookie.maxAge = 1e3 * 60 * 60;
      }
      console.log("\u2705 Registration successful. Session set:", req.session.user);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
}
var isAuthenticated2 = (req, res, next) => {
  const user = req.session?.user;
  if (user) {
    req.user = user;
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// server/routes.ts
init_schema();
var isAuthenticated3 = process.env.AUTH_DOMAINS ? isAuthenticated : isAuthenticated2;
function getUserId(req) {
  return req.user?.claims?.sub ?? req.user?.id;
}
async function registerRoutes(app2) {
  if (process.env.AUTH_DOMAINS) {
    const { setupAuth: setupAuth2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    await setupAuth2(app2);
  } else {
    setupLocalAuth(app2);
  }
  app2.get("/api/auth/user", isAuthenticated3, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/dashboard/stats", isAuthenticated3, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/dashboard/activity", isAuthenticated3, async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
  app2.get("/api/students", isAuthenticated3, async (req, res) => {
    try {
      const students2 = await storage.getAllStudents();
      res.json(students2);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });
  app2.get("/api/students/:id", isAuthenticated3, async (req, res) => {
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
  app2.post("/api/students", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin" && user?.role !== "teacher") {
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
  app2.get("/api/attendance", isAuthenticated3, async (req, res) => {
    try {
      const date = req.query.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });
  app2.post("/api/attendance", isAuthenticated3, async (req, res) => {
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
        const insertMany = sqlite.transaction((items) => {
          for (const r of items) {
            stmt.run(r.studentId, r.attendanceDate, r.status, r.note || null, now);
          }
        });
        insertMany(records);
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      res.status(500).json({ message: "Failed to save attendance" });
    }
  });
  app2.put("/api/students/:id", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can update students" });
      }
      const student = await storage.updateStudent(parseInt(req.params.id), req.body);
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });
  app2.get("/api/levels", isAuthenticated3, async (req, res) => {
    try {
      const levels2 = await storage.getAllLevels();
      res.json(levels2);
    } catch (error) {
      console.error("Error fetching levels:", error);
      res.status(500).json({ message: "Failed to fetch levels" });
    }
  });
  app2.post("/api/levels", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin" && user?.role !== "teacher") {
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
  app2.put("/api/levels/:id", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin" && user?.role !== "teacher") {
        return res.status(403).json({ message: "Only admins and teachers can update levels" });
      }
      const validatedData = insertLevelSchema.parse(req.body);
      const level = await storage.updateLevel(parseInt(req.params.id), validatedData);
      res.json(level);
    } catch (error) {
      console.error("Error updating level:", error);
      res.status(500).json({ message: "Failed to update level" });
    }
  });
  app2.delete("/api/levels/:id", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete levels" });
      }
      const levelId = parseInt(req.params.id);
      if (Number.isNaN(levelId)) {
        return res.status(400).json({ message: "Invalid level id" });
      }
      const level = await storage.getLevel(levelId);
      if (!level) {
        return res.status(404).json({ message: "Level not found" });
      }
      const [studentsInLevel, subjectsInLevel] = await Promise.all([
        storage.getStudentsByLevel(levelId),
        storage.getSubjectsByLevel(levelId)
      ]);
      if (studentsInLevel.length > 0 || subjectsInLevel.length > 0) {
        if (!level.isActive) {
          return res.status(400).json({
            message: `Level cannot be permanently deleted while it still has linked records (${studentsInLevel.length} students, ${subjectsInLevel.length} subjects). Remove or reassign them first.`
          });
        }
        await storage.updateLevel(levelId, { isActive: false });
        return res.json({
          message: `Level archived because it still has linked records (${studentsInLevel.length} students, ${subjectsInLevel.length} subjects).`,
          action: "archived"
        });
      }
      await storage.deleteLevel(levelId);
      res.json({ message: "Level deleted successfully", action: "deleted" });
    } catch (error) {
      console.error("Error deleting level:", error);
      res.status(500).json({ message: "Failed to delete level" });
    }
  });
  app2.get("/api/subjects", isAuthenticated3, async (req, res) => {
    try {
      const subjects2 = await storage.getAllSubjects();
      res.json(subjects2);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });
  app2.get("/api/subjects/level/:levelId", isAuthenticated3, async (req, res) => {
    try {
      const subjects2 = await storage.getSubjectsByLevel(parseInt(req.params.levelId));
      res.json(subjects2);
    } catch (error) {
      console.error("Error fetching subjects by level:", error);
      res.status(500).json({ message: "Failed to fetch subjects by level" });
    }
  });
  app2.post("/api/subjects", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin" && user?.role !== "teacher") {
        return res.status(403).json({ message: "Only admins and teachers can create subjects" });
      }
      const validatedData = insertSubjectSchema.parse({
        ...req.body,
        createdById: getUserId(req)
      });
      const subject = await storage.createSubject(validatedData);
      res.status(201).json(subject);
    } catch (error) {
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
    }
  });
  app2.get("/api/subjects/:id", isAuthenticated3, async (req, res) => {
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
  app2.put("/api/subjects/:id", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin" && user?.role !== "teacher") {
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
  app2.get("/api/campuses", isAuthenticated3, async (req, res) => {
    try {
      const campuses2 = await storage.getAllCampuses();
      res.json(campuses2);
    } catch (error) {
      console.error("Error fetching campuses:", error);
      res.status(500).json({ message: "Failed to fetch campuses" });
    }
  });
  app2.post("/api/campuses", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin" && user?.role !== "teacher") {
        return res.status(403).json({ message: "Only admins and teachers can create campuses" });
      }
      const validated = insertCampusSchema.parse(req.body);
      const campus = await storage.createCampus(validated);
      res.status(201).json(campus);
    } catch (error) {
      console.error("Error creating campus:", error);
      res.status(500).json({ message: "Failed to create campus" });
    }
  });
  app2.get("/api/grades/student/:studentId", isAuthenticated3, async (req, res) => {
    try {
      const grades2 = await storage.getGradesByStudent(parseInt(req.params.studentId));
      res.json(grades2);
    } catch (error) {
      console.error("Error fetching grades by student:", error);
      res.status(500).json({ message: "Failed to fetch grades by student" });
    }
  });
  app2.get("/api/grades/subject/:subjectId", isAuthenticated3, async (req, res) => {
    try {
      const grades2 = await storage.getGradesBySubject(parseInt(req.params.subjectId));
      res.json(grades2);
    } catch (error) {
      console.error("Error fetching grades by subject:", error);
      res.status(500).json({ message: "Failed to fetch grades by subject" });
    }
  });
  app2.post("/api/grades", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin" && user?.role !== "teacher") {
        return res.status(403).json({ message: "Only admins and teachers can enter grades" });
      }
      const validatedData = insertGradeSchema.parse({
        ...req.body,
        enteredBy: getUserId(req)
      });
      const grade = await storage.createGrade(validatedData);
      res.status(201).json(grade);
    } catch (error) {
      console.error("Error creating grade:", error);
      res.status(500).json({ message: "Failed to create grade" });
    }
  });
  app2.get("/api/forums", isAuthenticated3, async (req, res) => {
    try {
      const forums2 = await storage.getAllForums();
      res.json(forums2);
    } catch (error) {
      console.error("Error fetching forums:", error);
      res.status(500).json({ message: "Failed to fetch forums" });
    }
  });
  app2.get("/api/forums/:id/posts", isAuthenticated3, async (req, res) => {
    try {
      const posts = await storage.getForumPosts(parseInt(req.params.id));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });
  app2.post("/api/forums", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin") {
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
  app2.post("/api/forums/:id/posts", isAuthenticated3, async (req, res) => {
    try {
      const validatedData = insertForumPostSchema.parse({
        ...req.body,
        forumId: parseInt(req.params.id),
        authorId: getUserId(req)
      });
      const post = await storage.createForumPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating forum post:", error);
      res.status(500).json({ message: "Failed to create forum post" });
    }
  });
  app2.post("/api/students/:id/progress", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin") {
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
  app2.get("/api/teachers", isAuthenticated3, async (req, res) => {
    try {
      const teachers2 = await storage.getAllTeachers();
      res.json(teachers2);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });
  app2.get("/api/teachers/:id", isAuthenticated3, async (req, res) => {
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
  app2.post("/api/teachers", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin") {
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
  app2.get("/api/teachers/:id/subjects", isAuthenticated3, async (req, res) => {
    try {
      const subjects2 = await storage.getTeacherSubjects(parseInt(req.params.id));
      res.json(subjects2);
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
      res.status(500).json({ message: "Failed to fetch teacher subjects" });
    }
  });
  app2.post("/api/teachers/:id/subjects", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin") {
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
  app2.put("/api/teachers/:id", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin") {
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
  app2.delete("/api/teachers/:id", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete teachers" });
      }
      await storage.deleteTeacher(parseInt(req.params.id));
      res.json({ message: "Teacher deleted successfully" });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      res.status(500).json({ message: "Failed to delete teacher" });
    }
  });
  app2.get("/api/teachers/:id/levels", isAuthenticated3, async (req, res) => {
    try {
      const levels2 = await storage.getTeacherLevels(parseInt(req.params.id));
      res.json(levels2);
    } catch (error) {
      console.error("Error fetching teacher levels:", error);
      res.status(500).json({ message: "Failed to fetch teacher levels" });
    }
  });
  app2.post("/api/teachers/:id/levels", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin") {
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
  app2.delete("/api/teachers/:id/levels/:levelId", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can remove level assignments" });
      }
      await storage.removeTeacherFromLevel(parseInt(req.params.id), parseInt(req.params.levelId));
      res.json({ message: "Teacher removed from level successfully" });
    } catch (error) {
      console.error("Error removing teacher from level:", error);
      res.status(500).json({ message: "Failed to remove teacher from level" });
    }
  });
  app2.get("/api/assessments", isAuthenticated3, async (req, res) => {
    try {
      const assessments2 = await storage.getAllAssessments();
      res.json(assessments2);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });
  app2.get("/api/assessments/subject/:subjectId", isAuthenticated3, async (req, res) => {
    try {
      const assessments2 = await storage.getAssessmentsBySubject(parseInt(req.params.subjectId));
      res.json(assessments2);
    } catch (error) {
      console.error("Error fetching assessments by subject:", error);
      res.status(500).json({ message: "Failed to fetch assessments by subject" });
    }
  });
  app2.post("/api/assessments", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin" && user?.role !== "teacher") {
        return res.status(403).json({ message: "Only admins and teachers can create assessments" });
      }
      const validatedData = insertAssessmentSchema.parse({
        ...req.body,
        createdById: getUserId(req)
      });
      const assessment = await storage.createAssessment(validatedData);
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });
  app2.get("/api/assessments/:id/results", isAuthenticated3, async (req, res) => {
    try {
      const results = await storage.getAssessmentResults(parseInt(req.params.id));
      res.json(results);
    } catch (error) {
      console.error("Error fetching assessment results:", error);
      res.status(500).json({ message: "Failed to fetch assessment results" });
    }
  });
  app2.post("/api/assessment-results", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin" && user?.role !== "teacher") {
        return res.status(403).json({ message: "Only admins and teachers can enter assessment results" });
      }
      const validatedData = insertAssessmentResultSchema.parse({
        ...req.body,
        enteredBy: getUserId(req)
      });
      const result = await storage.createAssessmentResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating assessment result:", error);
      res.status(500).json({ message: "Failed to create assessment result" });
    }
  });
  app2.put("/api/assessment-results/:id", isAuthenticated3, async (req, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (user?.role !== "admin" && user?.role !== "teacher") {
        return res.status(403).json({ message: "Only admins and teachers can update assessment results" });
      }
      const result = await storage.updateAssessmentResult(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error) {
      console.error("Error updating assessment result:", error);
      res.status(500).json({ message: "Failed to update assessment result" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_db();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
await ensureDbAndSeed();
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });
})();
