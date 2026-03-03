import { supabase } from './lib/supabase';
import { Todo, Subtask } from './types';

/** Assemble Todo objects from separate todos + subtasks rows */
function assembleTodos(
  todoRows: Record<string, unknown>[],
  subtaskRows: Record<string, unknown>[]
): Todo[] {
  const subtasksByTodo = new Map<string, Subtask[]>();
  for (const row of subtaskRows) {
    const todoId = row.todo_id as string;
    if (!subtasksByTodo.has(todoId)) subtasksByTodo.set(todoId, []);
    subtasksByTodo.get(todoId)!.push({
      id: row.id as string,
      todo_id: row.todo_id as string,
      user_id: row.user_id as string,
      title: row.title as string,
      completed: row.completed as boolean,
    });
  }

  return todoRows.map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    date: row.date as string,
    completed: row.completed as boolean,
    completed_at: row.completed_at as number | undefined,
    image: row.image as string | undefined,
    priority: (row.priority as Todo['priority']) || 'medium',
    subtasks: subtasksByTodo.get(row.id as string) || [],
  }));
}

export async function loadTodos(): Promise<Todo[]> {
  const [todosRes, subtasksRes] = await Promise.all([
    supabase.from('todos').select('*').order('date'),
    supabase.from('subtasks').select('*'),
  ]);

  if (todosRes.error) throw todosRes.error;
  if (subtasksRes.error) throw subtasksRes.error;

  return assembleTodos(todosRes.data ?? [], subtasksRes.data ?? []);
}

export async function addTodo(
  todo: Omit<Todo, 'id' | 'user_id' | 'subtasks'>,
  userId: string
): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .insert({
      user_id: userId,
      title: todo.title,
      date: todo.date,
      completed: todo.completed,
      completed_at: todo.completed_at,
      image: todo.image,
      priority: todo.priority,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, subtasks: [] } as unknown as Todo;
}

export async function updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
  const { subtasks: _subtasks, ...dbUpdates } = updates;
  if (Object.keys(dbUpdates).length > 0) {
    const { error } = await supabase.from('todos').update(dbUpdates).eq('id', id);
    if (error) throw error;
  }
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', id);
  if (error) throw error;
}

export async function addSubtask(
  subtask: Omit<Subtask, 'id'>,
): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .insert(subtask)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Subtask;
}

export async function updateSubtask(id: string, updates: Partial<Subtask>): Promise<void> {
  const { error } = await supabase.from('subtasks').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteSubtask(id: string): Promise<void> {
  const { error } = await supabase.from('subtasks').delete().eq('id', id);
  if (error) throw error;
}
