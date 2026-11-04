import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi, tasksApi, projectsApi } from '../../services/api';
import { Task, Project } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { TaskCard } from '../../components/kanban/TaskCard';
import { TaskDetailModal } from '../../components/kanban/TaskDetailModal';
import { CreateTaskModal } from '../../components/kanban/CreateTaskModal';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GraduationCap,
  Users,
  Award,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, tasksRes, projRes] = await Promise.all([
        analyticsApi.getDashboardStats(),
        tasksApi.getTasks({ assignedToMe: user?.role === 'STUDENT' ? true : undefined }),
        projectsApi.getProjects({ status: 'ACTIVE' }),
      ]);
      setMetrics(statsRes.data.data.metrics);
      setRecentTasks(tasksRes.data.data.tasks.slice(0, 6));
      setProjects(projRes.data.data.projects.slice(0, 4));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <Spinner label="Loading dashboard metrics..." size="lg" className="my-20" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'ADMIN'
              ? 'Institution governance and system-wide task execution monitoring.'
              : user?.role === 'FACULTY'
              ? 'Manage course curricula, assign student tasks, and grade incoming submissions.'
              : 'Keep track of coursework, manage your Kanban schedule, and submit deliverables on time.'}
          </p>
        </div>

        {/* Role Quick Actions */}
        <div className="flex items-center gap-2.5">
          {user?.role === 'FACULTY' && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<FolderKanban className="w-4 h-4" />}
                onClick={() => setCreateProjectOpen(true)}
              >
                New Course
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setCreateTaskOpen(true)}
              >
                Create Task
              </Button>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<Users className="w-4 h-4" />}
                onClick={() => setCreateProjectOpen(true)}
              >
                New Project
              </Button>
              <Link to="/app/admin/users">
                <Button variant="primary" size="sm">
                  User Directory
                </Button>
              </Link>
            </>
          )}

          {user?.role === 'STUDENT' && (
            <Link to="/app/tasks">
              <Button variant="primary" size="sm" icon={<FolderKanban className="w-4 h-4" />}>
                Go to Kanban Board
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* METRICS ROW (ROLE ADAPTIVE) */}
      {user?.role === 'ADMIN' && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics.totalUsers}</div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.roleDistribution.faculty} Faculty • {metrics.roleDistribution.student} Students
            </p>
          </Card>

          <Card className="p-5 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Projects</span>
              <FolderKanban className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics.activeProjects}</div>
            <p className="text-xs text-slate-500 mt-1">Out of {metrics.totalProjects} total courses</p>
          </Card>

          <Card className="p-5 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completion Velocity</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics.globalCompletionRate}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.completedTasks} / {metrics.totalTasks} Tasks completed
            </p>
          </Card>

          <Card className="p-5 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Evaluations Rate</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics.evaluationRate}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.evaluatedSubmissions} of {metrics.totalSubmissions} submissions graded
            </p>
          </Card>
        </div>
      )}

      {user?.role === 'FACULTY' && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">My Courses</span>
              <FolderKanban className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics.totalProjects}</div>
            <p className="text-xs text-slate-500 mt-1">{metrics.totalStudentsEnrolled} Enrolled Students</p>
          </Card>

          <Card className="p-5 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Evaluations</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600">{metrics.pendingEvaluations}</div>
            <Link to="/app/evaluations" className="text-xs text-indigo-600 hover:underline mt-1 inline-block font-semibold">
              Open Grading Portal &rarr;
            </Link>
          </Card>

          <Card className="p-5 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Task Completion</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics.completionRate}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.completedTasks} / {metrics.totalTasks} Tasks completed
            </p>
          </Card>

          <Card className="p-5 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Cohort Avg Grade</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics.averageGradeGiven} pts</div>
            <p className="text-xs text-slate-500 mt-1">Across all evaluated tasks</p>
          </Card>
        </div>
      )}

      {user?.role === 'STUDENT' && metrics && (
        <div className="space-y-4">
          {metrics.overdueTasks > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Action Required: You have {metrics.overdueTasks} overdue task(s)!</h4>
                  <p className="text-xs text-rose-700">Please review your tasks board and submit pending deliverables.</p>
                </div>
              </div>
              <Link to="/app/tasks">
                <Button variant="danger" size="sm">
                  View Tasks
                </Button>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Enrolled Courses</span>
                <FolderKanban className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics.enrolledProjects}</div>
              <p className="text-xs text-slate-500 mt-1">Academic workspaces</p>
            </Card>

            <Card className="p-5 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Assigned Tasks</span>
                <Clock className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics.totalAssignedTasks}</div>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.inProgressTasks} In Progress • {metrics.inReviewTasks} In Review
              </p>
            </Card>

            <Card className="p-5 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Completion Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics.completionRate}%</div>
              <p className="text-xs text-slate-500 mt-1">{metrics.completedTasks} Completed</p>
            </Card>

            <Card className="p-5 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Average Grade</span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics.averageGradePercent}%</div>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.evaluatedSubmissions} Graded Submissions
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ACTIVE COURSES / PROJECTS ROW */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Projects & Courses</h2>
          <Link
            to="/app/projects"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View all courses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((proj) => {
            const prog = proj.progressPercent ?? 0;
            return (
              <Card key={proj.id} hoverEffect className="p-4 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {proj.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">{prog}%</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">{proj.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{proj.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mr-3">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${prog}%` }} />
                  </div>
                  <Link
                    to={`/app/projects/${proj.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:underline shrink-0"
                  >
                    Open
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* RECENT TASKS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {user?.role === 'STUDENT' ? 'My Upcoming Tasks' : 'Recent Course Tasks'}
          </h2>
          <Link
            to="/app/tasks"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Open Kanban Board <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-white text-xs text-slate-400">
            No active tasks found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTasks.map((t, idx) => (
              <TaskCard
                key={t.id}
                task={t}
                index={idx}
                onClick={() => setSelectedTask(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskDetailModal
        taskId={selectedTask?.id || null}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={fetchDashboardData}
      />

      <CreateTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onTaskCreated={fetchDashboardData}
      />

      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onProjectCreated={fetchDashboardData}
      />
    </div>
  );
};
