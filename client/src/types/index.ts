export type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskCategory =
  | 'ASSIGNMENT'
  | 'LAB_WORK'
  | 'PROJECT_MILESTONE'
  | 'READING'
  | 'PERSONAL';

export type SubmissionStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'EVALUATED'
  | 'RESUBMIT_REQUESTED';

export type NotificationType =
  | 'DEADLINE_APPROACHING'
  | 'TASK_ASSIGNED'
  | 'SUBMISSION_EVALUATED'
  | 'COMMENT_POSTED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  department?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  _count?: {
    projectsCreated?: number;
    memberships?: number;
    assignedTasks?: number;
  };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  joinedAt: string;
  user: User;
}

export interface Project {
  id: string;
  title: string;
  code: string;
  description?: string | null;
  department?: string | null;
  facultyId: string;
  faculty?: User;
  startDate?: string | null;
  endDate?: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  totalTasks?: number;
  completedTasks?: number;
  progressPercent?: number;
  members?: ProjectMember[];
  tasks?: Task[];
  _count?: {
    members?: number;
    tasks?: number;
  };
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: string;
  user: User;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  studentId: string;
  content?: string | null;
  attachmentUrl?: string | null;
  status: SubmissionStatus;
  grade?: number | null;
  feedback?: string | null;
  evaluatorId?: string | null;
  evaluator?: User | null;
  evaluatedAt?: string | null;
  submittedAt: string;
  task?: Task;
  student?: User;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  projectId: string;
  project?: {
    id: string;
    title: string;
    code: string;
    faculty?: User;
  };
  creatorId: string;
  creator?: User;
  status: TaskStatus;
  priority: Priority;
  category: TaskCategory;
  dueDate: string;
  orderIndex: number;
  maxPoints: number;
  createdAt: string;
  updatedAt: string;
  assignments?: TaskAssignment[];
  submissions?: TaskSubmission[];
  comments?: TaskComment[];
  _count?: {
    comments?: number;
    submissions?: number;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  referenceUrl?: string | null;
  createdAt: string;
}

export interface AdminMetrics {
  totalUsers: number;
  roleDistribution: { admin: number; faculty: number; student: number };
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  globalCompletionRate: number;
  totalSubmissions: number;
  evaluatedSubmissions: number;
  evaluationRate: number;
  averageGrade: number;
}

export interface FacultyMetrics {
  totalProjects: number;
  activeProjects: number;
  totalStudentsEnrolled: number;
  totalTasks: number;
  completedTasks: number;
  inReviewTasks: number;
  overdueTasks: number;
  completionRate: number;
  pendingEvaluations: number;
  totalSubmissions: number;
  averageGradeGiven: number;
}

export interface StudentMetrics {
  enrolledProjects: number;
  totalAssignedTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  todoTasks: number;
  overdueTasks: number;
  completionRate: number;
  totalSubmissions: number;
  evaluatedSubmissions: number;
  averageGradePercent: number;
}

export type DashboardMetrics = AdminMetrics | FacultyMetrics | StudentMetrics;
