import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { projectsApi, usersApi } from '../../services/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStudents();
    }
  }, [isOpen]);

  const loadStudents = async () => {
    try {
      const res = await usersApi.getStudents();
      setStudents(res.data.data.students);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      setError('Project title and course code are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await projectsApi.createProject({
        title: title.trim(),
        code: code.trim().toUpperCase(),
        department: department.trim() || undefined,
        description: description.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        memberStudentIds: selectedStudentIds,
      });

      setTitle('');
      setCode('');
      setDepartment('');
      setDescription('');
      setSelectedStudentIds([]);
      onProjectCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Academic Project / Course" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Course / Project Title"
              required
              placeholder="e.g. Distributed Systems & Cloud"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Code"
              required
              placeholder="e.g. CS401"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>

        <Input
          label="Department"
          placeholder="e.g. Computer Science & Engineering"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Syllabus Overview & Description
          </label>
          <textarea
            rows={3}
            placeholder="Course syllabus, milestones, lab objectives..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Enroll Students */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Enroll Students ({selectedStudentIds.length} selected)
          </label>
          <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-1.5 bg-slate-50/50">
            {students.length === 0 ? (
              <p className="text-xs text-slate-400 p-2">No students found.</p>
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

