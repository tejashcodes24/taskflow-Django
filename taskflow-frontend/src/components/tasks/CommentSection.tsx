import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { Comment, Task } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';

interface Props {
  task: Task;
  projectId: string;
}

export function CommentSection({ task, projectId }: Props) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/tasks/${task.id}/comments`);
      setComments(res.data);
    } catch {
      // Silently fail — not critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // Listen for live new comments on this task
    const socket = getSocket();
    socket.on('comment:created', ({ taskId, comment }: { taskId: string; comment: Comment }) => {
      if (taskId === task.id) {
        setComments((prev) => [...prev, comment]);
      }
    });
    socket.on('comment:deleted', ({ commentId }: { commentId: string }) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });

    return () => {
      socket.off('comment:created');
      socket.off('comment:deleted');
    };
  }, [task.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/tasks/${task.id}/comments`, { body });
      setBody('');
      // Socket will push the new comment back to us
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-slate-300">Comments</h4>

      {loading ? (
        <div className="flex justify-center py-4"><Spinner size="sm" /></div>
      ) : comments.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">No comments yet</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary-600/30 flex items-center justify-center
                              text-xs font-bold text-primary-300 shrink-0">
                {c.author.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-slate-300">{c.author.name}</span>
                  <span className="text-xs text-slate-600">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
        <div className="w-7 h-7 rounded-full bg-primary-600/30 flex items-center justify-center
                        text-xs font-bold text-primary-300 shrink-0 mt-1">
          {user?.name[0].toUpperCase()}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            className="input-base flex-1"
            placeholder="Add a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40
                       rounded-lg transition-colors"
          >
            {submitting ? <Spinner size="sm" /> : <Send size={14} className="text-white" />}
          </button>
        </div>
      </form>
    </div>
  );
}