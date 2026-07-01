import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useBoardStore } from '@/store/board.store';
import type { Task} from '@/types';

export function useProjectSocket(projectId: string) {
  const { addTask, updateTask, removeTask } = useBoardStore();

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket();

    const joinRoom = () => {
      socket.emit('join:project', projectId);
    };

    // Join immediately if already connected
    if (socket.connected) {
      joinRoom();
    }

    // Re-join after reconnect (socket lost connection and came back)
    socket.on('connect', joinRoom);

    // Real-time task events
    socket.on('task:created', (task: Task) => {
      addTask(task);
    });

    socket.on('task:updated', (task: Task) => {
      updateTask(task);
    });

    socket.on('task:deleted', ({ taskId }: { taskId: string }) => {
      removeTask(taskId);
    });

    return () => {
      socket.emit('leave:project', projectId);
      socket.off('connect', joinRoom);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [projectId]);
}