import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function InviteMemberModal({ isOpen, onClose, projectId }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Invalid email format'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/members/invite`, { email });
      setSuccess(true);
      setEmail('');
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    } catch (err) {
      const e = err as AxiosError<any>;
      setError(e.response?.data?.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite member" size="sm">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle className="text-green-400" size={40} />
          <p className="text-slate-300 font-medium">Invitation sent!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            Enter the email address of a registered user to invite them to this project.
          </p>
          <Input
            label="Email address"
            type="email"
            placeholder="bob@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            error={error}
          />
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Send invite</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}