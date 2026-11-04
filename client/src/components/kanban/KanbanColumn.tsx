import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { statusConfig, cn } from '../../utils';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  onTaskClick,
}) => {
  const config = statusConfig[status];

  return (
    <div className="flex flex-col w-full min-w-[280px] max-w-sm rounded-2xl bg-slate-100/70 p-3 sm:p-4 border border-slate-200/60 shadow-xs">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            {config.label}
          </h3>
        </div>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200 px-2 text-xs font-semibold text-slate-700">
          {tasks.length}
        </span>
      </div>

      {/* Droppable Task List */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 min-h-[300px] transition-colors rounded-xl p-1',
              snapshot.isDraggingOver ? 'bg-indigo-50/60 ring-2 ring-indigo-300 ring-dashed' : ''
            )}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                Drop tasks here
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onClick={() => onTaskClick(task)}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
