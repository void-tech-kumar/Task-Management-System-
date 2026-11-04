<div align="center">

# ⚡ TaskFlow
### Academic Task Management & Evaluation System

**An enterprise-grade, collegiate task management and evaluation platform.**  
Faculty orchestrate course curricula, assign milestone tasks, and grade student submissions. Students schedule workloads via an interactive drag-and-drop Kanban board, track upcoming deadlines, and submit deliverables.

---

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Serverless-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Live Features](#-key-features) • [Architecture](#-system-architecture) • [Demo Credentials](#-pre-configured-demo-accounts) • [Quickstart](#-step-by-step-installation) • [API Specs](#-restful-api-endpoints)

</div>

---

## 📖 Table of Contents
- [Official Problem Statement](#-official-problem-statement)
- [Key Features](#-key-features)
- [Pre-Configured Demo Accounts](#-pre-configured-demo-accounts)
- [System Architecture](#-system-architecture)
- [Database Schema & ER Model](#-database-schema--er-model)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Step-by-Step Installation](#-step-by-step-installation)
- [RESTful API Endpoints](#-restful-api-endpoints)
- [Security & Architecture Standards](#-security--architecture-standards)
- [Contributing & License](#-license)

---

## 🎯 Official Problem Statement
A task management system helps users organize and prioritize their work. Users can create tasks, assign deadlines, categorize them into projects. The system provides notifications for upcoming deadlines, progress tracking, and options to mark tasks as complete. Features like drag-and-drop scheduling and collaborative task sharing enhance productivity and team coordination.

### Academic Context
In universities and colleges, students struggle with disparate course requirements and opaque deadlines, while instructors lack visibility into student progress before final submission. **TaskFlow** bridges this divide by providing:
- Structured academic project cohorts (e.g. `CS401`, `SE302`)
- Interactive drag-and-drop Kanban scheduling (`To Do`, `In Progress`, `In Review`, `Completed`)
- Direct deliverable submission pipelines (notes, GitHub links, documentation URLs)
- Rubric-based evaluation portals with qualitative feedback
- Proactive 24–48 hour deadline warning alerts

---

## ✨ Key Features

### 📋 1. Interactive Drag-and-Drop Kanban Board
- Smooth drag-and-drop transitions powered by `@hello-pangea/dnd`.
- Multi-column workflow: **To Do** $\rightarrow$ **In Progress** $\rightarrow$ **In Review** $\rightarrow$ **Completed**.
- Instant optimistic UI state updates backed by automatic database synchronization (`PATCH /api/v1/tasks/:id/status`).
- Comprehensive filters: filter by Course/Project, Priority (`Low`, `Medium`, `High`, `Urgent`), Category, or "Assigned to Me".
- Switch between interactive **Kanban Board** and **Tabular List View** with a single click.

### 🎓 2. Academic Course & Project Workspaces
- Faculty create courses with unique course codes (e.g., `CS401`, `SE302`), academic term dates, and descriptions.
- Student enrollment directory with one-click enrollment modals.
- Real-time calculated course completion progress bars ($\frac{\text{Completed Tasks}}{\text{Total Tasks}} \times 100\%$).

### ✍️ 3. Student Deliverable Submission & Faculty Grading Portal
- **Students**: Submit deliverable solution notes and external links (GitHub repositories, Google Drive files, deployed links).
- **Submitting work automatically advances task status to `In Review`** and dispatches an instant notification to course instructors.
- **Faculty Grading Portal**: Review incoming deliverables, assign scores out of `maxPoints`, provide qualitative feedback, and approve work or request resubmissions.

### 💬 4. Collaborative Discussion & Activity Threads
- Task-level chronological discussion threads.
- Automatic in-app notification dispatch to all assigned students and instructors when comments are posted.

### ⏰ 5. Automated Deadline Warning Radar
- Background check monitors all incomplete tasks due in $\le 48$ hours and generates high-priority warning badges.
- Dynamic color-coded urgency badges (`Overdue by Xd`, `Due in 24h`, `Due in 3d`).
- Notification bell dropdown with unread counter badges and "Mark all read" capabilities.

### 📊 6. Real-Time Dynamic Analytics (Zero Hardcoding!)
- **Admin**: Global user breakdown, total projects, system-wide task completion velocity, and evaluation throughput.
- **Faculty**: Enrolled student count, course completion percentage, pending evaluations count, and cohort average scores.
- **Student**: Personal workload breakdown, completion percentage, overdue alerts, and cumulative average grades.

---

## 👥 Pre-Configured Demo Accounts

TaskFlow includes a **One-Click Quick Login** selector on the login screen (`/login`). You can click any role to auto-fill credentials:

| Role | Email | Password | Primary Mission |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@taskflow.edu` | `Admin@123` | Institutional directory, user provisioning, global analytics. |
| 👨‍🏫 **Faculty (Lead)** | `robert.miller@taskflow.edu` | `Faculty@123` | Computer Science cohorts (`CS401`, `CS450`), task assignment & grading. |
| 👩‍🏫 **Faculty (Lead)** | `sarah.jenkins@taskflow.edu` | `Faculty@123` | Software Engineering cohorts (`SE302`), rubric assessments. |
| 🎓 **Student** | `alex.chen@taskflow.edu` | `Student@123` | CS major: Kanban board, deliverable submissions, deadline radar. |
| 🎓 **Student** | `priya.sharma@taskflow.edu` | `Student@123` | CS major: Coursework tracking, discussions, notifications. |
| 🎓 **Student** | `marcus.johnson@taskflow.edu` | `Student@123` | SE major: Collaborative milestone tracking. |
| 🎓 **Student** | `emily.davis@taskflow.edu` | `Student@123` | SE major: Architecture labs & submissions. |

---

## 🏛️ System Architecture

TaskFlow is organized as a clean **Full-Stack Monorepo Architecture** with strict layer separation:

```
+─────────────────────────────────────────────────────────────+
│         Frontend Client (React 18 + Vite + Tailwind)        │
│  - Role-Guarded React Router (/app/*)                       │
│  - Auth & Notification Contexts                             │
│  - @hello-pangea/dnd Kanban Board                           │
│  - Axios Client (withCredentials: true)                     │
+──────────────────────────────┬──────────────────────────────+
                               │
                      HTTPS REST + JWT Cookies
                               │
+──────────────────────────────v──────────────────────────────+
│          Backend Server (Node.js + Express + TS)            │
│  - JWT & Role Middleware (ADMIN, FACULTY, STUDENT)          │
│  - Request Validation via Zod Schemas                       │
│  - Controllers & Evaluation Services                        │
│  - Prisma ORM Query Engine                                  │
+──────────────────────────────┬──────────────────────────────+
                               │
                      SSL Connection Pooler
                               │
+──────────────────────────────v──────────────────────────────+
│             Database: Neon Serverless PostgreSQL            │
│  (Users, Projects, Tasks, Submissions, Comments, Notifs)    │
+─────────────────────────────────────────────────────────────+
```

---

## 🗄️ Database Schema & ER Model

TaskFlow persistence is fully normalized into 8 relational entities:

```
[User] 1──* [Project] (as Faculty Lead)
  │
  ├───* [ProjectMember] *───1 [Project]
  │
  ├───* [Task] (as Creator)
  │
  ├───* [TaskAssignment] *───1 [Task]
  │
  ├───* [TaskSubmission] *───1 [Task]
  │
  ├───* [TaskComment] *───1 [Task]
  │
  └───* [Notification]
```

- **User**: Authentication, role (`ADMIN`, `FACULTY`, `STUDENT`), department, avatar.
- **Project**: Course code (`code` unique, e.g. `CS401`), title, dates, status (`PLANNING`, `ACTIVE`, `COMPLETED`, `ARCHIVED`).
- **ProjectMember**: Student enrollment pivot table with unique constraint on `[projectId, userId]`.
- **Task**: Title, description, priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), category (`ASSIGNMENT`, `LAB_WORK`, `PROJECT_MILESTONE`, `READING`, `PERSONAL`), deadline, orderIndex, maxPoints.
- **TaskAssignment**: Multi-student task assignment pivot table.
- **TaskSubmission**: Deliverable notes, attachment URLs, status (`SUBMITTED`, `EVALUATED`, `RESUBMIT_REQUESTED`), grade score, feedback remarks, evaluator foreign key.
- **TaskComment**: Chronological discussion thread per task.
- **Notification**: Automated deadline reminders, assignment alerts, and evaluation marks.

---

## 🔒 Role-Based Access Control (RBAC)

| Capability / Action | Admin | Faculty | Student |
| :--- | :---: | :---: | :---: |
| Provision & manage institutional user accounts | ✅ Full | ❌ No | ❌ No |
| Create new course cohort / project workspace | ✅ Full | ✅ Full | ❌ No |
| Enroll students into course cohorts | ✅ Full | ✅ Owned Courses | ❌ No |
| Create and publish tasks with deadlines | ✅ Full | ✅ Owned Courses | ❌ Personal Only |
| Drag & drop task status on Kanban board | ✅ Full | ✅ Full | ✅ Assigned Tasks |
| Submit deliverable solution notes & URLs | ❌ No | ❌ No | ✅ Assigned Tasks |
| Grade student deliverables & post remarks | ✅ Full | ✅ Owned Courses | ❌ No |
| Post comments on task discussion threads | ✅ Full | ✅ Full | ✅ Enrolled Cohorts |
| View automated 24h–48h deadline warnings | ✅ Full | ✅ Full | ✅ Personal Deadlines |

---

## 🚀 Step-by-Step Installation

### Prerequisites
- **Node.js**: v18+ (tested on Node v20 & v24)
- **NPM**: v9+
- **Neon PostgreSQL Account**: Free serverless database at [neon.tech](https://neon.tech/)

### 1. Clone the Repository
```bash
git clone https://github.com/void-tech-kumar/Task-Management-System-.git
cd Task-Management-System-
```

### 2. Configure Environment Variables
Inside `server/.env`, verify or add your Neon connection string:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://[user]:[password]@[neon-host]/neondb?sslmode=require"
JWT_SECRET="taskflow_jwt_secret_academic_platform_key_2026"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

### 3. Push Database Schema & Seed Demo Data
```bash
# From server directory:
cd server
npx prisma db push
npm run prisma:seed
cd ..
```

### 4. Start Development Servers
From the root repository:

```bash
# Terminal 1: Backend API (runs on port 5000)
npm run dev:server

# Terminal 2: Frontend Client (runs on port 5173)
npm run dev:client
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 📡 RESTful API Endpoints

All responses follow a uniform JSON envelope:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Authentication (`/api/v1/auth`)
- `POST /login`: Authenticates credentials; sets secure `token` cookie.
- `POST /logout`: Clears authentication cookies.
- `GET /me`: Returns currently authenticated user and role.

### User Governance (`/api/v1/users`)
- `GET /`: Admin list all users with role and department filters.
- `POST /`: Admin create user account.
- `PATCH /:id`: Admin update user credentials or role.
- `DELETE /:id`: Admin delete user account.
- `GET /students`: List students for dropdowns and enrollment.

### Projects & Courses (`/api/v1/projects`)
- `GET /`: List projects for current user (owned or enrolled).
- `POST /`: Create new academic course cohort.
- `GET /:id`: Full project view with members, tasks, and completion rate.
- `POST /:id/members`: Enroll students into course.
- `DELETE /:id/members/:userId`: Remove student from course.

### Task Scheduling & Kanban (`/api/v1/tasks`)
- `GET /`: Query tasks (filter by `projectId`, `status`, `priority`, `category`).
- `POST /`: Create task with deadlines, point weightage, and student assignees.
- `GET /:id`: Retrieve task detail, comments, and submission history.
- `PATCH /:id/status`: **Kanban Drag-and-Drop Endpoint** (updates status and order index).
- `DELETE /:id`: Delete task.

### Submissions & Grading (`/api/v1/submissions`)
- `POST /tasks/:taskId/submit`: Student submits deliverable notes & link.
- `GET /my-submissions`: Student views personal graded portfolio.
- `GET /pending`: Faculty grading queue of unreviewed deliverables.
- `PATCH /:id/evaluate`: Faculty records grade score and feedback remarks.

### Discussions & Notifications
- `GET /comments/tasks/:taskId`: Task chronological comment stream.
- `POST /comments/tasks/:taskId`: Post comment (triggers alerts).
- `GET /notifications`: List user notifications and deadline warnings.
- `PATCH /notifications/:id/read`: Mark notification as read.
- `GET /analytics/dashboard`: Dynamic metrics for Admin, Faculty, or Student.

---

## 🛡️ Security & Architecture Standards

1. **Cookie-Based Stateless Authentication**: Access tokens stored in `HttpOnly`, `SameSite=Lax` cookies, preventing XSS-based token extraction.
2. **Password Cryptography**: Passwords salted and hashed with `bcryptjs` (cost factor 10).
3. **Runtime Schema Validation**: Every API request body is validated via **Zod schemas** before reaching controller logic.
4. **Relational Data Integrity**: Foreign keys, cascade rules, and compound unique constraints (`[projectId, userId]`, `[taskId, studentId]`) prevent corrupted state.
5. **IDOR & Authorization Guards**: Ownership verification ensures students cannot evaluate peers and faculty can only evaluate their assigned courses.
6. **Graceful React Error Boundaries**: Built-in boundary catches runtime exceptions and presents informative fallback cards instead of blank screens.

---

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ for collegiate task management, faculty coordination, and student success.</sub>
</div>
