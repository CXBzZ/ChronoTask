export type Priority = 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  todo_id: string;
  user_id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completed_at?: number; // timestamp for review sorting
  image?: string; // base64 data URL
  priority: Priority;
  subtasks: Subtask[];
}

/** Shape used when creating a new Todo (server generates id, user_id, subtasks are separate) */
export type TodoInsert = Omit<Todo, 'id' | 'user_id' | 'subtasks'>;

/** Shape for legacy local-only todos (pre-migration) */
export interface LegacyTodo {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  completedAt?: number;
  image?: string;
  priority: Priority;
  subtasks: { id: string; title: string; completed: boolean }[];
}
