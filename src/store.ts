import { supabase } from './lib/supabase';
import { Todo, Subtask, TaskList, UserSettings } from './types';

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
    list_id: row.list_id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    date: row.date as string | undefined,
    completed: row.completed as boolean,
    completed_at: row.completed_at as number | undefined,
    image: row.image as string | undefined,
    priority: (row.priority as Todo['priority']) || 'medium',
    subtasks: subtasksByTodo.get(row.id as string) || [],
    reminder_id: row.reminder_id as string | undefined,
    reminder_at: row.reminder_at as string | undefined,
  }));
}

// =============================================
// Todo APIs
// =============================================

export async function loadTodos(): Promise<Todo[]> {
  const [todosRes, subtasksRes] = await Promise.all([
    supabase.from('todos').select('*').order('date'),
    supabase.from('subtasks').select('*'),
  ]);

  if (todosRes.error) throw todosRes.error;
  if (subtasksRes.error) throw subtasksRes.error;

  return assembleTodos(todosRes.data ?? [], subtasksRes.data ?? []);
}

export async function loadTodosByList(listId: string): Promise<Todo[]> {
  const [todosRes, subtasksRes] = await Promise.all([
    supabase.from('todos').select('*').eq('list_id', listId).order('date'),
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
      list_id: todo.list_id,
      title: todo.title,
      date: todo.date,
      completed: todo.completed,
      completed_at: todo.completed_at,
      image: todo.image,
      priority: todo.priority,
      description: todo.description,
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

// =============================================
// Subtask APIs
// =============================================

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

// =============================================
// Sprint 1: Lists APIs
// =============================================

export async function loadLists(userId: string): Promise<TaskList[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order');

  if (error) throw error;
  return (data || []) as TaskList[];
}

export async function createList(
  list: Omit<TaskList, 'id' | 'created_at'>
): Promise<TaskList> {
  const { data, error } = await supabase
    .from('lists')
    .insert(list)
    .select()
    .single();

  if (error) throw error;
  return data as TaskList;
}

export async function updateList(id: string, updates: Partial<TaskList>): Promise<void> {
  const { error } = await supabase.from('lists').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteList(id: string): Promise<{ movedCount: number }> {
  // 先获取收件箱 ID（将任务移动到收件箱）
  const { data: inboxData } = await supabase
    .from('lists')
    .select('id')
    .eq('is_default', true)
    .ilike('name', '收件箱')
    .single();

  const inboxId = inboxData?.id;

  if (inboxId) {
    // 将该清单下的任务移动到收件箱
    const { data: movedData, error: moveError } = await supabase
      .from('todos')
      .update({ list_id: inboxId })
      .eq('list_id', id)
      .select('id');

    if (moveError) throw moveError;

    // 删除清单
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) throw error;

    return { movedCount: movedData?.length || 0 };
  } else {
    // 如果没有找到收件箱，直接删除（任务会变成孤儿数据）
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) throw error;
    return { movedCount: 0 };
  }
}

// =============================================
// Sprint 1: User Settings & Migration APIs
// =============================================

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data as UserSettings | null;
}

export async function migrateUserData(userId: string): Promise<{
  inboxId: string;
  scheduleId: string;
  migratedCount: number;
}> {
  // 1. 检查是否已迁移
  const settings = await getUserSettings(userId);
  if (settings?.has_migrated_v1) {
    // 已迁移，获取现有清单 ID
    const { data: lists } = await supabase
      .from('lists')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_default', true);

    const inbox = lists?.find((l) => l.name === '收件箱');
    const schedule = lists?.find((l) => l.name === '日程');

    if (inbox?.id && schedule?.id) {
      return { inboxId: inbox.id, scheduleId: schedule.id, migratedCount: 0 };
    }
  }

  // 2. 创建默认清单
  const { data: inboxData, error: inboxError } = await supabase
    .from('lists')
    .insert({
      user_id: userId,
      name: '收件箱',
      icon: 'inbox',
      color: '#6366f1',
      sort_order: 0,
      is_default: true,
    })
    .select()
    .single();

  if (inboxError) throw inboxError;

  const { data: scheduleData, error: scheduleError } = await supabase
    .from('lists')
    .insert({
      user_id: userId,
      name: '日程',
      icon: 'calendar',
      color: '#10b981',
      sort_order: 1,
      is_default: true,
    })
    .select()
    .single();

  if (scheduleError) throw scheduleError;

  // 3. 迁移现有任务
  const { data: existingTodos, error: todosError } = await supabase
    .from('todos')
    .select('id, date')
    .eq('user_id', userId)
    .is('list_id', null);

  if (todosError) throw todosError;

  let migratedCount = 0;
  for (const todo of existingTodos || []) {
    const targetListId = todo.date ? scheduleData.id : inboxData.id;
    const { error: updateError } = await supabase
      .from('todos')
      .update({ list_id: targetListId })
      .eq('id', todo.id);

    if (!updateError) migratedCount++;
  }

  // 4. 标记迁移完成
  await supabase.from('user_settings').upsert({
    user_id: userId,
    has_migrated_v1: true,
    default_list_id: inboxData.id,
    updated_at: new Date().toISOString(),
  });

  return {
    inboxId: inboxData.id,
    scheduleId: scheduleData.id,
    migratedCount,
  };
}

export async function updateListOrder(listIds: string[]): Promise<void> {
  // 批量更新排序
  const updates = listIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('lists')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id);

    if (error) throw error;
  }
}
