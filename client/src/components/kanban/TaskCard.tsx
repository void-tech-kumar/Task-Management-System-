import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '../../types';
import { priorityConfig, categoryConfig, getDueStatus, cn } from '../../utils';
import { Calendar, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  const { user } = useAuth();
  const priority = priorityConfig[task.priority];
  const category = categoryConfig[task.category];
  const dueInfo = getDueStatus(task.dueDate, task.status === 'COMPLETED');

  // Check personal submission status if student
  const mySubmission = task.submissions?.find((s) => s.studentId === user?.id);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            'group relative mb-3 rounded-xl border bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-md cursor-pointer select-none',
            snapshot.isDragging
              ? 'border-indigo-400 shadow-xl ring-2 ring-indigo-200 rotate-1 scale-[1.02]'
              : 'border-slate-200/80',
            dueInfo.isOverdue && 'border-rose-200/90'
          )}
        >
          {/* Top Row: Category Tag & Priority Badge */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span
              className={cn(
                'inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                category.badge
              )}
            >
              {category.label}
            </span>
            <span
              className={cn(
                'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border',
                priority.badge
              )}
            >
              {priority.label}
            </span>
          </div>

          {/* Project Code */}
          {task.project && (
            <p className="text-[11px] font-semibold text-indigo-600 mb-1">
              {task.project.code}
            </p>
          )}

          {/* Title */}
          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
            {task.title}
          </h4>

          {/* Description snippet if any */}
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          {/* Personal Submission Status Badge if Student */}
          {user?.role === 'STUDENT' && mySubmission && (
            <div className="mb-3">
              {mySubmission.status === 'EVALUATED' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle className="w-3 h-3" />
                  Score: {mySubmission.grade}/{task.maxPoints}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Clock className="w-3 h-3" />
                  Submitted (In Review)
                </span>
              )}
            </div>
          )}

          {/* Bottom Row: Due date countdown & Assignees / Comments */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px]',
                dueInfo.color
              )}
            >
              <Calendar className="w-3 h-3" />
              {dueInfo.label}
            </span>

            <div className="flex items-center gap-2">
              {/* Comment Count */}
              {(task._count?.comments || 0) > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <MessageSquare className="w-3 h-3" />
                  {task._count?.comments}
                </span>
              )}

              {/* Assignee Avatars */}
              <div className="flex -space-x-1.5 overflow-hidden">
                {task.assignments && task.assignments.length > 0 ? (
                  task.assignments.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="w-5 h-5 rounded-full bg-slate-200 border border-white text-[9px] font-bold text-slate-700 flex items-center justify-center shrink-0"
                      title={a.user?.fullName}
                    >
                      {a.user?.fullName?.[0]?.toUpperCase() || 'S'}
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                )}
                {task.assignments && task.assignments.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-white text-[9px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                    +{task.assignments.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
