# Quick Reference Guide

## User Roles at a Glance

### 🔑 Admin
- **Full access** to everything
- Manage teachers, students, levels, subjects
- Create assessments and enter grades
- View all system data

### 👨‍🏫 Teacher
- Manage **own students and subjects**
- Create **assessments and tests**
- **Enter grades/marks** for students
- View student progress
- **Cannot manage** other teachers

### 👨‍🎓 Student
- **View only** own grades and marks
- View **own student number** and level
- View **own assessment results**
- Participate in forums
- **Cannot access** management pages

---

## API Quick Reference

### Students (Admin/Teacher can create, all can view)
```bash
POST /api/students                  # Create student
GET /api/students                   # List all students  
GET /api/students/:id              # Get specific student
PUT /api/students/:id              # Update student (admin only)
```

### Teachers (Admin only)
```bash
POST /api/teachers                 # Create teacher
GET /api/teachers                  # List all teachers
GET /api/teachers/:id              # Get specific teacher
POST /api/teachers/:id/subjects    # Assign subject to teacher
GET /api/teachers/:id/subjects     # Get teacher's subjects
```

### Levels (Admin/Teacher can create)
```bash
POST /api/levels                   # Create level
GET /api/levels                    # List all levels
```

### Subjects (Admin/Teacher can create)
```bash
POST /api/subjects                 # Create subject
GET /api/subjects                  # List all subjects
GET /api/subjects/level/:levelId   # Get level's subjects
```

### Assessments (Admin/Teacher can create/grade)
```bash
POST /api/assessments                      # Create assessment
GET /api/assessments                       # List all assessments
GET /api/assessments/subject/:subjectId    # Get subject's assessments
GET /api/assessments/:id/results          # Get assessment results
POST /api/assessment-results              # Add score
PUT /api/assessment-results/:id           # Update score
```

### Grades (Legacy system)
```bash
POST /api/grades                   # Enter grade
GET /api/grades/student/:studentId # Get student's grades
GET /api/grades/subject/:subjectId # Get subject's grades
```

---

## Creating Data: Step by Step

### Create a Level
1. Admin logs in
2. Go to Levels page
3. Click "Add Level"
4. Enter name (e.g., "Level 1")
5. Set duration (months)
6. Click Create

### Create a Subject
1. Admin/Teacher logs in
2. Go to Subjects page
3. Click "Add Subject"
4. Select level (from dropdown)
5. Enter name and description
6. Click Create

### Register a Student
1. Admin/Teacher logs in
2. Go to Students page
3. Click "Add Student"
4. Enter first name, last name, email
5. Select level
6. Set enrollment date
7. Click Create → **Student number auto-generated** (e.g., STU-2026-001)

### Create an Assessment
1. Teacher/Admin logs in
2. Go to Grades & Assessments
3. Click "Create Assessment"
4. Fill in:
   - Title (e.g., "Midterm Exam")
   - Type (Test, Exam, Continuous, Assignment)
   - Subject
   - Total marks
   - Date
5. Click Create

### Enter Assessment Score
1. Teacher/Admin in Grades page
2. Click "Add Score"
3. Select assessment, student, and score
4. Add comments (optional)
5. Click Save

---

## Frontend Component Tree

```
App
├── Router
│   ├── Landing (unauthenticated)
│   ├── Dashboard (all roles)
│   ├── Students (admin/teacher)
│   ├── Teachers (admin only)
│   ├── Levels (admin/teacher)
│   ├── Subjects (admin/teacher)
│   ├── Grades (all roles, different view)
│   ├── Forums (all roles)
│   └── NotFound
└── Sidebar (all pages)
    └── Navigation (role-based)
```

---

## Database Schema Quick Look

```
users ← → students
      ← → teachers
      ← → grades
      ← → forumPosts

levels ← → subjects
       ← → students

subjects ← → grades
         ← → assessments
         ← → teacherSubjects

teachers ← → teacherSubjects

assessments ← → assessmentResults
```

---

## Common Tasks

### Find a Student's Grades
```
GET /api/grades/student/:studentId
```

### Get All Assessments for a Subject
```
GET /api/assessments/subject/:subjectId
```

### Check a Teacher's Assigned Subjects
```
GET /api/teachers/:id/subjects
```

### Get Student's Assessment Results
```
GET /api/assessments/:id/results
```

---

## Field Definitions

### Student Number Format
- **Format**: `STU-{YEAR}-{NUMBER}`
- **Example**: `STU-2026-001`
- **Auto-generated** on student creation
- **Unique** across system

### Assessment Types
- **test** - Short quiz or test
- **exam** - Major examination
- **continuous** - Ongoing assessment
- **assignment** - Homework or project

### Student Status
- **active** - Currently enrolled
- **graduated** - Completed program
- **suspended** - Temporarily removed

### Teacher Status
- **active** - Currently employed
- **inactive** - Not teaching

---

## Error Codes & Messages

| Issue | Message | Solution |
|-------|---------|----------|
| Unauthorized | "Only admins can..." | Check user role |
| Not Found | "Student not found" | Verify ID exists |
| Invalid Email | "Please enter valid email" | Check email format |
| Duplicate Entry | "Email already exists" | Use different email |
| Missing Field | "[Field] is required" | Fill all required fields |
| Logout Required | "You are logged out" | Refresh page to login |

---

## Keyboard Shortcuts

None built-in, but common browser shortcuts work:
- `Ctrl/Cmd + F` - Search on page
- `Ctrl/Cmd + R` - Refresh
- `F12` - Developer tools

---

## Tips & Tricks

### Admin Dashboard
- Use role switcher to test student/teacher experience
- Switch back to admin view to manage data

### Searching Students
- Search by name: `John Doe`
- Search by email: `john@example.com`
- Search by student number: `STU-2026-001`

### Filtering Assessments
- Select level to see relevant subjects
- Select subject to see its assessments

### Bulk Operations
- Plan: Use student management to add multiple at once
- Future: Bulk import CSV will be added

---

## Performance Tips

1. **Caching**: React Query caches all API responses
2. **Filtering**: Use filters instead of searching large lists
3. **Pagination**: Currently loads all data (future enhancement)

---

## Data Privacy

- Students can only see their own data
- Teachers can see student data they manage
- Admins can see everything
- No data is exposed in URLs (good!)

---

## Future Features Roadmap

- [ ] Attendance tracking
- [ ] Email notifications
- [ ] Parent portal
- [ ] File uploads for assignments
- [ ] Certificate generation
- [ ] Bulk student import
- [ ] Advanced analytics
- [ ] Timetable management
- [ ] Payment tracking
- [ ] Mobile app

---

**Last Updated**: January 9, 2026
**Version**: 1.0.0
