import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Membership } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { Crown, UserMinus, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { AxiosError } from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  members: Membership[];
  isOwner: boolean;
  onMemberRemoved: (userId: string) => void;
}

export function MembersModal({
  isOpen,
  onClose,
  projectId,
  members,
  isOwner,
  onMemberRemoved,
}: Props) {
  const { user } = useAuthStore();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleRemove = async (targetUserId: string, name: string) => {
    if (!confirm(`Remove ${name} from this project?`)) return;
    setError('');
    setRemovingId(targetUserId);
    try {
      await api.delete(`/projects/${projectId}/members/${targetUserId}`);
      onMemberRemoved(targetUserId);
    } catch (err) {
      const e = err as AxiosError<any>;
      setError(e.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Members (${members.length})`}
      size="sm"
    >
      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20
                        text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {members.map((m) => {
          const isCurrentUser = m.userId === user?.id;
          const isThisOwner = m.role === 'owner';

          return (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-900
                         border border-slate-800"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary-600/30 flex items-center
                                justify-center text-sm font-bold text-primary-300 shrink-0">
                  {m.user.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-slate-200">{m.user.name}</p>
                    {isCurrentUser && (
                      <span className="text-xs text-slate-500">(you)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{m.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Role badge */}
                {isThisOwner ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full
                                   bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                    <Crown size={10} />
                    Owner
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full
                                   bg-slate-700 text-slate-400">
                    Member
                  </span>
                )}

                {/* Remove button — only owner can remove, cannot remove themselves */}
                {isOwner && !isThisOwner && !isCurrentUser && (
                  <Button
                    variant="danger"
                    onClick={() => handleRemove(m.userId, m.user.name)}
                    loading={removingId === m.userId}
                    className="px-2 py-1 text-xs"
                  >
                    <UserMinus size={13} />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}