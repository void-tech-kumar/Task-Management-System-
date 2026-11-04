# TaskFlow – Academic Task Management System

TaskFlow is a functional full-stack task management and evaluation platform tailored for collegiate academic environments. Faculty can create academic courses/projects, assign tasks to students, monitor progress in real-time, and evaluate student work with grades and feedback. Students organize their academic obligations via an interactive **Drag-and-Drop Kanban Board**, track upcoming deadlines, submit deliverables, and collaborate with faculty and peers.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, `@hello-pangea/dnd`, Lucide Icons, Axios.
- **Backend**: Node.js, Express, TypeScript, Zod, Cookie-Parser, Bcrypt, JWT.
- **Database & ORM**: Neon Serverless PostgreSQL with Prisma ORM.
- **Security**: Strict Role-Based Access Control (RBAC), HTTP-Only Cookies, Input Sanitization with Zod.

---

## 👥 Pre-Configured Demo Accounts

Use any of the following credentials or the **one-click demo buttons** on the login screen (`/login`):

| Role | Email | Password | Department |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@taskflow.edu` | `Admin@123` | Academic Administration |
| **Faculty (Lead)** | `robert.miller@taskflow.edu` | `Faculty@123` | Computer Science |
| **Faculty (Lead)** | `sarah.jenkins@taskflow.edu` | `Faculty@123` | Software Engineering |
| **Student** | `alex.chen@taskflow.edu` | `Student@123` | Computer Science |
| **Student** | `priya.sharma@taskflow.edu` | `Student@123` | Computer Science |
| **Student** | `marcus.johnson@taskflow.edu` | `Student@123` | Software Engineering |
| **Student** | `emily.davis@taskflow.edu` | `Student@123` | Software Engineering |

---

## 🚀 Getting Started

### 1. Database Configuration (Neon PostgreSQL)
Configure your Neon PostgreSQL connection string in `server/.env`:
```env
DATABASE_URL="postgresql://[user]:[password]@[neon-host]/neondb?sslmode=require"
PORT=5000
NODE_ENV=development
JWT_SECRET="taskflow_jwt_secret_academic_platform_key_2026"
CLIENT_URL="http://localhost:5173"
```

### 2. Run Database Migrations & Seed Data
From the `server` directory:
```bash
# Push schema to Neon PostgreSQL
cd server
npx prisma db push

# Seed realistic academic courses, tasks, submissions, and users
npm run prisma:seed
```

### 3. Start Development Servers

**Option A (Root Monorepo):**
```bash
# Terminal 1 - Backend API Server
npm run dev:server

# Terminal 2 - Frontend Client
npm run dev:client
```

**Option B (Separate Folders):**
```bash
# In server directory:
cd server
npm run dev

# In client directory:
cd client
npm run dev
```

- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🎯 Key Application Features

1. **Role-Adaptive Dashboards**: Real-time computed metrics (completion velocity, submission evaluation rates, overdue alerts). No fake hardcoded statistics!
2. **Interactive Drag-and-Drop Kanban Board**: Real-time optimistic status transitions across `To Do`, `In Progress`, `In Review`, and `Completed`.
3. **Course Workspace**: Faculty can organize students into project cohorts with course codes (e.g. `CS401`), view rosters, and track progress bars.
4. **Deliverable Submission & Evaluation Pipeline**:
   - Students submit work notes and deliverable URLs (GitHub, Google Drive, docs).
   - Faculty access a dedicated Grading Portal to review work, assign scores out of `maxPoints`, and submit qualitative feedback remarks.
5. **Collaborative Discussion Threads**: Task-level comment threads with real-time in-app alerts for assignees and instructors.
6. **Deadline Warnings**: Automated alerts for tasks due within 24–48 hours.
7. **Institutional User Directory**: Admin control panel for provisioning users and updating roles.

