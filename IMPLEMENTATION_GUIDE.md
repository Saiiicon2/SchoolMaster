# Institute Management System - Implementation Guide

## Overview

This is a comprehensive institute (school/campus) management system built with React, Express, PostgreSQL, and Drizzle ORM. The system supports three user roles with distinct permissions and features:

- **Admin**: Full system access, manages all aspects
- **Teacher**: Can manage students, subjects, levels, and enter grades/assessment results
- **Student**: View-only access to their own information, grades, and assessment results

## System Architecture

### Database Schema

#### Core Tables

1. **users** - Authentication and user management
   - id (Primary Key)
   - email (unique)
   - firstName, lastName
   - profileImageUrl
   - role (admin, teacher, student)
   - timestamps

2. **students** - Student enrollment data
   - id (Primary Key)
   - studentNumber (unique, auto-generated as STU-YYYY-###)
   - userId (references users, optional)
   - firstName, lastName, email (unique)
   - currentLevelId (references levels)
   - enrollmentDate
   - status (active, graduated, suspended)
   - timestamps

3. **teachers** - Teacher information
   - id (Primary Key)
   - userId (references users, unique)
   - firstName, lastName, email (unique)
   - employmentDate
   - status (active, inactive)
   - timestamps

4. **levels** - Educational levels/grades
   - id (Primary Key)
   - name (unique, e.g., "Level 1", "Level 2")
   - description (optional)
   - durationMonths
   - isActive (boolean)
   - timestamps

5. **subjects** - Courses/subjects
   - id (Primary Key)
   - name
   - description
   - levelId (references levels)
   - createdById (references users - who created it)
   - isActive (boolean)
   - timestamps

6. **teacherSubjects** - Subject-Teacher assignments
   - id (Primary Key)
   - teacherId (references teachers)
   - subjectId (references subjects)
   - assignedDate
   - isActive (boolean)
   - timestamps

7. **assessments** - Tests, exams, and assignments
   - id (Primary Key)
   - subjectId (references subjects)
   - title
   - type (test, exam, continuous, assignment)
   - description
   - totalMarks
   - assessmentDate
   - createdById (references users)
   - timestamps

8. **assessmentResults** - Student scores on assessments
   - id (Primary Key)
   - assessmentId (references assessments)
   - studentId (references students)
   - score
   - enteredBy (references users)
   - enteredAt
   - comments

9. **grades** - Legacy grade system
   - id (Primary Key)
   - studentId (references students)
   - subjectId (references subjects)
   - score
   - maxScore (default 100)
   - enteredBy (references users)
   - enteredAt
   - comments

10. **levelProgressions** - Student progression tracking
    - id (Primary Key)
    - studentId (references students)
    - fromLevelId, toLevelId (references levels)
    - progressionDate
    - completedAt

11. **forums** - Discussion forums
    - id (Primary Key)
    - name, description
    - type (general or subject)
    - subjectId (optional, references subjects)
    - isActive
    - timestamps

12. **forumPosts** - Forum discussion posts
    - id (Primary Key)
    - forumId (references forums)
    - authorId (references users)
    - title, content
    - timestamps

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user info
- `GET /api/login` - Login endpoint
- `GET /api/logout` - Logout endpoint

### Students
- `GET /api/students` - Get all students (Admin/Teacher only)
- `GET /api/students/:id` - Get specific student
- `POST /api/students` - Create student (Admin/Teacher only)
- `PUT /api/students/:id` - Update student (Admin only)

### Teachers
- `GET /api/teachers` - Get all teachers (Admin/Teacher only)
- `GET /api/teachers/:id` - Get specific teacher
- `POST /api/teachers` - Create teacher (Admin only)
- `GET /api/teachers/:id/subjects` - Get teacher's assigned subjects
- `POST /api/teachers/:id/subjects` - Assign subject to teacher (Admin only)

### Levels
- `GET /api/levels` - Get all levels
- `POST /api/levels` - Create level (Admin/Teacher only)

### Subjects
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/level/:levelId` - Get subjects for a level
- `POST /api/subjects` - Create subject (Admin/Teacher only)

### Assessments
- `GET /api/assessments` - Get all assessments
- `GET /api/assessments/subject/:subjectId` - Get assessments for a subject
- `POST /api/assessments` - Create assessment (Admin/Teacher only)
- `GET /api/assessments/:id/results` - Get results for an assessment
- `POST /api/assessment-results` - Add assessment score (Admin/Teacher only)
- `PUT /api/assessment-results/:id` - Update assessment score (Admin/Teacher only)

### Grades (Legacy)
- `GET /api/grades/student/:studentId` - Get student's grades
- `GET /api/grades/subject/:subjectId` - Get grades for a subject
- `POST /api/grades` - Enter grade (Admin/Teacher only)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity

### Forums
- `GET /api/forums` - Get all forums
- `GET /api/forums/:id/posts` - Get forum posts
- `POST /api/forums` - Create forum (Admin only)
- `POST /api/forums/:id/posts` - Create forum post (Any user)

## User Roles & Permissions

### Admin Role
**Full System Access**
- Create and manage teachers
- Register students
- Create levels
- Create subjects
- Enter and manage grades/assessments
- Assign teachers to subjects
- Progress students to new levels
- Create forums
- View all data

**UI Access**: Dashboard, Students, Teachers, Levels, Subjects, Grades & Assessments, Forums

### Teacher Role
**Limited Management Access**
- View and manage students in their classes
- Create subjects (for assigned levels)
- Create and manage assessments/exams for their subjects
- Enter and modify assessment results
- View student grades and progress
- Create forum posts
- Limited level management

**UI Access**: Dashboard, Students, Subjects, Grades & Assessments, Forums
(No Teachers management - that's admin-only)

**View Mode Available**: Can switch to Student view to see student perspective

### Student Role
**View-Only Access**
- View own student information
- View own student number and enrollment level
- View own grades and assessment results
- View subject listings (read-only)
- Participate in forums (view and post)

**UI Access**: Dashboard (student view only), My Subjects (read-only), My Grades (read-only), Forums
**Blocked Pages**: Students, Levels, Subjects (management), Teachers

**Redirect Protection**: Students are redirected from admin-only pages to dashboard

## Key Features Implemented

### 1. Student Management
- Auto-generated unique student numbers (format: STU-YYYY-###)
- Enrollment date tracking
- Student status management (active, graduated, suspended)
- Student-to-level assignment
- Search and filter students

### 2. Teacher Management
- Teacher registration with employment dates
- Teacher status management
- Subject assignment to teachers
- Teacher-specific access controls

### 3. Assessment System
- Multiple assessment types: Tests, Exams, Continuous, Assignments
- Assessment date tracking
- Total marks configuration
- Score entry and tracking
- Comments on assessments
- Per-subject assessment listing

### 4. Grades Management
- Traditional grade entry system
- Subject-specific grading
- Grade tracking with max score
- Grade entry by admin/teacher with timestamp
- Separate from assessments (supports both systems)

### 5. Level/Class Management
- Multiple education levels
- Duration configuration
- Active/inactive status
- Student level progression
- Subject-to-level mapping

### 6. Subject Management
- Subjects linked to specific levels
- Subject descriptions
- Creator tracking (who created the subject)
- Subject status management

### 7. Role-Based Access Control
- Three-tier permission system
- Frontend route protection and redirects
- Backend API permission checks
- Sidebar menu customization per role
- Role switcher for Admin (to preview student/teacher views)

### 8. Forums
- General forums and subject-specific forums
- Forum post creation and reading
- Author tracking
- Forum post management

### 9. Dashboard
- Dashboard statistics (students, subjects, levels, average grades)
- Recent activity feed (enrollments, grade entries)
- Adaptive dashboard based on user role
- Quick action cards

## Role Switching

**Admin Users**: Can switch between Admin View, Teacher View, and Student View using the sidebar toggle
- This allows admins to test and understand different user experiences
- Does NOT change actual permissions - it's just UI
- All data access is still controlled by backend permissions

## Student Number Generation

Student numbers are automatically generated when creating a student:
- Format: `STU-{YEAR}-{SEQUENTIAL_NUMBER}`
- Example: `STU-2026-001`, `STU-2026-002`
- The number includes the current year and a zero-padded sequential counter
- Unique constraint ensures no duplicates

## Frontend Components

### Pages
- **Dashboard**: Role-adaptive main page with statistics
- **Students**: List, search, and add students (Admin/Teacher only)
- **Teachers**: List and add teachers (Admin only)
- **Levels**: Manage educational levels (Admin/Teacher only)
- **Subjects**: Manage subjects (Admin/Teacher only)
- **Grades & Assessments**: Create/view assessments, enter scores
- **Forums**: Forum listings and discussions

### Modals
- **Add Student Modal**: For registering new students
- **Add Level Modal**: For creating new educational levels
- **Add Subject Modal**: For creating subjects
- **Create Assessment Dialog**: In Grades page for creating assessments
- **Add Score Dialog**: In Grades page for adding assessment results

### Layout Components
- **Sidebar**: Navigation with role-based menu items
- **TopBar**: Page header with title and subtitle
- **Card, Button, Input**: UI components from shadcn/ui
- **Tabs**: For organizing content in Grades page

## Technology Stack

### Frontend
- React 18 with TypeScript
- Wouter (lightweight routing)
- TanStack React Query (data management)
- React Hook Form (form handling)
- Zod (schema validation)
- Shadcn/ui (UI components)
- Tailwind CSS (styling)
- Lucide React (icons)

### Backend
- Express.js
- Drizzle ORM
- PostgreSQL
- External Auth (authentication)
- TypeScript

### Database
- PostgreSQL with Drizzle ORM
- Fully typed database queries
- Relations configured for efficient joins

## Validation

All inputs are validated using Zod schemas:
- Frontend: Form validation before submission
- Backend: Request body validation
- Database: Constraints and relationships

## Error Handling

- User-friendly error toasts for failed operations
- Automatic logout and redirect on auth errors
- Unauthorized access prevention
- Try-catch blocks on all API operations

## Future Enhancement Opportunities

1. **Teacher-Subject Assignment**: Create UI for admins to assign teachers to subjects
2. **Advanced Analytics**: Grade distribution charts, student performance trends
3. **Attendance Tracking**: Attendance records per student
4. **Timetable Management**: Class schedules and timetables
5. **Parent Portal**: Parents can view their child's grades
6. **Email Notifications**: Grade notifications, announcements
7. **Certificate Generation**: Auto-generate completion certificates
8. **Bulk Operations**: Bulk student import/export, bulk grading
9. **File Uploads**: Assignment submissions, document storage
10. **Payment/Fee Management**: Tuition fee tracking

## Deployment Considerations

1. **Environment Variables**: Configure database connection, auth tokens
2. **Database Migrations**: Run Drizzle migrations: `npm run db:push`
3. **Build**: Build frontend: `npm run build`
4. **Start**: Start server: `npm start` (production) or `npm run dev` (development)
5. **HTTPS**: Ensure HTTPS in production
6. **CORS**: Configure CORS for frontend domain

## Security Notes

- Authentication handled by external OIDC provider
- Role-based access control on all endpoints
- Input validation and sanitization
- SQL injection protection via Drizzle ORM
- CSRF tokens handled by session middleware
- Never expose sensitive data in logs

## Database Relationships

```
users (1) ←→ (many) students
users (1) ←→ (many) teachers
users (1) ←→ (many) grades
users (1) ←→ (many) forumPosts

levels (1) ←→ (many) students
levels (1) ←→ (many) subjects
levels (1) ←→ (many) levelProgressions

subjects (1) ←→ (many) grades
subjects (1) ←→ (many) assessments
subjects (1) ←→ (many) teacherSubjects
subjects (1) ←→ (many) forums

teachers (1) ←→ (many) teacherSubjects

assessments (1) ←→ (many) assessmentResults

students (1) ←→ (many) grades
students (1) ←→ (many) assessmentResults
students (1) ←→ (many) levelProgressions

forums (1) ←→ (many) forumPosts
```

---

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables
3. Push database schema: `npm run db:push`
4. Run development server: `npm run dev`
5. Access at http://localhost:5000

---

**Last Updated**: January 2026
**System Version**: 1.0.0
