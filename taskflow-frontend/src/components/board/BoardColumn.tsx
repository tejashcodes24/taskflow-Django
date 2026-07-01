import type { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

const columnMeta: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  todo: {
    label: 'To Do',
    color: 'border-t-slate-500',
    dot: 'bg-slate-500',
  },
  in_progress: {
    label: 'In Progress',
    color: 'border-t-blue-500',
    dot: 'bg-blue-500',
  },
  done: {
    label: 'Done',
    color: 'border-t-green-500',
    dot: 'bg-green-500',
  },
};

export function BoardColumn({ status, tasks, onTaskClick, onAddTask }: Props) {
  const meta = columnMeta[status];

  return (
    <div className={clsx(
      'card border-t-2 flex flex-col min-h-96 w-full',
      meta.color
    )}>
      {/* Column header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', meta.dot)} />
          <span className="text-sm font-semibold text-slate-300">{meta.label}</span>
          <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="p-1 rounded-md hover:bg-slate-700 text-slate-500
                     hover:text-slate-300 transition-colors"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2 p-3 pt-1 flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed
                          border-slate-700 rounded-lg min-h-24">
            <p className="text-xs text-slate-600">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))
        )}
      </div>
    </div>
  );
}