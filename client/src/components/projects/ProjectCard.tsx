import React from 'react';
import { Project } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Users, CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const progress = project.progressPercent ?? 0;
  const completed = project.completedTasks ?? 0;
  const total = project.totalTasks ?? 0;
  const memberCount = project._count?.members ?? project.members?.length ?? 0;

  return (
    <Card hoverEffect className="flex flex-col justify-between p-5 border border-slate-200">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            {project.code}
          </span>
          <Badge
            variant={
              project.status === 'ACTIVE'
                ? 'emerald'
                : project.status === 'COMPLETED'
                ? 'sky'
                : 'slate'
            }
            size="sm"
          >
            {project.status}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1.5 leading-snug">
          {project.title}
        </h3>

        {/* Department & Faculty */}
        <p className="text-xs text-slate-500 mb-3">
          {project.faculty?.fullName ? `Lead: ${project.faculty.fullName}` : project.department}
        </p>

        {/* Description snippet */}
        {project.description && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-4">
            {project.description}
          </p>
        )}
      </div>

      {/* Progress & Footer */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">Progress</span>
            <span className="font-bold text-slate-900">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom Counts & Link */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              {completed}/{total} Tasks
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {memberCount} Students
            </span>
          </div>

          <Link
            to={`/app/projects/${project.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Open <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
