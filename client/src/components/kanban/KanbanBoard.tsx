import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus, newOrderIndex?: number) => Promise<void>;
  onTaskClick: (task: Task) => void;
}

const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onStatusChange,
  onTaskClick,
}) => {
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const newOrderIndex = destination.index;

    // Trigger parent state transition & API call
    await onStatusChange(draggableId, newStatus, newOrderIndex);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex w-full gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 items-start scrollbar-thin scrollbar-thumb-slate-300">
        {COLUMNS.map((colStatus) => {
          const colTasks = tasks
            .filter((t) => t.status === colStatus)
            .sort((a, b) => a.orderIndex - b.orderIndex);

          return (
            <KanbanColumn
              key={colStatus}
              status={colStatus}
              tasks={colTasks}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
};
