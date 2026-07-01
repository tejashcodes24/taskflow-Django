import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Task, TaskStatus, TaskPriority, Membership } from '@/types';
import api from '@/lib/api';
import { AxiosError } from 'axios';

interface Props {
  projectId: string;
  task?: Task;              // if provided — edit mode
  onSaved: (task: Task) => void;
  onCancel: () => void;
}

export function TaskForm({ projectId, task, onSaved, onCancel }: Props) {
  const [members, setMembers] = useState<Membership[]>([]);
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo' as TaskStatus,
    priority: task?.priority ?? 'medium' as TaskPriority,
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    assigneeId: task?.assigneeId ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    api.get(`/projects/${projectId}/members`).then((r) => setMembers(r.data));
  }, [projectId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title cannot be empty';
    if (form.dueDate) {
      const due = new Date(form.dueDate);
      due.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due < today) e.dueDate = 'Due date cannot be in the past';
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        ...form,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || undefined,
      };
      const res = task
        ? await api.patch(`/projects/${projectId}/tasks/${task.id}`, payload)
        : await api.post(`/projects/${projectId}/tasks`, payload);
      onSaved(res.data);
    } catch (err) {
      const e = err as AxiosError<any>;
      setServerError(e.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {serverError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {serverError}
        </div>
      )}

      <Input
        label="Title"
        placeholder="Task title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        error={errors.title}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">Description</label>
        <textarea
          className="input-base resize-none"
          rows={3}
          placeholder="What needs to be done?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">Status</label>
          <select
            className="input-base"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">Priority</label>
          <select
            className="input-base"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Due date (optional)"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          error={errors.dueDate}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">Assignee (optional)</label>
          <select
            className="input-base"
            value={form.assigneeId}
            onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.user.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {task ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}