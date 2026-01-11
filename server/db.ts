import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@shared/schema';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// ✅ Create SQLite database for local development
// When deploying to a hosted environment, update this to use postgres
export const sqlite = new Database('./school.db');
sqlite.pragma('journal_mode = WAL');

// Create Drizzle DB client with schema
export const db = drizzle(sqlite, { schema });

console.log('✓ Database client initialized (SQLite)');

// Ensure minimal tables exist and seed default users if needed
export async function ensureDbAndSeed() {
	// Create a minimal users table if it doesn't exist. This keeps startup simple
	// and is focused on local development seeding for authentication.
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

	// Create levels table used by the application
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

	// Create campuses table
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

	// Create students table
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

	// Ensure `campus_id` column exists on students table (handles older DB files)
	try {
		const cols = sqlite.prepare("PRAGMA table_info(students)").all();
		const hasCampusId = cols.some((c: any) => c.name === 'campus_id');
		if (!hasCampusId) {
			console.log('Adding missing column `campus_id` to students table');
			sqlite.exec('ALTER TABLE students ADD COLUMN campus_id INTEGER');
		}
	} catch (err) {
		console.error('Error ensuring campus_id column on students table:', err);
	}

	// Create attendance table for daily attendance records
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

	// Create other application tables used in local development
	// Students table created earlier; skip duplicate creation here.

	const createSubjectsSQL = `
		CREATE TABLE IF NOT EXISTS subjects (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			description TEXT,
			level_id INTEGER NOT NULL,
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
			status TEXT NOT NULL DEFAULT 'active',
			created_at INTEGER
		);
	`;

	sqlite.exec(createTeachersSQL);

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

	const row: any = sqlite.prepare('SELECT count(*) as count FROM users').get();
	const count = row?.count ?? 0;

	if (count === 0) {
		console.log('Seeding default users...');
		const now = Date.now();

		const adminPassword = await bcrypt.hash('admin123', 10);
		const userPassword = await bcrypt.hash('user123', 10);

		const insert = sqlite.prepare(
			`INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		);

		insert.run(randomUUID(), 'admin@school.com', adminPassword, 'Admin', 'User', 'admin', now, now);
		insert.run(randomUUID(), 'user@school.com', userPassword, 'Normal', 'User', 'teacher', now, now);

		console.log('Default admin and non-admin users created: admin@school.com / admin123, user@school.com / user123');
	} else {
		console.log(`Users table already has ${count} rows, skipping seed.`);
	}

	// Seed sample campuses if none exist
	try {
		const campusCountRow: any = sqlite.prepare('SELECT count(*) as count FROM campuses').get();
		const campusCount = campusCountRow?.count ?? 0;
		if (campusCount === 0) {
			console.log('Seeding sample campuses...');
			const insertCampus = sqlite.prepare(`INSERT INTO campuses (name, code, address, is_active, created_at) VALUES (?, ?, ?, ?, ?)`);
			const now = Date.now();
			insertCampus.run('Main Campus', 'MAIN', '123 Main St', 1, now);
			insertCampus.run('North Campus', 'NORT', '456 North Ave', 1, now);
			console.log('Sample campuses created: Main Campus, North Campus');
		} else {
			console.log(`Campuses table already has ${campusCount} rows, skipping campus seed.`);
		}
	} catch (err) {
		console.error('Error during campuses seeding:', err);
	}

	// Seed sample students if none exist
	try {
		const studentsCountRow: any = sqlite.prepare("SELECT count(*) as count FROM students").get();
		const studentsCount = studentsCountRow?.count ?? 0;
		if (studentsCount === 0) {
			console.log('Seeding sample students...');
			const now = Date.now();
			const year = new Date().getFullYear();
			const insertStudent = sqlite.prepare(`
				INSERT INTO students (student_number, user_id, first_name, last_name, email, current_level_id, enrollment_date, status, created_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`);

			insertStudent.run(`STU-${year}-001`, null, 'Alice', 'Anderson', 'alice@example.com', null, new Date().toISOString().split('T')[0], 'active', now);
			insertStudent.run(`STU-${year}-002`, null, 'Bob', 'Brown', 'bob@example.com', null, new Date().toISOString().split('T')[0], 'active', now);

			console.log('Sample students created: alice@example.com, bob@example.com');

			// Seed a sample attendance record for Alice (present today)
			const studentRow: any = sqlite.prepare("SELECT id FROM students WHERE email = ?").get('alice@example.com');
			if (studentRow) {
				const insertAttendance = sqlite.prepare(`INSERT INTO attendance (student_id, attendance_date, status, note, created_at) VALUES (?, ?, ?, ?, ?)`);
				insertAttendance.run(studentRow.id, new Date().toISOString().split('T')[0], 'present', 'On time', now);
				console.log('Sample attendance added for alice@example.com');
			}
		} else {
			console.log(`Students table already has ${studentsCount} rows, skipping student seed.`);
		}
	} catch (err) {
		console.error('Error during students seeding:', err);
	}
}