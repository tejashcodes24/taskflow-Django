import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  UserPlus, Users, Activity,
  Plus
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { BoardView } from '@/components/board/BoardView';
import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskForm } from '@/components/tasks/TaskForm';
import { InviteMemberModal } from '@/components/projects/InviteMemberModal';
import { MembersModal } from '@/components/projects/MembersModal';
import { useProjectSocket } from '@/hooks/useSocket';
import { useBoardStore } from '@/store/board.store';
import { useAuthStore } from '@/store/auth.store';
import type { Project, Task, ActivityLog, Membership } from '@/types';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';

export function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuthStore();
  const {
    tasks, setTasks, setLoading, setError,
    isLoading, error, selectedTask, setSelectedTask,
  } = useBoardStore();

  const [onlineMembers, setOnlineMembers] = useState<{userId: string, name: string, role: string}[]>([]);

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  //const [createStatus, setCreateStatus] = useState<TaskStatus>('todo');
  const [showInvite, setShowInvite] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  // Connect to the project's WebSocket room
  useProjectSocket(projectId!);

  // Track socket connection status for the live indicator
  useEffect(() => {
    const socket = getSocket();
    socket.on('members:online', (data) => {
      if (data.projectId === projectId) {
        setOnlineMembers(data.onlineMembers);
      }
    });
    return () => {
      socket.off('members:online');
    };
  }, [projectId]);

  
  const fetchBoard = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [boardRes, projectRes, activityRes] = await Promise.all([
        api.get(`/projects/${projectId}/tasks/board`),
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/activity`),
      ]);
      setTasks(boardRes.data);
      setProject(projectRes.data);
      setMembers(projectRes.data.memberships ?? []);
      setActivity(activityRes.data);
    } catch {
      setError('Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  // Reset board state when switching between projects
  useEffect(() => {
    setTasks({ todo: [], in_progress: [], done: [] });
    setSelectedTask(null);
    setError(null);
    fetchBoard();
  }, [projectId]);

  const isOwner = project?.ownerId === user?.id;

  const handleAddTask = () => {
  setShowCreateTask(true);
};

  const handleTaskCreated = (_task: Task) => {
    setShowCreateTask(false);
    // Socket broadcasts the new task back to the board store automatically
  };

  // Remove member from local state after successful API call
  const handleMemberRemoved = (userId: string) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const activityLabel: Record<string, string> = {
    task_created: '📝 created task',
    task_moved: '🔀 moved task',
    task_assigned: '👤 assigned task',
    task_deleted: '🗑️ deleted task',
    member_invited: '✉️ invited member',
    member_removed: '🚪 removed member',
    comment_added: '💬 commented on',
  };

  return (
    <>
      <Navbar
        title={project?.name ?? 'Board'}
        actions={
          <div className="flex items-center gap-2">
            {/* Online members indicator */}
            {onlineMembers.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border
                              border-green-500/30 bg-green-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <div className="flex items-center gap-1.5">
                  {onlineMembers.map((m) => (
                    <span key={m.userId} className="text-xs text-green-400 font-medium">
                      {m.name}{m.role === 'owner' && <span className="text-green-600 ml-0.5">★</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button variant="secondary" onClick={() => setShowMembers(true)}>
              <Users size={14} /> Members
            </Button>

            <Button variant="secondary" onClick={() => setShowActivity(true)}>
              <Activity size={14} /> Activity
            </Button>

            {isOwner && (
              <Button variant="secondary" onClick={() => setShowInvite(true)}>
                <UserPlus size={14} /> Invite
              </Button>
            )}

            <Button onClick={() => handleAddTask()}>
              <Plus size={14} /> Add task
            </Button>
          </div>
        }
      />

      <div className="p-6 flex-1 overflow-auto">
        {isLoading ? (
          <PageSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchBoard} />
        ) : (
          <BoardView
            tasks={tasks}
            onTaskClick={(task) => setSelectedTask(task)}
            onAddTask={handleAddTask}
          />
        )}
      </div>

      {/* ── Task detail modal ───────────────────────────────────────────── */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          projectId={projectId!}
          isOwner={isOwner}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* ── Create task modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        title="Create task"
        size="lg"
      >
        <TaskForm
          projectId={projectId!}
          onSaved={handleTaskCreated}
          onCancel={() => setShowCreateTask(false)}
        />
      </Modal>

      {/* ── Invite member modal ─────────────────────────────────────────── */}
      <InviteMemberModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        projectId={projectId!}
      />

      {/* ── Members modal — replaced old inline Modal block ─────────────── */}
      <MembersModal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        projectId={projectId!}
        members={members}
        isOwner={isOwner}
        onMemberRemoved={handleMemberRemoved}
      />

      {/* ── Activity feed modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showActivity}
        onClose={() => setShowActivity(false)}
        title="Activity feed"
        size="md"
      >
        <div className="flex flex-col gap-3">
          {activity.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">
              No activity yet
            </p>
          ) : (
            activity.map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center
                                justify-center text-xs font-bold text-slate-300 shrink-0">
                  {log.actor.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-slate-300">
                    <span className="font-medium">{log.actor.name}</span>{' '}
                    {activityLabel[log.eventType] ?? log.eventType}{' '}
                    {log.metadata?.taskTitle && (
                      <span className="text-primary-400">
                        "{log.metadata.taskTitle}"
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}