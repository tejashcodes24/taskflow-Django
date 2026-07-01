import { useEffect, useState } from 'react';
import {
  FolderKanban, CheckSquare, TrendingUp,
  Activity, Clock, Target,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useAuthStore } from '@/store/auth.store';
import type { DashboardData } from '@/types';
import api from '@/lib/api';

const activityLabel: Record<string, string> = {
  task_created: 'created task',
  task_moved: 'moved task',
  task_assigned: 'assigned task',
  task_deleted: 'deleted task',
  member_invited: 'invited a member',
  member_removed: 'removed a member',
  comment_added: 'commented on',
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  return (
    <>
      <Navbar title="Dashboard" />
      <div className="p-6 flex flex-col gap-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-white">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-400 mt-1">Here's what's happening across your projects.</p>
        </div>

        {loading ? (
          <PageSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchDashboard} />
        ) : data ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon={<FolderKanban size={20} className="text-primary-400" />}
                label="Projects"
                value={data.projectCount}
                color="primary"
              />
              <StatCard
                icon={<CheckSquare size={20} className="text-green-400" />}
                label="Completed this week"
                value={data.completedThisWeek}
                color="green"
              />
              <StatCard
                icon={<Clock size={20} className="text-blue-400" />}
                label="In progress"
                value={data.totalByStatus.in_progress}
                color="blue"
              />
              <StatCard
                icon={<Target size={20} className="text-yellow-400" />}
                label="To do"
                value={data.totalByStatus.todo}
                color="yellow"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Assigned to me by status */}
              <div className="card p-5">
                <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <CheckSquare size={16} className="text-primary-400" />
                  Tasks by status
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'To Do', value: data.totalByStatus.todo, color: 'bg-slate-500', bg: 'bg-slate-500/10' },
                    { label: 'In Progress', value: data.totalByStatus.in_progress, color: 'bg-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Done', value: data.totalByStatus.done, color: 'bg-green-500', bg: 'bg-green-500/10' },
                  ].map((item) => {
                    const total = data.totalByStatus.todo +
                      data.totalByStatus.in_progress +
                      data.totalByStatus.done;
                    const pct = total ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-slate-300 font-medium">{item.value}</span>
                        </div>
                        <div className={`h-2 rounded-full ${item.bg}`}>
                          <div
                            className={`h-2 rounded-full ${item.color} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Busiest project */}
              {data.busiestProject && (
                <div className="card p-5">
                  <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-orange-400" />
                    Busiest project
                  </h3>
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-3xl font-bold text-orange-400">
                      {data.busiestProject.openTaskCount}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">open tasks</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recent activity */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-primary-400" />
                Recent activity
              </h3>
              {data.recentActivity.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No activity yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.recentActivity.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary-600/20 flex items-center
                                      justify-center text-xs font-bold text-primary-300 shrink-0 mt-0.5">
                        {log.actor.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">
                          <span className="font-medium">{log.actor.name}</span>{' '}
                          {activityLabel[log.eventType] ?? log.eventType}
                          {log.metadata?.taskTitle && (
                            <span className="text-primary-400"> "{log.metadata.taskTitle}"</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const bg: Record<string, string> = {
    primary: 'bg-primary-500/10 border-primary-500/20',
    green: 'bg-green-500/10 border-green-500/20',
    blue: 'bg-blue-500/10 border-blue-500/20',
    yellow: 'bg-yellow-500/10 border-yellow-500/20',
  };

  return (
    <div className={`card p-5 border ${bg[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-slate-800">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}