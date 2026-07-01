import type{ Task } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Calendar, User } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: Props) {
  const isOverdue =
    task.dueDate &&
    task.status !== 'done' &&
    new Date(task.dueDate) < new Date();

  return (
    <div
      onClick={onClick}
      className="card p-3 cursor-pointer hover:border-primary-500/40
                 hover:bg-slate-700/50 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-200 group-hover:text-white
                      transition-colors line-clamp-2 flex-1">
          {task.title}
        </p>
        <Badge variant="priority" value={task.priority} label="" />
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary-600/30 flex items-center
                            justify-center text-xs font-bold text-primary-300">
              {task.assignee.name[0].toUpperCase()}
            </div>
            <span className="text-xs text-slate-500">{task.assignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <User size={12} /> Unassigned
          </div>
        )}

        {task.dueDate && (
          <div className={clsx(
            'flex items-center gap-1 text-xs',
            isOverdue ? 'text-red-400' : 'text-slate-500'
          )}>
            <Calendar size={11} />
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}