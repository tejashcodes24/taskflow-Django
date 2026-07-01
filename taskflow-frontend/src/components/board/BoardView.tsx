import type { BoardTasks, Task, TaskStatus } from '@/types';
import { BoardColumn } from './BoardColumn';

interface Props {
  tasks: BoardTasks;
  onTaskClick: (task: Task) => void;
  onAddTask: (status?: TaskStatus) => void;
}

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];

export function BoardView({ tasks, onTaskClick, onAddTask }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {COLUMNS.map((status) => (
        <BoardColumn
          key={status}
          status={status}
          tasks={tasks[status]}
          onTaskClick={onTaskClick}
          onAddTask={() => onAddTask(status)}
        />
      ))}
    </div>
  );
}