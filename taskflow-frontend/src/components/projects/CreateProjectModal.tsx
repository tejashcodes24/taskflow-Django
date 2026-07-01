import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import type { Project } from '@/types';
import { AxiosError } from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export function CreateProjectModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!form.name.trim()) { setErrors({ name: 'Project name is required' }); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post('/projects/', form);
      onCreated(res.data);
      setForm({ name: '', description: '' });
      onClose();
    } catch (err) {
      const e = err as AxiosError<any>;
      setServerError(e.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create new project" size="md">
      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {serverError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Project name"
          placeholder="e.g. TaskFlow Launch"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">
            Description <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            placeholder="What is this project about?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="input-base resize-none"
          />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create project</Button>
        </div>
      </form>
    </Modal>
  );
}