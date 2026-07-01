import { create } from 'zustand';
import type { Task, BoardTasks } from '@/types';

interface BoardState {
  tasks: BoardTasks;
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;

  setTasks: (tasks: BoardTasks) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedTask: (task: Task | null) => void;

  // Real-time socket updaters
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
}

// Helper — remove a task from whatever column it's in
function removeFromColumns(tasks: BoardTasks, taskId: string): BoardTasks {
  return {
    todo: tasks.todo.filter((t) => t.id !== taskId),
    in_progress: tasks.in_progress.filter((t) => t.id !== taskId),
    done: tasks.done.filter((t) => t.id !== taskId),
  };
}

export const useBoardStore = create<BoardState>((set) => ({
  tasks: { todo: [], in_progress: [], done: [] },
  selectedTask: null,
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedTask: (selectedTask) => set({ selectedTask }),

  addTask: (task) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [task.status]: [...state.tasks[task.status], task],
      },
    })),

  updateTask: (task) =>
    set((state) => {
      // Remove from old column, add to new column
      const cleaned = removeFromColumns(state.tasks, task.id);
      return {
        tasks: {
          ...cleaned,
          [task.status]: [...cleaned[task.status], task],
        },
        // If this task is open in the modal, update it there too
        selectedTask:
          state.selectedTask?.id === task.id ? task : state.selectedTask,
      };
    }),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: removeFromColumns(state.tasks, taskId),
      selectedTask:
        state.selectedTask?.id === taskId ? null : state.selectedTask,
    })),
}));