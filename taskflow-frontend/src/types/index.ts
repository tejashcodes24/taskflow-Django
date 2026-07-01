export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type MemberRole = 'owner' | 'member';

export interface Membership {
  id: string;
  userId: string;
  projectId: string;
  role: MemberRole;
  joinedAt: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: User;
  memberships: Membership[];
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  assigneeId: string | null;
  assignee: User | null;
  createdById: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  author: User;
  body: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  actorId: string;
  actor: User;
  eventType: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface BoardTasks {
  todo: Task[];
  in_progress: Task[];
  done: Task[];
}

export interface PaginatedTasks {
  data: Task[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DashboardData {
  projectCount: number;
  assignedByStatus: {
    todo: number;
    in_progress: number;
    done: number;
  };
  totalByStatus: {
    todo: number;
    in_progress: number;
    done: number;
  };
  completedThisWeek: number;
  busiestProject: {
    projectId: string;
    name: string;
    openTaskCount: number;
  } | null;
  recentActivity: ActivityLog[];
}

export interface ApiError {
  message: string;
  statusCode: number;
}