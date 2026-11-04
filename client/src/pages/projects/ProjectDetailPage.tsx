import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectsApi, usersApi, tasksApi } from '../../services/api';
import { Project, User, Task, TaskStatus } from '../../types';
import { KanbanBoard } from '../../components/kanban/KanbanBoard';
import { TaskDetailModal } from '../../components/kanban/TaskDetailModal';
import { CreateTaskModal } from '../../components/kanban/CreateTaskModal';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { Card } from '../../components/common/Card';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  BookOpen,
  LayoutGrid,
} from 'lucide-react';
import { formatDate, statusConfig } from '../../utils';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'students' | 'overview'>('tasks');

  // Modals
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [selectedEnrollIds, setSelectedEnrollIds] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await projectsApi.getProjectById(id);
      setProject(res.data.data.project);
    } catch (err: any) {
      console.error('Error fetching project:', err);
      alert(err.message || 'Failed to load course details');
      navigate('/app/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleStatusChange = async (
    taskId: string,
    newStatus: TaskStatus,
    newOrderIndex?: number
  ) => {
    if (!project) return;
    const originalTasks = [...(project.tasks || [])];

    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: (prev.tasks || []).map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus,
                orderIndex: newOrderIndex !== undefined ? newOrderIndex : t.orderIndex,
              }
            : t
        ),
      };
    });

    try {
      await tasksApi.updateTaskStatus(taskId, {
        status: newStatus,
        orderIndex: newOrderIndex,
      });
    } catch (err: any) {
      setProject((prev) => (prev ? { ...prev, tasks: originalTasks } : prev));
      alert(err.message || 'Failed to update task');
    }
  };

  const handleOpenEnrollModal = async () => {
    try {
      const res = await usersApi.getStudents();
      setAllStudents(res.data.data.students);
      setSelectedEnrollIds([]);
      setEnrollModalOpen(true);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || selectedEnrollIds.length === 0) return;
    try {
      setEnrolling(true);
      await projectsApi.addMembers(id, selectedEnrollIds);
      await fetchProjectDetails();
      setEnrollModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to enroll students');
    } finally {
      setEnrolling(false);
    }
  };

  const handleRemoveStudent = async (studentUserId: string) => {
    if (!id || !confirm('Remove this student from the course?')) return;
    try {
      await projectsApi.removeMember(id, studentUserId);
      await fetchProjectDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
    }
  };

  if (loading) {
    return <Spinner label="Loading course workspace..." size="lg" className="my-20" />;
  }

  if (!project) return null;

  const isManager =
    user?.role === 'ADMIN' || (user?.role === 'FACULTY' && project.facultyId === user.id);
  const enrolledStudents = project.members || [];
  const tasks = project.tasks || [];
  const progress = project.progressPercent || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button & Title Header */}
      <div>
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                {project.code}
              </span>
              <Badge variant="emerald">{project.status}</Badge>
              {project.department && (
                <span className="text-xs text-slate-500">• {project.department}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {project.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Lead Faculty: <strong className="text-slate-700">{project.faculty?.fullName}</strong> ({project.faculty?.email})
            </p>
          </div>

          {/* Action buttons */}
          {isManager && (
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                icon={<Users className="w-4 h-4" />}
                onClick={handleOpenEnrollModal}
              >
                Enroll Students
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setCreateTaskOpen(true)}
              >
                Add Task
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Quick Stats Card */}
      <Card className="p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-slate-700">
              <span>Overall Course Completion</span>
              <span className="font-bold text-slate-900">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Total Tasks
              </span>
              <span className="text-base font-bold text-slate-900">
                {project.completedTasks} / {project.totalTasks} Done
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Enrolled Students
              </span>
              <span className="text-base font-bold text-slate-900">
                {enrolledStudents.length} Students
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 md:text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              Academic Term Dates
            </span>
            <span>
              {formatDate(project.startDate)} &mdash; {formatDate(project.endDate)}
            </span>
          </div>
        </div>
      </Card>

      {/* TABS NAVIGATION */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Course Tasks ({tasks.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'students'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Enrolled Students ({enrolledStudents.length})
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Syllabus Overview
          </button>
        </nav>
      </div>

      {/* TAB CONTENT 1: TASKS KANBAN */}
      {activeTab === 'tasks' && (
        <div className="pt-2">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-white text-xs text-slate-400">
              No tasks created in this course yet.
              {isManager && (
                <div className="mt-3">
                  <Button size="sm" onClick={() => setCreateTaskOpen(true)}>
                    Create First Task
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <KanbanBoard
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onTaskClick={(t) => setSelectedTaskId(t.id)}
            />
          )}
        </div>
      )}

      {/* TAB CONTENT 2: ENROLLED STUDENTS */}
      {activeTab === 'students' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Enrolled At</th>
                  {isManager && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrolledStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No students enrolled yet.
                    </td>
                  </tr>
                ) : (
                  enrolledStudents.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                          {m.user?.fullName?.[0]?.toUpperCase()}
                        </div>
                        {m.user?.fullName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{m.user?.email}</td>
                      <td className="py-3.5 px-4 text-slate-500">{m.user?.department || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(m.joinedAt)}</td>
                      {isManager && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleRemoveStudent(m.userId)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove from course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SYLLABUS OVERVIEW */}
      {activeTab === 'overview' && (
        <Card className="p-6 border border-slate-200 space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
              Course Syllabus & Learning Objectives
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {project.description || 'No detailed syllabus uploaded.'}
            </p>
          </div>
        </Card>
      )}

      {/* Modals */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={fetchProjectDetails}
      />

      <CreateTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onTaskCreated={fetchProjectDetails}
        defaultProjectId={project.id}
      />

      {/* Enroll Students Modal */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title="Enroll Students in Course"
        maxWidth="md"
      >
        <form onSubmit={handleEnrollSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Select students to register into <strong>{project.code}</strong>:
          </p>
          <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-1.5 bg-slate-50">
            {allStudents.map((st) => {
              const alreadyEnrolled = enrolledStudents.some((m) => m.userId === st.id);
              const isSelected = selectedEnrollIds.includes(st.id);
              return (
                <label
                  key={st.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors ${
                    alreadyEnrolled
                      ? 'opacity-50 cursor-not-allowed bg-slate-100'
                      : isSelected
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 cursor-pointer'
                      : 'bg-white hover:bg-slate-100 text-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      disabled={alreadyEnrolled}
                      checked={alreadyEnrolled || isSelected}
                      onChange={() => {
                        if (alreadyEnrolled) return;
                        setSelectedEnrollIds((prev) =>
                          prev.includes(st.id) ? prev.filter((i) => i !== st.id) : [...prev, st.id]
                        );
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-semibold block">{st.fullName}</span>
                      <span className="text-[11px] text-slate-400">{st.email}</span>
                    </div>
                  </div>
                  {alreadyEnrolled && (
                    <span className="text-[10px] font-semibold text-slate-400">Enrolled</span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEnrollModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={enrolling}
              disabled={selectedEnrollIds.length === 0}
            >
              Confirm Enrollment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
