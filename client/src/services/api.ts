import axios from 'axios';
import {
  User,
  Project,
  Task,
  TaskSubmission,
  TaskComment,
  NotificationItem,
  Role,
  Priority,
  TaskCategory,
  TaskStatus,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for clear error unwrapping
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(message));
  }
);

/* ==================== AUTH ==================== */
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<{ success: boolean; data: { user: User; token: string } }>('/auth/login', data),
  register: (data: { email: string; password: string; fullName: string; role?: Role; department?: string }) =>
    api.post<{ success: boolean; data: { user: User; token: string } }>('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<{ success: boolean; data: { user: User } }>('/auth/me'),
};

/* ==================== USERS ==================== */
export const usersApi = {
  getUsers: (params?: { role?: Role; department?: string; search?: string }) =>
    api.get<{ success: boolean; data: { users: User[] } }>('/users', { params }),
  getStudents: () =>
    api.get<{ success: boolean; data: { students: User[] } }>('/users/students'),
  getFaculty: () =>
    api.get<{ success: boolean; data: { faculty: User[] } }>('/users/faculty'),
  createUser: (data: { email: string; password: string; fullName: string; role: Role; department?: string }) =>
    api.post<{ success: boolean; data: { user: User } }>('/users', data),
  updateUser: (id: string, data: Partial<User> & { password?: string }) =>
    api.patch<{ success: boolean; data: { user: User } }>(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

/* ==================== PROJECTS ==================== */
export const projectsApi = {
  getProjects: (params?: { status?: string; search?: string }) =>
    api.get<{ success: boolean; data: { projects: Project[] } }>('/projects', { params }),
  getProjectById: (id: string) =>
    api.get<{ success: boolean; data: { project: Project } }>(`/projects/${id}`),
  createProject: (data: {
    title: string;
    code: string;
    description?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
    memberStudentIds?: string[];
  }) => api.post<{ success: boolean; data: { project: Project } }>('/projects', data),
  updateProject: (id: string, data: Partial<Project>) =>
    api.patch<{ success: boolean; data: { project: Project } }>(`/projects/${id}`, data),
  addMembers: (id: string, studentIds: string[]) =>
    api.post(`/projects/${id}/members`, { studentIds }),
  removeMember: (id: string, userId: string) =>
    api.delete(`/projects/${id}/members/${userId}`),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
};

/* ==================== TASKS ==================== */
export const tasksApi = {
  getTasks: (params?: {
    projectId?: string;
    status?: TaskStatus;
    priority?: Priority;
    category?: TaskCategory;
    assignedToMe?: boolean;
  }) => api.get<{ success: boolean; data: { tasks: Task[] } }>('/tasks', { params }),
  getTaskById: (id: string) =>
    api.get<{ success: boolean; data: { task: Task } }>(`/tasks/${id}`),
  createTask: (data: {
    title: string;
    description?: string;
    projectId: string;
    priority: Priority;
    category: TaskCategory;
    dueDate: string;
    maxPoints?: number;
    assignedStudentIds?: string[];
  }) => api.post<{ success: boolean; data: { task: Task } }>('/tasks', data),
  updateTask: (id: string, data: Partial<Task> & { assignedStudentIds?: string[] }) =>
    api.patch<{ success: boolean; data: { task: Task } }>(`/tasks/${id}`, data),
  updateTaskStatus: (id: string, data: { status: TaskStatus; orderIndex?: number }) =>
    api.patch<{ success: boolean; data: { task: Task } }>(`/tasks/${id}/status`, data),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
};

/* ==================== SUBMISSIONS ==================== */
export const submissionsApi = {
  submitTask: (taskId: string, data: { content: string; attachmentUrl?: string }) =>
    api.post<{ success: boolean; data: { submission: TaskSubmission } }>(
      `/submissions/tasks/${taskId}/submit`,
      data
    ),
  getTaskSubmissions: (taskId: string) =>
    api.get<{ success: boolean; data: { submissions: TaskSubmission[] } }>(
      `/submissions/tasks/${taskId}`
    ),
  getMySubmissions: () =>
    api.get<{ success: boolean; data: { submissions: TaskSubmission[] } }>(
      '/submissions/my-submissions'
    ),
  getPendingEvaluations: () =>
    api.get<{ success: boolean; data: { pending: TaskSubmission[] } }>(
      '/submissions/pending'
    ),
  evaluateSubmission: (
    id: string,
    data: { grade: number; feedback: string; status?: 'EVALUATED' | 'RESUBMIT_REQUESTED' }
  ) =>
    api.patch<{ success: boolean; data: { submission: TaskSubmission } }>(
      `/submissions/${id}/evaluate`,
      data
    ),
};

/* ==================== COMMENTS ==================== */
export const commentsApi = {
  getComments: (taskId: string) =>
    api.get<{ success: boolean; data: { comments: TaskComment[] } }>(
      `/comments/tasks/${taskId}`
    ),
  createComment: (taskId: string, data: { content: string }) =>
    api.post<{ success: boolean; data: { comment: TaskComment } }>(
      `/comments/tasks/${taskId}`,
      data
    ),
  deleteComment: (id: string) => api.delete(`/comments/${id}`),
};

/* ==================== NOTIFICATIONS ==================== */
export const notificationsApi = {
  getNotifications: () =>
    api.get<{ success: boolean; data: { notifications: NotificationItem[]; unreadCount: number } }>(
      '/notifications'
    ),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

/* ==================== ANALYTICS ==================== */
export const analyticsApi = {
  getDashboardStats: () =>
    api.get<{ success: boolean; data: { role: Role; metrics: any } }>('/analytics/dashboard'),
};

export default api;

