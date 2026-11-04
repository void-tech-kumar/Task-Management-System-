import React, { useState, useEffect } from 'react';
import { Project, User, Priority, TaskCategory } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { tasksApi, projectsApi, usersApi } from '../../services/api';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  defaultProjectId?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  defaultProjectId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [category, setCategory] = useState<TaskCategory>('ASSIGNMENT');
  const [dueDate, setDueDate] = useState('');
  const [maxPoints, setMaxPoints] = useState(100);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [projRes, studRes] = await Promise.all([
        projectsApi.getProjects({ status: 'ACTIVE' }),
        usersApi.getStudents(),
      ]);
      setProjects(projRes.data.data.projects);
      setStudents(studRes.data.data.students);

      if (!projectId && projRes.data.data.projects.length > 0) {
        setProjectId(projRes.data.data.projects[0].id);
      }

      // Default due date to 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setDueDate(defaultDate.toISOString().slice(0, 16));
    } catch (err) {
      console.error('Error loading task modal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !dueDate) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await tasksApi.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId,
        priority,
        category,
        dueDate: new Date(dueDate).toISOString(),
        maxPoints: Number(maxPoints),
        assignedStudentIds: selectedStudentIds,
      });

      // Reset & notify
      setTitle('');
      setDescription('');
      setSelectedStudentIds([]);
      onTaskCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Academic Task" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        {/* Project Select */}
        <Select
          label="Course / Project"
          required
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={projects.map((p) => ({
            value: p.id,
            label: `${p.code} - ${p.title}`,
          }))}
        />

        {/* Task Title */}
        <Input
          label="Task Title"
          required
          placeholder="e.g. Lab 4: Consensus State Machine"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Instructions & Rubric
          </label>
          <textarea
            rows={3}
            placeholder="Detailed requirements, submission criteria, deliverables..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Grid: Category, Priority, Points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            options={[
              { value: 'ASSIGNMENT', label: 'Assignment' },
              { value: 'LAB_WORK', label: 'Lab Work' },
              { value: 'PROJECT_MILESTONE', label: 'Milestone' },
              { value: 'READING', label: 'Reading' },
              { value: 'PERSONAL', label: 'Personal' },
            ]}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
          />

          <Input
            label="Max Points"
            type="number"
            min={0}
            max={1000}
            value={maxPoints}
            onChange={(e) => setMaxPoints(Number(e.target.value))}
          />
        </div>

        {/* Due Date */}
        <Input
          label="Deadline"
          type="datetime-local"
          required
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        {/* Assign Students */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Assign Students ({selectedStudentIds.length} selected)
          </label>
          <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-1.5 bg-slate-50/50">
            {students.length === 0 ? (
              <p className="text-xs text-slate-400 p-2">No students available.</p>
            ) : (
              students.map((student) => {
                const isSelected = selectedStudentIds.includes(student.id);
                return (
                  <label
                    key={student.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors ${
                      isSelected ? 'bg-indigo-50 border border-indigo-200 text-indigo-900' : 'bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleStudent(student.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium">{student.fullName}</span>
                      <span className="text-[11px] text-slate-400">({student.email})</span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
            Publish Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

