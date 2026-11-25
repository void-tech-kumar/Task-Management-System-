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
import { STAT_CARD_THEMES } from '../../theme/theme';
import { cn } from '../../utils';

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
          <Card className={cn('p-5 border', STAT_CARD_THEMES.projects.card)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Active Projects</span>
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.projects.iconWrap)}>
                <FolderKanban className="w-4 h-4" />
              </span>
            </div>
            <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.projects.value)}>{metrics.activeProjects}</div>
            <p className="text-xs text-[#475569] mt-1">Out of {metrics.totalProjects} total courses</p>
          </Card>

          <Card className={cn('p-5 border', STAT_CARD_THEMES.tasks.card)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Total Users & Tasks</span>
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.tasks.iconWrap)}>
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.tasks.value)}>{metrics.totalUsers}</div>
            <p className="text-xs text-[#475569] mt-1">
              {metrics.roleDistribution.faculty} Faculty • {metrics.roleDistribution.student} Students • {metrics.totalTasks} Tasks
            </p>
          </Card>

          <Card className={cn('p-5 border', STAT_CARD_THEMES.completed.card)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Completion Velocity</span>
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.completed.iconWrap)}>
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.completed.value)}>{metrics.globalCompletionRate}%</div>
            <p className="text-xs text-[#475569] mt-1">
              {metrics.completedTasks} / {metrics.totalTasks} Tasks completed
            </p>
          </Card>

          <Card className={cn('p-5 border', STAT_CARD_THEMES.pending.card)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Evaluations Rate</span>
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.pending.iconWrap)}>
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.pending.value)}>{metrics.evaluationRate}%</div>
            <p className="text-xs text-[#475569] mt-1">
              {metrics.evaluatedSubmissions} of {metrics.totalSubmissions} submissions graded
            </p>
          </Card>
        </div>
      )}

      {user?.role === 'FACULTY' && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={cn('p-5 border', STAT_CARD_THEMES.projects.card)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">My Courses</span>
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.projects.iconWrap)}>
                <FolderKanban className="w-4 h-4" />
              </span>
            </div>
            <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.projects.value)}>{metrics.totalProjects}</div>
            <p className="text-xs text-[#475569] mt-1">{metrics.totalStudentsEnrolled} Enrolled Students</p>
          </Card>

          <Card className={cn('p-5 border', STAT_CARD_THEMES.tasks.card)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Total Course Tasks</span>
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.tasks.iconWrap)}>
                <GraduationCap className="w-4 h-4" />
              </span>
            </div>
            <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.tasks.value)}>{metrics.totalTasks}</div>
            <p className="text-xs text-[#475569] mt-1">Cohort Avg Grade: {metrics.averageGradeGiven} pts</p>
          </Card>

          <Card className={cn('p-5 border', STAT_CARD_THEMES.completed.card)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Task Completion</span>
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.completed.iconWrap)}>
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.completed.value)}>{metrics.completionRate}%</div>
            <p className="text-xs text-[#475569] mt-1">
              {metrics.completedTasks} / {metrics.totalTasks} Tasks completed
            </p>
          </Card>

          <Card className={cn('p-5 border', STAT_CARD_THEMES.pending.card)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Pending Evaluations</span>
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.pending.iconWrap)}>
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.pending.value)}>{metrics.pendingEvaluations}</div>
            <Link to="/app/evaluations" className="text-xs text-[#4F46E5] hover:underline mt-1 inline-block font-semibold">
              Open Grading Portal &rarr;
            </Link>
          </Card>
        </div>
      )}

      {user?.role === 'STUDENT' && metrics && (
        <div className="space-y-4">
          {metrics.overdueTasks > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-300 flex items-center justify-between text-red-900 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Action Required: You have {metrics.overdueTasks} overdue task(s)!</h4>
                  <p className="text-xs text-red-800">Please review your tasks board and submit pending deliverables.</p>
                </div>
              </div>
              <Link to="/app/tasks">
                <Button variant="danger" size="sm">
                  View Tasks
                </Button>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className={cn('p-5 border', STAT_CARD_THEMES.projects.card)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Total Projects</span>
                <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.projects.iconWrap)}>
                  <FolderKanban className="w-4 h-4" />
                </span>
              </div>
              <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.projects.value)}>{metrics.enrolledProjects}</div>
              <p className="text-xs text-[#475569] mt-1">Academic workspaces</p>
            </Card>

            <Card className={cn('p-5 border', STAT_CARD_THEMES.tasks.card)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Total Tasks</span>
                <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.tasks.iconWrap)}>
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.tasks.value)}>{metrics.totalAssignedTasks}</div>
              <p className="text-xs text-[#475569] mt-1">Avg Grade: {metrics.averageGradePercent}%</p>
            </Card>

            <Card className={cn('p-5 border', STAT_CARD_THEMES.completed.card)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Completed Tasks</span>
                <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.completed.iconWrap)}>
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.completed.value)}>{metrics.completedTasks}</div>
              <p className="text-xs text-[#475569] mt-1">{metrics.completionRate}% completion rate</p>
            </Card>

            <Card className={cn('p-5 border', STAT_CARD_THEMES.pending.card)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Pending Tasks</span>
                <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.pending.iconWrap)}>
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.pending.value)}>
                {(metrics.totalAssignedTasks ?? 0) - (metrics.completedTasks ?? 0)}
              </div>
              <p className="text-xs text-[#475569] mt-1">
                {metrics.inProgressTasks} In Progress • {metrics.inReviewTasks} In Review
              </p>
            </Card>

            <Card className={cn('p-5 border', STAT_CARD_THEMES.overdue.card)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Overdue Tasks</span>
                <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', STAT_CARD_THEMES.overdue.iconWrap)}>
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className={cn('text-2xl font-extrabold', STAT_CARD_THEMES.overdue.value)}>{metrics.overdueTasks}</div>
              <p className="text-xs text-[#475569] mt-1">
                {metrics.overdueTasks > 0 ? 'Needs immediate attention' : 'All deadlines on track'}
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
                isDraggable={false}
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

