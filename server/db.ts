
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as schema from '@shared/schema';

// Exports used by the rest of the app
export let db: any = null;
export let sqlite: any = null;
export let pg: any = null;

/**
 * Ensure the database (SQLite in dev, Postgres in production) is initialized
 * and seeded with minimal demo data if empty. This function should be
 * called during server startup.
 */
export async function ensureDbAndSeed() {
  const isPostgres = !!process.env.DATABASE_URL;

  if (isPostgres) {
    // Postgres path
    const { default: postgres } = await import('postgres');
    const { drizzle: drizzlePg } = await import('drizzle-orm/postgres-js');
    const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
    pg = postgres(process.env.DATABASE_URL!, { ssl });
    db = drizzlePg(pg, { schema });
    console.log('✓ Database client initialized (Postgres)');

    try {
      console.log('Ensuring Postgres tables...');

      await pg`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        role TEXT NOT NULL DEFAULT 'student',
        campus_id INTEGER,
        created_at INTEGER,
        updated_at INTEGER
      );`;
      // Migration: add campus_id to existing users table
      try {
        await pg`ALTER TABLE users ADD COLUMN IF NOT EXISTS campus_id INTEGER`;
      } catch (e) { /* column may already exist */ }

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
							sort_order INTEGER NOT NULL DEFAULT 0,
							is_active BOOLEAN NOT NULL DEFAULT true,
							created_at INTEGER
						);`;

						// Migration: add sort_order to levels
						try {
							await pg`ALTER TABLE levels ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`;
						} catch (e) { /* column may already exist */ }

						await pg`CREATE TABLE IF NOT EXISTS students (
							id SERIAL PRIMARY KEY,
							student_number TEXT NOT NULL UNIQUE,
							user_id TEXT,
							campus_id INTEGER REFERENCES campuses(id),
							first_name TEXT NOT NULL,
							last_name TEXT NOT NULL,
							email TEXT NOT NULL UNIQUE,
							whatsapp_number TEXT,
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

						// Migration: add subject_id to attendance for per-subject attendance
						try {
							await pg`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS subject_id INTEGER`;
						} catch (e) { /* column may already exist */ }

						// Migration: add whatsapp_number to students
						try {
							await pg`ALTER TABLE students ADD COLUMN IF NOT EXISTS whatsapp_number TEXT`;
						} catch (e) { /* column may already exist */ }

						// Other tables (subjects, teachers, assessments, grades, forums, etc.)
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
						)`;

						await pg`CREATE TABLE IF NOT EXISTS fee_configs (
							id SERIAL PRIMARY KEY,
							campus_id INTEGER REFERENCES campuses(id),
							base_fee REAL NOT NULL,
							billing_period TEXT NOT NULL DEFAULT 'month',
							effective_from TEXT NOT NULL,
							created_by_id TEXT,
							created_at INTEGER
						)`;

						await pg`CREATE TABLE IF NOT EXISTS payments (
							id SERIAL PRIMARY KEY,
							student_id INTEGER NOT NULL REFERENCES students(id),
							campus_id INTEGER REFERENCES campuses(id),
							fee_config_id INTEGER REFERENCES fee_configs(id),
							billing_period TEXT NOT NULL,
							period_label TEXT NOT NULL,
							amount_due REAL NOT NULL,
							amount_paid REAL NOT NULL DEFAULT 0,
							status TEXT NOT NULL DEFAULT 'unpaid',
							due_date TEXT NOT NULL,
							paid_date TEXT,
							notes TEXT,
							recorded_by_id TEXT,
							created_at INTEGER,
							updated_at INTEGER
						)`;

						// Seed users
						const usersCountRow = await pg`SELECT count(*) AS count FROM users`;
						const usersCount = Number(usersCountRow?.[0]?.count ?? 0);
						if (usersCount === 0) {
							console.log('Seeding default users (Postgres)...');
							const now = Date.now();
							const adminPassword = await bcrypt.hash('admin123', 10);
							const teacherPassword = await bcrypt.hash('teacher123', 10);
					await pg`INSERT INTO users (id, email, password, first_name, last_name, role, campus_id, created_at, updated_at) VALUES (${randomUUID()}, ${'admin@school.com'}, ${adminPassword}, ${'Admin'}, ${'User'}, ${'superadmin'}, ${null}, ${now}, ${now})`;
							const teacherUserId = randomUUID();
							await pg`INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES (${teacherUserId}, ${'teacher@school.com'}, ${teacherPassword}, ${'Demo'}, ${'Teacher'}, ${'teacher'}, ${now}, ${now})`;
							// Seed demo level
							const levelRows = await pg`INSERT INTO levels (name, description, duration_months, is_active, created_at) VALUES (${'Level 1'}, ${'Foundation level'}, ${6}, ${true}, ${now}) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`;
							const levelId = levelRows[0].id;
							// Seed teacher profile
							const teacherRows = await pg`INSERT INTO teachers (user_id, first_name, last_name, email, employment_date, status, created_at) VALUES (${teacherUserId}, ${'Demo'}, ${'Teacher'}, ${'teacher@school.com'}, ${new Date().toISOString().split('T')[0]}, ${'active'}, ${now}) RETURNING id`;
							const teacherId = teacherRows[0].id;
							// Assign teacher to level
							await pg`INSERT INTO teacher_levels (teacher_id, level_id, assigned_date, is_active, created_at) VALUES (${teacherId}, ${levelId}, ${new Date().toISOString().split('T')[0]}, ${true}, ${now})`;
							console.log('Default users seeded: admin@school.com/admin123, teacher@school.com/teacher123');
						} else {
							console.log(`Users table already has ${usersCount} rows, skipping seed.`);
						}

						// Migrate: ensure admin is superadmin and finance user exists
						try {
							await pg`UPDATE users SET role='superadmin' WHERE email='admin@school.com' AND role='admin'`;
							const financeRows = await pg`SELECT id FROM users WHERE email='finance@school.com'`;
							if (financeRows.length === 0) {
								const financePassword = await bcrypt.hash('finance123', 10);
								const now = Date.now();
								await pg`INSERT INTO users (id, email, password, first_name, last_name, role, campus_id, created_at, updated_at) VALUES (${randomUUID()}, ${'finance@school.com'}, ${financePassword}, ${'Finance'}, ${'User'}, ${'finance'}, ${null}, ${now}, ${now})`;
								console.log('Migration: finance@school.com / finance123 created');
							}
						} catch (e) {
							console.error('Migration error (finance user):', e);
						}

						// Seed campuses
						const campusCountRow = await pg`SELECT count(*) AS count FROM campuses`;
						const campusCount = Number(campusCountRow?.[0]?.count ?? 0);
						if (campusCount === 0) {
							console.log('Seeding sample campuses (Postgres)...');
							const now = Date.now();
					await pg`INSERT INTO campuses (name, code, address, is_active, created_at) VALUES (${ 'PE Campus' }, ${ 'PE' }, ${ 'Port Elizabeth' }, ${ true }, ${ now })`;
					await pg`INSERT INTO campuses (name, code, address, is_active, created_at) VALUES (${ 'CPT Campus' }, ${ 'CPT' }, ${ 'Cape Town' }, ${ true }, ${ now })`;
					console.log('Campuses created: PE Campus, CPT Campus');
						} else {
							console.log(`Campuses table already has ${campusCount} rows, skipping campus seed.`);
						}

						// Migrate: rename old campus names to PE/CPT
						try {
							await pg`UPDATE campuses SET name='PE Campus', code='PE', address='Port Elizabeth' WHERE code='MAIN' OR name='Main Campus'`;
							await pg`UPDATE campuses SET name='CPT Campus', code='CPT', address='Cape Town' WHERE code='NORT' OR name='North Campus'`;
						} catch (e) { /* ignore */ }

						// Seed students
						const studentsCountRow = await pg`SELECT count(*) AS count FROM students`;
						const studentsCount = Number(studentsCountRow?.[0]?.count ?? 0);
						if (studentsCount === 0) {
							console.log('Seeding sample students (Postgres)...');
							const now = Date.now();
							const year = new Date().getFullYear();
							await pg`INSERT INTO students (student_number, user_id, first_name, last_name, email, current_level_id, enrollment_date, status, created_at) VALUES (${ `STU-${year}-001` }, ${ null }, ${ 'Alice' }, ${ 'Anderson' }, ${ 'alice@example.com' }, ${ null }, ${ new Date().toISOString().split('T')[0] }, ${ 'active' }, ${ now })`;
							await pg`INSERT INTO students (student_number, user_id, first_name, last_name, email, current_level_id, enrollment_date, status, created_at) VALUES (${ `STU-${year}-002` }, ${ null }, ${ 'Bob' }, ${ 'Brown' }, ${ 'bob@example.com' }, ${ null }, ${ new Date().toISOString().split('T')[0] }, ${ 'active' }, ${ now })`;
							console.log('Sample students created: alice@example.com, bob@example.com');
						} else {
							console.log(`Students table already has ${studentsCount} rows, skipping student seed.`);
						}

					} catch (err) {
						console.error('Error ensuring Postgres tables:', err);
						throw err;
					}

					return;
				}

				// SQLite path (development)
				const BetterSqlite3 = (await import('better-sqlite3')).default;
				sqlite = new BetterSqlite3('./school.db');
				// enable WAL for concurrency
				try {
					sqlite.pragma('journal_mode = WAL');
				} catch (e) {
					/* ignore */
				}
				const { drizzle } = await import('drizzle-orm/better-sqlite3');
				db = drizzle(sqlite, { schema });
				console.log('✓ Database client initialized (SQLite)');

				// Create users table (required for seeding)
				const createUsersSQL = `
					CREATE TABLE IF NOT EXISTS users (
						id TEXT PRIMARY KEY,
						email TEXT UNIQUE,
						password TEXT,
						first_name TEXT,
						last_name TEXT,
						profile_image_url TEXT,
						role TEXT NOT NULL DEFAULT 'student',
						campus_id INTEGER,
						created_at INTEGER,
						updated_at INTEGER
					);
				`;
				sqlite.exec(createUsersSQL);
				// Migration: add campus_id to existing users table
				try {
					const userCols = sqlite.prepare("PRAGMA table_info('users')").all();
					if (!userCols.some((c: any) => c.name === 'campus_id')) {
						sqlite.exec('ALTER TABLE users ADD COLUMN campus_id INTEGER;');
						console.log('Migrated users table: added campus_id column');
					}
				} catch (e) { /* ignore */ }

				const createLevelsSQL = `
					CREATE TABLE IF NOT EXISTS levels (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						name TEXT NOT NULL UNIQUE,
						description TEXT,
						duration_months INTEGER NOT NULL DEFAULT 6,
						sort_order INTEGER NOT NULL DEFAULT 0,
						is_active INTEGER NOT NULL DEFAULT 1,
						created_at INTEGER
					);
				`;
				sqlite.exec(createLevelsSQL);
				// Migration: add sort_order to existing levels table
				try {
					const lvlCols = sqlite.prepare("PRAGMA table_info('levels')").all();
					if (!lvlCols.some((c: any) => c.name === 'sort_order')) {
						sqlite.exec('ALTER TABLE levels ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;');
						console.log('Migrated levels table: added sort_order column');
					}
				} catch (e) { /* ignore */ }

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
						whatsapp_number TEXT,
						current_level_id INTEGER,
						enrollment_date TEXT NOT NULL,
						status TEXT NOT NULL DEFAULT 'active',
						created_at INTEGER
					);
				`;
				sqlite.exec(createStudentsSQL);
				// Migration: add whatsapp_number to existing students table
				try {
					const stuCols = sqlite.prepare("PRAGMA table_info('students')").all();
					if (!stuCols.some((c: any) => c.name === 'whatsapp_number')) {
						sqlite.exec('ALTER TABLE students ADD COLUMN whatsapp_number TEXT;');
						console.log('Migrated students table: added whatsapp_number column');
					}
				} catch (e) { /* ignore */ }

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
				// Migration: add subject_id to attendance for per-subject attendance
				try {
					const attCols = sqlite.prepare("PRAGMA table_info('attendance')").all();
					if (!attCols.some((c: any) => c.name === 'subject_id')) {
						sqlite.exec('ALTER TABLE attendance ADD COLUMN subject_id INTEGER;');
						console.log('Migrated attendance table: added subject_id column');
					}
				} catch (e) { /* ignore */ }

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

				// Add specialties column if it doesn't exist (migration for existing DBs)
				try {
					const checkColumn = sqlite.prepare("PRAGMA table_info(teachers)").all();
					if (!checkColumn.some((col: any) => col.name === 'specialties')) {
						sqlite.exec("ALTER TABLE teachers ADD COLUMN specialties TEXT;");
					}
				} catch (e) {
					/* ignore */
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

				// Finance tables
				sqlite.exec(`
					CREATE TABLE IF NOT EXISTS fee_configs (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						campus_id INTEGER REFERENCES campuses(id),
						base_fee REAL NOT NULL,
						billing_period TEXT NOT NULL DEFAULT 'month',
						effective_from TEXT NOT NULL,
						created_by_id TEXT,
						created_at INTEGER
					);
				`);
				sqlite.exec(`
					CREATE TABLE IF NOT EXISTS payments (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						student_id INTEGER NOT NULL REFERENCES students(id),
						campus_id INTEGER REFERENCES campuses(id),
						fee_config_id INTEGER REFERENCES fee_configs(id),
						billing_period TEXT NOT NULL,
						period_label TEXT NOT NULL,
						amount_due REAL NOT NULL,
						amount_paid REAL NOT NULL DEFAULT 0,
						status TEXT NOT NULL DEFAULT 'unpaid',
						due_date TEXT NOT NULL,
						paid_date TEXT,
						notes TEXT,
						recorded_by_id TEXT,
						created_at INTEGER,
						updated_at INTEGER
					);
				`);

				// Lightweight migration: ensure students has campus_id column (for older DBs)
				try {
					const info = sqlite.prepare("PRAGMA table_info('students')").all();
					const hasCampus = info.some((c: any) => c.name === 'campus_id');
					if (!hasCampus) {
						try {
							sqlite.exec('ALTER TABLE students ADD COLUMN campus_id INTEGER;');
							console.log('Migrated students table: added campus_id column');
						} catch (e) {
							// ALTER TABLE may fail on some older DBs; ignore and continue
							console.warn('Could not ALTER students table to add campus_id:', e);
						}
					}
				} catch (e) {
					/* ignore */
				}

				// Migration: rename old campus names to PE/CPT and add campus_id to users
				try {
					sqlite.prepare("UPDATE campuses SET name='PE Campus', code='PE', address='Port Elizabeth' WHERE code='MAIN' OR name='Main Campus'").run();
					sqlite.prepare("UPDATE campuses SET name='CPT Campus', code='CPT', address='Cape Town' WHERE code='NORT' OR name='North Campus'").run();
					// Upgrade existing admin@school.com to superadmin
					sqlite.prepare("UPDATE users SET role='superadmin' WHERE email='admin@school.com' AND role='admin'").run();

					// Seed finance user if missing
					const financeRow: any = sqlite.prepare("SELECT id FROM users WHERE email='finance@school.com'").get();
					if (!financeRow) {
						const financePass = await bcrypt.hash('finance123', 10);
						const now2 = Date.now();
						sqlite.prepare(
							`INSERT INTO users (id, email, password, first_name, last_name, role, campus_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
						).run(randomUUID(), 'finance@school.com', financePass, 'Finance', 'User', 'finance', null, now2, now2);
						console.log('Migration: finance@school.com / finance123 created');
					}

					console.log('Migration: campuses renamed to PE/CPT; admin upgraded to superadmin');
				} catch (e) {
					/* ignore */
				}

				// Seed users
				try {
					const row: any = sqlite.prepare('SELECT count(*) as count FROM users').get();
					const count = row?.count ?? 0;
					if (count === 0) {
						console.log('Seeding default users...');
						const now = Date.now();
						const adminPassword = await bcrypt.hash('admin123', 10);
						const userPassword = await bcrypt.hash('user123', 10);
						const insert = sqlite.prepare(
							`INSERT INTO users (id, email, password, first_name, last_name, role, campus_id, created_at, updated_at)
							 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
						);
					const financePassword = await bcrypt.hash('finance123', 10);
					insert.run(randomUUID(), 'admin@school.com', adminPassword, 'Admin', 'User', 'superadmin', null, now, now);
					insert.run(randomUUID(), 'user@school.com', userPassword, 'Normal', 'User', 'teacher', null, now, now);
					insert.run(randomUUID(), 'finance@school.com', financePassword, 'Finance', 'User', 'finance', null, now, now);
					console.log('Default superadmin created: admin@school.com / admin123, teacher: user@school.com / user123, finance: finance@school.com / finance123');
					} else {
						console.log(`Users table already has ${count} rows, skipping seed.`);
					}
				} catch (err) {
					console.error('Error during users seeding:', err);
				}

				// Seed campuses
				try {
					const campusCountRow: any = sqlite.prepare('SELECT count(*) as count FROM campuses').get();
					const campusCount = campusCountRow?.count ?? 0;
					if (campusCount === 0) {
						console.log('Seeding sample campuses...');
						const insertCampus = sqlite.prepare(`INSERT INTO campuses (name, code, address, is_active, created_at) VALUES (?, ?, ?, ?, ?)`);
						const now = Date.now();
					insertCampus.run('PE Campus', 'PE', 'Port Elizabeth', 1, now);
					insertCampus.run('CPT Campus', 'CPT', 'Cape Town', 1, now);
					console.log('Campuses created: PE Campus, CPT Campus');
					} else {
						console.log(`Campuses table already has ${campusCount} rows, skipping campus seed.`);
					}
				} catch (err) {
					console.error('Error during campuses seeding:', err);
				}

				// Seed students
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