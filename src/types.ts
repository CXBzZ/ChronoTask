export type Priority = 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completedAt?: number; // timestamp for review sorting
  image?: string; // base64 data URL
  priority: Priority;
  subtasks: Subtask[];
}
