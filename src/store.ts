import { supabase } from './lib/supabase';
import { Todo, Subtask, TaskList, UserSettings, Reminder, ReminderType, Tag, FocusSession, FocusType } from './types';
import { format, addDays, addWeeks, addMonths, parseISO } from 'date-fns';

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

// =============================================
// Sprint 3: Reminders APIs
// =============================================

export async function loadReminders(userId: string): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true)
    .order('reminder_at');

  if (error) throw error;
  return (data || []) as Reminder[];
}

export async function loadUpcomingReminders(userId: string, limit: number = 10): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true)
    .gte('reminder_at', new Date().toISOString())
    .order('reminder_at')
    .limit(limit);

  if (error) throw error;
  return (data || []) as Reminder[];
}

export async function loadDueReminders(userId: string): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true)
    .lte('reminder_at', new Date().toISOString())
    .order('reminder_at');

  if (error) throw error;
  return (data || []) as Reminder[];
}

export async function createReminder(
  reminder: Omit<Reminder, 'id' | 'user_id' | 'todo_id' | 'created_at'> & { todo_id: string; user_id: string }
): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .insert(reminder)
    .select()
    .single();

  if (error) throw error;

  // 更新 todos 表的冗余字段
  await supabase
    .from('todos')
    .update({
      reminder_id: data.id,
      reminder_at: reminder.reminder_at,
    })
    .eq('id', reminder.todo_id);

  return data as Reminder;
}

export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
  const { error } = await supabase.from('reminders').update(updates).eq('id', id);
  if (error) throw error;

  // 如果更新了 reminder_at，同步更新 todos 表
  if (updates.reminder_at) {
    const { data } = await supabase.from('reminders').select('todo_id').eq('id', id).single();
    if (data?.todo_id) {
      await supabase
        .from('todos')
        .update({ reminder_at: updates.reminder_at })
        .eq('id', data.todo_id);
    }
  }

  // 如果禁用了提醒，清除 todos 表的冗余字段
  if (updates.is_enabled === false) {
    const { data } = await supabase.from('reminders').select('todo_id').eq('id', id).single();
    if (data?.todo_id) {
      await supabase
        .from('todos')
        .update({ reminder_at: null, reminder_id: null })
        .eq('id', data.todo_id);
    }
  }
}

export async function deleteReminder(id: string): Promise<void> {
  // 先获取 todo_id 以清除冗余字段
  const { data } = await supabase.from('reminders').select('todo_id').eq('id', id).single();
  
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  if (error) throw error;

  // 清除 todos 表的冗余字段
  if (data?.todo_id) {
    await supabase
      .from('todos')
      .update({ reminder_at: null, reminder_id: null })
      .eq('id', data.todo_id);
  }
}

// =============================================
// Sprint 4: Tags APIs
// =============================================

export async function loadTags(userId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return (data || []) as Tag[];
}

export async function createTag(tag: Omit<Tag, 'id' | 'created_at'>): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .insert(tag)
    .select()
    .single();

  if (error) throw error;
  return data as Tag;
}

export async function updateTag(id: string, updates: Partial<Tag>): Promise<void> {
  const { error } = await supabase.from('tags').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw error;
}

// 获取任务的标签
export async function loadTodoTags(todoId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('todo_tags')
    .select('tag_id')
    .eq('todo_id', todoId);

  if (error) throw error;
  return (data || []).map((item) => item.tag_id as string);
}

// 设置任务的标签
export async function setTodoTags(todoId: string, tagIds: string[]): Promise<void> {
  // 先删除现有标签
  const { error: deleteError } = await supabase
    .from('todo_tags')
    .delete()
    .eq('todo_id', todoId);
  
  if (deleteError) throw deleteError;

  // 添加新标签
  if (tagIds.length > 0) {
    const { error: insertError } = await supabase
      .from('todo_tags')
      .insert(tagIds.map((tagId) => ({ todo_id: todoId, tag_id: tagId })));
    
    if (insertError) throw insertError;
  }
}

// =============================================
// Sprint 4: Recurring Tasks APIs
// =============================================

export async function markTodoRecurring(
  todoId: string,
  reminderType: ReminderType,
  customRule?: Reminder['custom_rule'],
  generateCount: number = 3
): Promise<void> {
  // 获取原始任务
  const { data: todo, error: todoError } = await supabase
    .from('todos')
    .select('*')
    .eq('id', todoId)
    .single();
  
  if (todoError) throw todoError;
  if (!todo?.date) throw new Error('Recurring tasks must have a date');

  // 标记为重复任务模板
  await supabase
    .from('todos')
    .update({ is_recurring: true })
    .eq('id', todoId);

  // 预生成未来任务实例
  await generateRecurringInstances(todoId, reminderType, customRule, generateCount);
}

export async function generateRecurringInstances(
  parentTodoId: string,
  reminderType: ReminderType,
  customRule?: Reminder['custom_rule'],
  count: number = 3
): Promise<Todo[]> {
  // 获取父任务
  const { data: parent, error } = await supabase
    .from('todos')
    .select('*')
    .eq('id', parentTodoId)
    .single();
  
  if (error) throw error;
  if (!parent) throw new Error('Parent todo not found');

  const instances: Todo[] = [];
  let baseDate = parseISO(parent.date as string);

  for (let i = 0; i < count; i++) {
    // 计算下一个日期
    let nextDate: Date;
    switch (reminderType) {
      case 'daily':
        nextDate = addDays(baseDate, customRule?.interval || 1);
        break;
      case 'weekly':
        nextDate = addWeeks(baseDate, customRule?.interval || 1);
        break;
      case 'monthly':
        nextDate = addMonths(baseDate, customRule?.interval || 1);
        break;
      default:
        nextDate = addDays(baseDate, 1);
    }

    // 检查结束日期
    if (customRule?.end_date && nextDate > parseISO(customRule.end_date)) {
      break;
    }

    // 创建新实例
    const { data: newTodo, error: insertError } = await supabase
      .from('todos')
      .insert({
        user_id: parent.user_id,
        list_id: parent.list_id,
        title: parent.title,
        description: parent.description,
        date: format(nextDate, 'yyyy-MM-dd'),
        priority: parent.priority,
        completed: false,
        parent_todo_id: parentTodoId,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    instances.push(newTodo as Todo);
    baseDate = nextDate;
  }

  return instances;
}

export async function handleRecurringComplete(todoId: string): Promise<void> {
  // 获取当前任务
  const { data: todo, error } = await supabase
    .from('todos')
    .select('*, reminders(*)')
    .eq('id', todoId)
    .single();
  
  if (error || !todo) return;

  // 如果这是一个重复任务实例，生成下一个周期
  if (todo.parent_todo_id && todo.reminders?.length > 0) {
    const reminder = todo.reminders[0];
    const existingInstances = await supabase
      .from('todos')
      .select('id')
      .eq('parent_todo_id', todo.parent_todo_id)
      .eq('completed', false);

    // 如果未完成实例少于3个，生成新的
    if ((existingInstances.data?.length || 0) < 3) {
      await generateRecurringInstances(
        todo.parent_todo_id,
        reminder.type,
        reminder.custom_rule,
        3 - (existingInstances.data?.length || 0)
      );
    }
  }
}

export async function cancelRecurring(parentTodoId: string, deleteFuture: boolean = false): Promise<void> {
  // 取消重复标记
  await supabase
    .from('todos')
    .update({ is_recurring: false })
    .eq('id', parentTodoId);

  // 删除未来实例
  if (deleteFuture) {
    await supabase
      .from('todos')
      .delete()
      .eq('parent_todo_id', parentTodoId)
      .eq('completed', false);
  }
}

// =============================================
// Sprint 5: Focus APIs
// =============================================

export async function startFocus(session: Omit<FocusSession, 'id' | 'created_at'>): Promise<FocusSession> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return data as FocusSession;
}

export async function endFocus(id: string, updates: Partial<FocusSession>): Promise<void> {
  const { error } = await supabase
    .from('focus_sessions')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function loadFocusSessions(userId: string, limit: number = 50): Promise<FocusSession[]> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as FocusSession[];
}

export async function loadFocusStats(userId: string, period: 'today' | 'week' | 'month'): Promise<{
  total_sessions: number;
  total_duration: number;
  completed_sessions: number;
}> {
  let startDate: string;
  const now = new Date();

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
      break;
  }

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration, is_completed')
    .eq('user_id', userId)
    .gte('started_at', startDate)
    .eq('type', 'focus');

  if (error) throw error;

  const sessions = data || [];
  return {
    total_sessions: sessions.length,
    total_duration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60, // 转换为分钟
    completed_sessions: sessions.filter((s) => s.is_completed).length,
  };
}
