import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TaskForm } from './TaskForm';
import { CommentSection } from './CommentSection';
import type { Task } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { useBoardStore } from '@/store/board.store';
import {
  Calendar, User, Edit2, Trash2,
  AlertCircle, CheckCircle,
} from 'lucide-react';
import api from '@/lib/api';

interface Props {
  task: Task;
  projectId: string;
  isOwner: boolean;
  onClose: () => void;
}

export function TaskModal({ task, projectId, isOwner, onClose }: Props) {
  const { user } = useAuthStore();
  const { updateTask, removeTask } = useBoardStore();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleSaved = (updated: Task) => {
    updateTask(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}`);
      removeTask(task.id);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete task');
      setDeleting(false);
    }
  };

  const canDelete = isOwner || task.createdById === user?.id;

  return (
    <Modal isOpen onClose={onClose} size="xl">
      {editing ? (
        <>
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Edit task</h2>
          <TaskForm
            projectId={projectId}
            task={task}
            onSaved={handleSaved}
            onCancel={() => setEditing(false)}
          />
        </>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="status" value={task.status} label="" />
                <Badge variant="priority" value={task.priority} label="" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100">{task.title}</h2>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <Edit2 size={14} /> Edit
              </Button>
              {canDelete && (
                <Button variant="danger" onClick={handleDelete} loading={deleting}>
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10
                            border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Description */}
          {task.description && (
            <p className="text-slate-400 text-sm leading-relaxed">{task.description}</p>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 flex items-center gap-2">
              <User size={14} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Assignee</p>
                <p className="text-sm text-slate-300">
                  {task.assignee?.name ?? 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="card p-3 flex items-center gap-2">
              <Calendar size={14} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Due date</p>
                <p className="text-sm text-slate-300">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : 'No due date'}
                </p>
              </div>
            </div>

            {task.completedAt && (
              <div className="card p-3 flex items-center gap-2 col-span-2">
                <CheckCircle size={14} className="text-green-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Completed</p>
                  <p className="text-sm text-green-400">
                    {new Date(task.completedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-600">
            Created by {task.createdBy?.name} on{' '}
            {new Date(task.createdAt).toLocaleDateString()}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700" />

          {/* Comments */}
          <CommentSection task={task} projectId={projectId} />
        </div>
      )}
    </Modal>
  );
}