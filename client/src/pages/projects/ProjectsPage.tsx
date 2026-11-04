import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { projectsApi } from '../../services/api';
import { Project } from '../../types';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { FolderKanban, Plus, Search } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectsApi.getProjects({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setProjects(res.data.data.projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Academic Courses & Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'STUDENT'
              ? 'Browse enrolled courses, milestones, and syllabus deliverables.'
              : 'Manage cohort cohorts, curricula, enrolled student rosters, and tasks.'}
          </p>
        </div>

        {(user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Course
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <Input
            placeholder="Search courses by title or code..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PLANNING', label: 'Planning' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <Spinner label="Loading projects..." size="lg" className="my-16" />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-6 h-6" />}
          title="No courses found"
          description="You are not enrolled in or managing any projects matching this filter."
          actionLabel={(user?.role === 'FACULTY' || user?.role === 'ADMIN') ? 'Create Course' : undefined}
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onProjectCreated={fetchProjects}
      />
    </div>
  );
};

