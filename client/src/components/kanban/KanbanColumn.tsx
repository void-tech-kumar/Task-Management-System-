import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { statusConfig, cn } from '../../utils';
import { KANBAN_COLUMN_THEMES } from '../../theme/theme';

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
  const colTheme = KANBAN_COLUMN_THEMES[status];

  return (
    <div
      className={cn(
        'flex flex-col w-full min-w-[280px] max-w-sm rounded-2xl p-3 sm:p-4 border shadow-sm',
        colTheme.container
      )}
    >
      {/* Column Header */}
      <div className={cn('flex items-center justify-between pb-3 mb-3 border-b', colTheme.headerBorder)}>
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: config.color }}
          />
          <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
            {config.label}
          </h3>
        </div>
        <span
          className={cn(
            'flex h-5 min-w-[20px] items-center justify-center rounded-full px-2 text-xs font-bold',
            colTheme.countBadge
          )}
        >
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
              snapshot.isDraggingOver ? colTheme.dragOver : ''
            )}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-white/60 p-4 text-center text-xs font-medium text-[#475569]">
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
