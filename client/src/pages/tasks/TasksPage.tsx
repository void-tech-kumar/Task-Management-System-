import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tasksApi, projectsApi } from '../../services/api';
import { Task, Project, TaskStatus, Priority, TaskCategory, TaskSubmission } from '../../types';
import { KanbanBoard } from '../../components/kanban/KanbanBoard';
import { TaskDetailModal } from '../../components/kanban/TaskDetailModal';
import { CreateTaskModal } from '../../components/kanban/CreateTaskModal';
import { EvaluateModal } from '../../components/submissions/EvaluateModal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  LayoutGrid,
  List,
  Plus,
  Filter,
  Search,
  CheckSquare,
  Calendar,
} from 'lucide-react';
import { priorityConfig, categoryConfig, statusConfig, formatDate } from '../../utils';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);

  // Modals
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [evaluateSubmission, setEvaluateSubmission] = useState<TaskSubmission | null>(null);

  const fetchTasksAndProjects = async () => {
    try {
      setLoading(true);
      const [tasksRes, projRes] = await Promise.all([
        tasksApi.getTasks(),
        projectsApi.getProjects(),
      ]);
      setTasks(tasksRes.data.data.tasks);
      setProjects(projRes.data.data.projects);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndProjects();
  }, []);

  // Handle Drag & Drop Status Transition (Optimistic Update)
  const handleStatusChange = async (
    taskId: string,
    newStatus: TaskStatus,
    newOrderIndex?: number
  ) => {
    const originalTasks = [...tasks];

    // Optimistically update local state
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              orderIndex: newOrderIndex !== undefined ? newOrderIndex : t.orderIndex,
            }
          : t
      )
    );

    try {
      await tasksApi.updateTaskStatus(taskId, {
        status: newStatus,
        orderIndex: newOrderIndex,
      });
    } catch (err: any) {
      // Rollback on failure
      setTasks(originalTasks);
      alert(err.message || 'Failed to update task position. Changes reverted.');
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedProjectId !== 'ALL' && task.projectId !== selectedProjectId) return false;
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) return false;
      if (selectedCategory !== 'ALL' && task.category !== selectedCategory) return false;
      if (assignedToMeOnly && user) {
        const isAssigned = task.assignments?.some((a) => a.userId === user.id);
        if (!isAssigned) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q) ?? false;
        const matchesCode = task.project?.code.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesCode) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectId, selectedPriority, selectedCategory, assignedToMeOnly, searchQuery, user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Task Scheduling & Kanban Board
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize workloads, drag and drop tasks across milestones, and track academic submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {(user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="rounded-xl bg-white p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1">
            <Input
              placeholder="Search tasks by title, description, or course code..."
              icon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Project filter */}
          <div className="w-full md:w-56">
            <Select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Projects / Courses' },
                ...projects.map((p) => ({ value: p.id, label: `${p.code} - ${p.title}` })),
              ]}
            />
          </div>

          {/* Priority filter */}
          <div className="w-full md:w-36">
            <Select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Priorities' },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
            />
          </div>

          {/* Category filter */}
          <div className="w-full md:w-40">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'ASSIGNMENT', label: 'Assignment' },
                { value: 'LAB_WORK', label: 'Lab Work' },
                { value: 'PROJECT_MILESTONE', label: 'Milestone' },
                { value: 'READING', label: 'Reading' },
                { value: 'PERSONAL', label: 'Personal' },
              ]}
            />
          </div>
        </div>

        {/* Assigned to me toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={assignedToMeOnly}
              onChange={(e) => setAssignedToMeOnly(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show only tasks assigned to me</span>
          </label>
          <span className="text-slate-400">
            Showing <strong className="text-slate-800">{filteredTasks.length}</strong> tasks
          </span>
        </div>
      </div>

      {/* MAIN VIEW: KANBAN OR LIST */}
      {loading ? (
        <Spinner label="Loading tasks board..." size="lg" className="my-16" />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6" />}
          title="No tasks match your criteria"
          description="Try adjusting your filters, searching for a different keyword, or create a new task."
          actionLabel={(user?.role === 'FACULTY' || user?.role === 'ADMIN') ? 'Create Task' : undefined}
          onAction={() => setCreateModalOpen(true)}
        />
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onTaskClick={(t) => setSelectedTaskId(t.id)}
        />
      ) : (
        /* List Table View */
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Assignees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{t.title}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-indigo-600">{t.project?.code}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-medium ${statusConfig[t.status].badge}`}>
                        {statusConfig[t.status].label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-medium ${priorityConfig[t.priority].badge}`}>
                        {priorityConfig[t.priority].label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md font-semibold text-[10px] ${categoryConfig[t.category].badge}`}>
                        {categoryConfig[t.category].label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(t.dueDate)}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-500 font-medium">
                        {t.assignments?.length || 0} student(s)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={fetchTasksAndProjects}
        onOpenEvaluateModal={(sub) => {
          setSelectedTaskId(null);
          setEvaluateSubmission(sub);
        }}
      />

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTaskCreated={fetchTasksAndProjects}
      />

      <EvaluateModal
        submission={evaluateSubmission}
        isOpen={!!evaluateSubmission}
        onClose={() => setEvaluateSubmission(null)}
        onEvaluated={fetchTasksAndProjects}
      />
    </div>
  );
};
