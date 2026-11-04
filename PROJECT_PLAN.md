# TaskFlow – Task Management System
## Architectural Blueprint & Comprehensive Project Plan

---

### Executive Summary

**TaskFlow** is an enterprise-grade, college-focused task and project management platform. It bridges the operational divide between faculty academic coordination and student task execution. 

Unlike generic todo applications, TaskFlow enforces academic hierarchy and workflows:
- **Faculty** organize curriculum cohorts into Projects, publish structured Tasks with strict milestones/deadlines, monitor student progress in real-time, and evaluate student work with grades and feedback.
- **Students** track their academic responsibilities, schedule workloads via an interactive **Drag-and-Drop Kanban Board**, submit deliverables, receive evaluation notes, and collaborate via task comments.
- **Admins** oversee institutional integrity, user role provisioning, department allocations, and aggregated system performance analytics.

---

## 1. Requirements & Scope Analysis

### 1.1 Core Problem & Academic Context
In collegiate environments, students struggle with fractured deadline tracking across disparate syllabi, while instructors lack visibility into student progress before the deadline. TaskFlow solves this by combining **structured task assignment**, **interactive drag-and-drop scheduling**, **live submission & grading pipelines**, and **deadline notification systems** backed by a normalized PostgreSQL database.

### 1.2 User Roles & Operational Boundaries
| Role | Core Objective | Key Capabilities |
| :--- | :--- | :--- |
| **Admin** | System Governance | User provisioning, role assignment, department management, global analytics audit, system health monitoring. |
| **Faculty** | Project & Evaluation Authority | Create academic projects/courses, assign tasks to enrolled students, set deadlines & weightages, evaluate submissions with marks/feedback, view cohort progress. |
| **Student** | Execution & Collaboration | Manage assigned tasks across all enrolled projects, move tasks through Kanban states (Todo, In Progress, In Review, Completed), submit deliverables, review evaluations, view upcoming deadline alerts. |

### 1.3 Scope Boundary Matrix
```
┌────────────────────────────────────────────────────────────────────────┐
│                              IN SCOPE                                  │
├────────────────────────────────────────────────────────────────────────┤
│ ✔ Role-Based Access Control (Admin, Faculty, Student)                  │
│ ✔ JWT Authentication via HTTP-only Cookies                             │
│ ✔ Project Workspaces with Course Codes & Departments                   │
│ ✔ Task Creation with Categories, Priorities, and Deadlines             │
│ ✔ Interactive Drag-and-Drop Kanban Scheduling                          │
│ ✔ Multi-Student Task Assignments                                       │
│ ✔ Student Work Submission & Faculty Evaluation Pipeline                │
│ ✔ Real-time Calculated Progress Bars & Completion Metrics (No Mocking) │
│ ✔ In-app Deadline Warnings & Assignment Notifications                  │
│ ✔ Collaborative Task Discussion & Activity Auditing                    │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│                        EXPLICITLY OUT OF SCOPE                         │
├────────────────────────────────────────────────────────────────────────┤
│ ✖ Generic Public Registration without Role Safeguards                  │
│ ✖ Video Conferencing / Video Streaming                                 │
│ ✖ Third-party Payment Gateways                                         │
│ ✖ External OAuth Over-engineering (prioritizing robust local JWT auth) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

TaskFlow adopts a decoupled **Full-Stack Monorepo Architecture** with clear boundaries between UI presentation, API orchestration, and persistence.

```
+-----------------------------------------------------------+
|          Frontend (React 18 + Vite + TS + Tailwind)       |
|  - Auth Context & Role Guards                             |
|  - Drag-and-Drop Kanban (@hello-pangea/dnd)               |
|  - Axios Client (withCredentials: true)                   |
+-----------------------------+-----------------------------+
                              |
                     HTTPS REST + JWT Cookies
                              |
+-----------------------------v-----------------------------+
|          Backend (Node.js + Express + TypeScript)         |
|  - Auth Middleware & Role Guard                           |
|  - Zod Request Validation                                 |
|  - Module Controllers & Services                          |
|  - Prisma Client ORM                                      |
+-----------------------------+-----------------------------+
                              |
                    Connection Pooler (SSL)
                              |
+-----------------------------v-----------------------------+
|            Database (Neon Serverless PostgreSQL)          |
+-----------------------------------------------------------+
```

### Architectural Highlights:
1. **Frontend**: Feature-driven React components with TypeScript strict mode, responsive Tailwind CSS styling, role-protected routes, and contextual notification polling.
2. **Backend**: Layered Express application (Routes -> Validation -> RBAC -> Controllers -> Services -> Prisma) enforcing strict separation of concerns.
3. **Authentication**: Stateless access token & refresh token rotation delivered via secure, `HTTP-only`, `SameSite=Lax` cookies to prevent XSS credential exfiltration.
4. **Data Layer**: Neon PostgreSQL accessed via Prisma Client with pooling enabled for serverless reliability.

---

## 3. Database Schema & Prisma Model Plan

### 3.1 Entities and Relationships
- **User**: Authentication, role (`ADMIN`, `FACULTY`, `STUDENT`), department, profile info.
- **Project**: Academic courses/cohorts created by Faculty.
- **ProjectMember**: Pivot table enrolling Students into Projects.
- **Task**: Academic units with priority, category, deadline, points, and status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`).
- **TaskAssignment**: Links Tasks to one or more assigned Students.
- **TaskSubmission**: Student deliverable content/attachments, evaluation grade, and faculty feedback.
- **TaskComment**: Chronological discussion messages on a task.
- **Notification**: Automated deadline reminders, assignment alerts, and evaluation notices.

### 3.2 Prisma Schema Definition

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  FACULTY
  STUDENT
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskCategory {
  ASSIGNMENT
  LAB_WORK
  PROJECT_MILESTONE
  READING
  PERSONAL
}

enum SubmissionStatus {
  PENDING
  SUBMITTED
  EVALUATED
  RESUBMIT_REQUESTED
}

enum NotificationType {
  DEADLINE_APPROACHING
  TASK_ASSIGNED
  SUBMISSION_EVALUATED
  COMMENT_POSTED
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  fullName     String
  role         Role          @default(STUDENT)
  department   String?
  avatarUrl    String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  projectsCreated Project[]       @relation("FacultyProjects")
  memberships     ProjectMember[]
  createdTasks    Task[]          @relation("TaskCreator")
  assignedTasks   TaskAssignment[]
  submissions     TaskSubmission[] @relation("StudentSubmissions")
  evaluations     TaskSubmission[] @relation("FacultyEvaluations")
  comments        TaskComment[]
  notifications   Notification[]

  @@index([role])
  @@index([email])
}

model Project {
  id          String        @id @default(uuid())
  title       String
  code        String        @unique
  description String?
  department  String?
  facultyId   String
  faculty     User          @relation("FacultyProjects", fields: [facultyId], references: [id], onDelete: Restrict)
  startDate   DateTime?
  endDate     DateTime?
  status      ProjectStatus @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  members ProjectMember[]
  tasks   Task[]

  @@index([facultyId])
  @@index([status])
}

model ProjectMember {
  id        String   @id @default(uuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  joinedAt  DateTime @default(now())

  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
}

model Task {
  id          String       @id @default(uuid())
  title       String
  description String?
  projectId   String
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creatorId   String
  creator     User         @relation("TaskCreator", fields: [creatorId], references: [id])
  status      TaskStatus   @default(TODO)
  priority    Priority     @default(MEDIUM)
  category    TaskCategory @default(ASSIGNMENT)
  dueDate     DateTime
  orderIndex  Int          @default(0)
  maxPoints   Int          @default(100)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  assignments TaskAssignment[]
  submissions TaskSubmission[]
  comments    TaskComment[]

  @@index([projectId])
  @@index([status])
  @@index([dueDate])
}

model TaskAssignment {
  id         String   @id @default(uuid())
  taskId     String
  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignedAt DateTime @default(now())

  @@unique([taskId, userId])
  @@index([taskId])
  @@index([userId])
}

model TaskSubmission {
  id            String           @id @default(uuid())
  taskId        String
  task          Task             @relation(fields: [taskId], references: [id], onDelete: Cascade)
  studentId     String
  student       User             @relation("StudentSubmissions", fields: [studentId], references: [id], onDelete: Cascade)
  content       String?
  attachmentUrl String?
  status        SubmissionStatus @default(SUBMITTED)
  grade         Float?
  feedback      String?
  evaluatorId   String?
  evaluator     User?            @relation("FacultyEvaluations", fields: [evaluatorId], references: [id])
  evaluatedAt   DateTime?
  submittedAt   DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@unique([taskId, studentId])
  @@index([taskId])
  @@index([studentId])
}

model TaskComment {
  id        String   @id @default(uuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content   String
  createdAt DateTime @default(now())

  @@index([taskId])
}

model Notification {
  id           String           @id @default(uuid())
  userId       String
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  message      String
  type         NotificationType
  isRead       Boolean          @default(false)
  referenceUrl String?
  createdAt    DateTime         @default(now())

  @@index([userId, isRead])
}
```

---

## 4. Role-Based Permissions Matrix

| Module & Action | Admin | Faculty | Student |
| :--- | :---: | :---: | :---: |
| **System & User Management** | | | |
| Create / deactivate user accounts | Yes | No | No |
| Change user roles / assign department | Yes | No | No |
| View global user directory | Yes | View (Students/Faculty) | Teammates Only |
| **Project Operations** | | | |
| Create new project cohort | Yes | Yes | No |
| Update / archive owned projects | Yes | Owned Projects | No |
| Enroll students into projects | Yes | Owned Projects | No |
| View project overview & members | Yes | Owned Projects | Enrolled Projects |
| **Task Management & Scheduling** | | | |
| Create task in project | Yes | Yes (Owned Projects)| Personal Tasks Only |
| Assign tasks to enrolled students | Yes | Yes | No |
| Drag & Drop status transition (Kanban) | Yes | Yes | Assigned Tasks |
| Reorder tasks within Kanban column | Yes | Yes | Own View |
| **Submission & Evaluation** | | | |
| Submit deliverables (text / attachments)| No | No | Assigned Tasks |
| Grade submissions & record feedback | Yes | Owned Projects | No |
| View evaluation marks & faculty remarks| Yes | Yes | Own Submissions |
| **Collaboration & Notifications** | | | |
| Post comments on tasks | Yes | Owned Projects | Assigned Projects |
| View upcoming deadline notifications | All | Tracking Cohorts | Personal Deadlines |
| **Analytics & Reporting** | | | |
| Institution-wide activity & metrics | Yes | No | No |
| Project progress & cohort grade spread | Yes | Owned Projects | No |
| Personal completion velocity & scorecard| No | No | Personal Only |

---

## 5. Frontend Pages & Navigation Flow

### 5.1 Route Hierarchy
```
/ (Root)
 ├── /login                      (Public login form)
 ├── /unauthorized               (403 Access Forbidden state)
 └── /app                        (Protected Shell with Header & Sidebar)
      ├── /dashboard             (Role-specific summary dashboard)
      ├── /projects              (Project listing & search)
      ├── /projects/:id          (Project workspace: Overview, Tasks, Members)
      ├── /tasks                 (Kanban Board & List View with DND)
      ├── /tasks/:id             (Task detail modal: Submissions, Comments)
      ├── /evaluations           (Faculty grading portal: Pending submissions)
      ├── /my-submissions        (Student portfolio: Grades & status)
      ├── /notifications         (Notification inbox & read status)
      ├── /analytics             (Admin global metrics or Faculty course metrics)
      ├── /admin/users           (Admin-only: User directory & role assignment)
      └── /profile               (User profile & account details)
```

---

## 6. Backend API Modules & Endpoints

All responses follow a predictable JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### 6.1 Authentication Module (`/api/v1/auth`)
- `POST /login`: Authenticates credentials; sets HTTP-only `token` cookie.
- `POST /logout`: Clears auth cookies.
- `GET /me`: Returns current authenticated user and role.

### 6.2 User Management Module (`/api/v1/users`)
- `GET /`: Admin list all users with filtering by role and department.
- `POST /`: Admin create user account with specified role.
- `PATCH /:id`: Admin update user details, role, or department.
- `GET /students`: Admin & Faculty retrieve list of students for task assignment.

### 6.3 Project Module (`/api/v1/projects`)
- `GET /`: List projects associated with the user (Owned or Enrolled).
- `POST /`: Admin & Faculty create new academic project/course cohort.
- `GET /:id`: Get project details, members, tasks, and calculated progress.
- `PATCH /:id`: Project Faculty update project info or archive project.
- `POST /:id/members`: Project Faculty enroll students into the project.
- `DELETE /:id/members/:userId`: Project Faculty remove student from project.

### 6.4 Task & Kanban Module (`/api/v1/tasks`)
- `GET /`: Query tasks (filter by `projectId`, `status`, `assignedToMe`).
- `POST /`: Faculty & Admin create task with deadline, priority, category, assignees.
- `GET /:id`: Retrieve task detail, comments, and submission status.
- `PATCH /:id`: Task Creator edit task parameters, deadline, or points.
- `PATCH /:id/status`: **Kanban drag-and-drop endpoint** - updates status & order index.
- `DELETE /:id`: Task Creator delete task.

### 6.5 Submission & Evaluation Module (`/api/v1/submissions`)
- `POST /tasks/:taskId/submit`: Assigned Student submit deliverable text and link.
- `GET /tasks/:taskId`: Faculty view all student submissions for a task.
- `GET /my-submissions`: Student view all personal submissions with grades and remarks.
- `PATCH /:id/evaluate`: Task Faculty record marks, feedback, and mark as EVALUATED.

### 6.6 Comments & Notifications Module
- `GET /tasks/:taskId/comments`: Chronological discussion thread.
- `POST /tasks/:taskId/comments`: Post comment (triggers notification to assignees/creator).
- `GET /notifications`: List recent notifications for logged-in user.
- `PATCH /notifications/:id/read`: Mark notification as read.
- `PATCH /notifications/read-all`: Mark all notifications as read.
- `GET /analytics/dashboard`: Dynamic statistics (completed %, overdue count, averages).

---

## 7. Folder Structure

```
TaskFlow/
├── client/                               # Frontend React Application
│   ├── src/
│   │   ├── components/                   # Common, Kanban, Layout, Submissions
│   │   ├── context/                      # AuthContext, NotificationContext
│   │   ├── hooks/                        # useAuth, useTasks, useNotifications
│   │   ├── pages/                        # Auth, Dashboard, Projects, Tasks, Evaluations, Admin
│   │   ├── services/                     # Axios API endpoints & interceptors
│   │   ├── types/                        # TypeScript shared interfaces
│   │   ├── utils/                        # Date formatters, priority color maps
│   │   ├── App.tsx                       # React Router configuration
│   │   ├── main.tsx                      # Entry point
│   │   └── index.css                     # Tailwind CSS imports
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                               # Backend Node.js Express Application
│   ├── prisma/
│   │   ├── schema.prisma                 # Normalized database schema
│   │   └── seed.ts                       # Realistic seed data (Admin, Faculty, Students)
│   ├── src/
│   │   ├── config/                       # DB & Env configurations
│   │   ├── controllers/                  # Route handlers
│   │   ├── middleware/                   # Auth, RBAC, Validation, Error Handling
│   │   ├── routes/                       # Express router modules
│   │   ├── services/                     # Business logic & DB queries
│   │   ├── utils/                        # JWT helpers, ApiResponse, AppError
│   │   ├── validations/                  # Zod validation schemas
│   │   └── server.ts                     # Express server startup
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example                          # Environment variable templates
├── package.json                          # Monorepo root scripts (dev, build)
└── PROJECT_PLAN.md                       # This plan document
```

---

## 8. Implementation Phases

1. **Phase 1: Foundation & Persistence**
   - Initialize Monorepo (`client` + `server` with TypeScript).
   - Configure Neon PostgreSQL connection with Prisma.
   - Define normalized Prisma schema with migrations.
   - Write robust database seeder with realistic college data (1 Admin, 2 Faculty, 4 Students, 3 Academic Projects, 10+ Tasks).

2. **Phase 2: Authentication & RBAC Core**
   - Implement JWT generation and verification with secure HTTP-only cookies.
   - Build `authenticate` and `authorize(Role[])` middlewares.
   - Create `/api/v1/auth` endpoints (`login`, `logout`, `me`).
   - Setup React frontend shell, Tailwind theme, `AuthContext`, and role-based `ProtectedRoute`.

3. **Phase 3: Project & Cohort Management**
   - Backend CRUD endpoints for Projects and Project Memberships.
   - Faculty interface to create projects, assign course codes, and enroll students.
   - Student interface to view joined project workspaces and syllabi details.

4. **Phase 4: Task Engine & Drag-and-Drop Kanban Board**
   - Task creation module with priority tags, categories, deadlines, and student assignees.
   - Interactive Kanban Board (`@hello-pangea/dnd`) supporting smooth drag-and-drop between columns.
   - Implement optimistic UI updates paired with `PATCH /api/v1/tasks/:id/status` synchronization.
   - Filter tasks by project, priority, and upcoming due date.

5. **Phase 5: Submission & Evaluation Pipeline**
   - Student deliverable submission form with text/notes and deliverable links.
   - Faculty Evaluation Portal: View submissions per task, award marks out of `maxPoints`, submit feedback, and request resubmissions.
   - Student submission status ledger displaying grades and faculty feedback.

6. **Phase 6: Notifications & Dynamic Analytics**
   - Deadline monitoring service: Automated alerts for tasks due within 24–48 hours.
   - In-app notification bell with unread badge and instant read markers.
   - Dynamic analytics calculations (No hardcoding!):
     - Completion percentage = Completed Tasks / Total Assigned Tasks * 100%
     - Average cohort submission grades and overdue task counters.

7. **Phase 7: Hardening, Responsive Polish & Verification**
   - Mobile responsiveness check across all dashboards and modals.
   - Form validation error styling and toast feedback.
   - End-to-end multi-role testing walkthrough (Admin -> Faculty -> Student).

---

## 9. Security Requirements & Testing Strategy

- **HTTP-Only Cookies**: JWT tokens stored only in HTTP-only, SameSite cookies to protect against XSS.
- **Password Hashing**: Bcrypt with salt rounds $\ge 10$.
- **Validation**: Strict schema checks via Zod on every payload before reaching controllers.
- **Authorization**: Granular role and ownership checks on every mutation to prevent Insecure Direct Object References (IDOR).
- **Automated Verification**: End-to-end verification checklist covering authentication, project management, Kanban drag-and-drop, and grading workflows.
