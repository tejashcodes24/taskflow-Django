import { clsx } from 'clsx';
import type { TaskPriority, TaskStatus } from '@/types';

interface BadgeProps {
  label: string;
  variant: 'status' | 'priority';
  value: TaskStatus | TaskPriority;
}

const statusStyles: Record<TaskStatus, string> = {
  todo: 'bg-slate-700 text-slate-300',
  in_progress: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  done: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-slate-700 text-slate-400',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function Badge({ variant, value }: BadgeProps) {
  const style =
    variant === 'status'
      ? statusStyles[value as TaskStatus]
      : priorityStyles[value as TaskPriority];

  const label =
    variant === 'status'
      ? statusLabels[value as TaskStatus]
      : priorityLabels[value as TaskPriority];

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        style
      )}
    >
      {label}
    </span>
  );
}