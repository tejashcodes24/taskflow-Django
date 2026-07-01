import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Calendar, FolderKanban } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { Task } from '@/types';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { clsx } from 'clsx';

export function AssignedPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/me/assigned');
      setTasks(res.data);
    } catch {
      setError('Failed to load assigned tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Live update — when a task is assigned to me, it appears instantly
    const socket = getSocket();
    socket.on('task:assigned', (task: Task) => {
      setTasks((prev) => {
        const exists = prev.find((t) => t.id === task.id);
        if (exists) return prev.map((t) => (t.id === task.id ? task : t));
        return [task, ...prev];
      });
    });

    return () => { socket.off('task:assigned'); };
  }, []);

  const grouped = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  return (
    <>
      <Navbar title="Assigned to me" />
      <div className="p-6">
        {loading ? (
          <PageSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchTasks} />
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <CheckSquare size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium">No tasks assigned to you</p>
            <p className="text-slate-500 text-sm mt-1">
              When someone assigns you a task, it will appear here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.entries(grouped).map(([status, statusTasks]) => {
              if (statusTasks.length === 0) return null;
              return (
                <div key={status}>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Done'}
                    <span className="ml-2 text-slate-600 normal-case tracking-normal font-normal">
                      ({statusTasks.length})
                    </span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {statusTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/projects/${task.projectId}`)}
                        className="card p-4 hover:border-primary-500/40 cursor-pointer
                                   transition-all flex items-center justify-between gap-4 group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-200 group-hover:text-white truncate">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-slate-500 truncate mt-0.5">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <FolderKanban size={12} />
                              <span>Go to project</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="priority" value={task.priority} label="" />
                          {task.dueDate && (
                            <div className={clsx(
                              'flex items-center gap-1 text-xs',
                              new Date(task.dueDate) < new Date() && task.status !== 'done'
                                ? 'text-red-400'
                                : 'text-slate-500'
                            )}>
                              <Calendar size={11} />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}