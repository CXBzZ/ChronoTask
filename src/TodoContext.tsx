import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import localforage from 'localforage';
import { Todo, Subtask, LegacyTodo, TaskList, SmartListType, UserSettings, Reminder, Tag, FocusSession, FocusType } from './types';
import * as store from './store';
import { useAuth } from './AuthContext';
import { supabase } from './lib/supabase';

export type ReviewPeriod = 'week' | 'month' | 'year';

interface TodoContextType {
  // 数据
  todos: Todo[];
  lists: TaskList[];
  reminders: Reminder[];
  isLoading: boolean;
  isMigrating: boolean;

  // 视图状态
  selectedListId: string | SmartListType;
  setSelectedListId: (id: string | SmartListType) => void;
  reviewPeriod: ReviewPeriod;
  setReviewPeriod: (period: ReviewPeriod) => void;

  // Todo 操作
  addTodo: (todo: { title: string; list_id: string; date?: string; priority: Todo['priority'] }) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;

  // 子任务
  addSubtask: (todoId: string, title: string) => Promise<void>;
  toggleSubtask: (todoId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (todoId: string, subtaskId: string) => Promise<void>;

  // 清单
  createList: (name: string, icon?: string, color?: string) => Promise<void>;
  updateList: (id: string, updates: Partial<TaskList>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;

  // 提醒
  createReminder: (todoId: string, reminder: Omit<Reminder, 'id' | 'user_id' | 'todo_id' | 'created_at'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  // 提醒统计
  dueRemindersCount: number;
  checkDueReminders: () => Promise<Reminder[]>;

  // 专注
  focusSessions: FocusSession[];
  startFocus: (session: Omit<FocusSession, 'id' | 'user_id' | 'created_at'>) => Promise<FocusSession>;
  endFocus: (id: string, updates: Partial<FocusSession>) => Promise<void>;
  loadFocusStats: (period: 'today' | 'week' | 'month') => Promise<{
    total_sessions: number;
    total_duration: number;
    completed_sessions: number;
  }>;

  // 智能清单计数
  smartListCounts: {
    inbox: number;
    today: number;
    upcoming: number;
    completed: number;
  };
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | SmartListType>('today');
  const [reviewPeriod, setReviewPeriod] = useState<ReviewPeriod>('week');
  const [dueRemindersCount, setDueRemindersCount] = useState(0);

  // 计算智能清单计数
  const smartListCounts = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    return {
      inbox: todos.filter((t) => !t.date).length,
      today: todos.filter((t) => t.date === today).length,
      upcoming: todos.filter((t) => {
        if (!t.date) return false;
        const diff = Math.ceil((new Date(t.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 && diff <= 7;
      }).length,
      completed: todos.filter((t) => {
        if (!t.completed || !t.completed_at) return false;
        const diff = Math.ceil((now.getTime() - t.completed_at) / (1000 * 60 * 60 * 24));
        return diff <= 30;
      }).length,
    };
  }, [todos]);

  const reload = useCallback(async () => {
    if (!user) return;
    try {
      const [loadedTodos, loadedLists] = await Promise.all([
        store.loadTodos(),
        store.loadLists(user.id),
      ]);
      setTodos(loadedTodos);
      setLists(loadedLists);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [user]);

  const reloadReminders = useCallback(async () => {
    if (!user) return;
    try {
      const loadedReminders = await store.loadReminders(user.id);
      setReminders(loadedReminders);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    }
  }, [user]);

  // 检查到期提醒
  const checkDueReminders = useCallback(async () => {
    if (!user) return [];
    try {
      const dueReminders = await store.loadDueReminders(user.id);
      setDueRemindersCount(dueReminders.length);
      return dueReminders;
    } catch (err) {
      console.error('Failed to check due reminders:', err);
      return [];
    }
  }, [user]);

  const migrated = useRef(false);

  // 数据迁移
  const migrateData = useCallback(async () => {
    if (!user || migrated.current) return;
    migrated.current = true;

    try {
      // 检查是否需要迁移
      const settings = await store.getUserSettings(user.id);
      if (settings?.has_migrated_v1) {
        // 已迁移，直接加载数据
        await reload();
        await reloadReminders();
        return;
      }

      setIsMigrating(true);

      // 先迁移 legacy localforage 数据
      const LEGACY_KEY = 'chronotask-todos';
      const legacy = await localforage.getItem<LegacyTodo[]>(LEGACY_KEY);

      if (legacy?.length) {
        for (const item of legacy) {
          await supabase.from('todos').insert({
            user_id: user.id,
            title: item.title,
            date: item.date,
            completed: item.completed,
            completed_at: item.completedAt ?? null,
            image: item.image ?? null,
            priority: item.priority || 'medium',
          });
        }
        await localforage.removeItem(LEGACY_KEY);
      }

      // 执行清单系统迁移
      await store.migrateUserData(user.id);

      // 重新加载数据
      await reload();
      await reloadReminders();

      setIsMigrating(false);
    } catch (err) {
      console.error('Migration failed:', err);
      setIsMigrating(false);
    }
  }, [user, reload, reloadReminders]);

  // Initial load (with migration)
  useEffect(() => {
    if (!user) {
      setTodos([]);
      setLists([]);
      setReminders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    migrateData().finally(() => setIsLoading(false));
  }, [user, migrateData]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('todos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
        reload();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, () => {
        reload();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => {
        reload();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, () => {
        reloadReminders();
        checkDueReminders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, reload, reloadReminders, checkDueReminders]);

  // 定期检查到期提醒（每 60 秒）
  useEffect(() => {
    if (!user) return;

    checkDueReminders();
    const interval = setInterval(() => {
      checkDueReminders();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, checkDueReminders]);

  // Todo 操作
  const addTodo = useCallback(async (todo: { title: string; list_id: string; date?: string; priority: Todo['priority'] }) => {
    if (!user) return;
    const created = await store.addTodo(
      {
        ...todo,
        completed: false,
      },
      user.id
    );
    setTodos((prev) => [...prev, created]);
  }, [user]);

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    await store.updateTodo(id, updates);
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await store.deleteTodo(id);
  }, []);

  const toggleComplete = useCallback(async (id: string) => {
    let updated: Partial<Todo> = {};
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const completed = !t.completed;
          updated = { completed, completed_at: completed ? Date.now() : undefined };
          return { ...t, ...updated };
        }
        return t;
      })
    );
    await store.updateTodo(id, updated);
  }, []);

  // 子任务操作
  const addSubtask = useCallback(async (todoId: string, title: string) => {
    if (!user) return;
    const created = await store.addSubtask({
      todo_id: todoId,
      user_id: user.id,
      title,
      completed: false,
    });
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId ? { ...t, subtasks: [...t.subtasks, created] } : t
      )
    );
  }, [user]);

  const toggleSubtask = useCallback(async (todoId: string, subtaskId: string) => {
    let newCompleted = false;
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== todoId) return t;
        const newSubtasks = t.subtasks.map((st) => {
          if (st.id === subtaskId) {
            newCompleted = !st.completed;
            return { ...st, completed: newCompleted };
          }
          return st;
        });
        const allDone = newSubtasks.length > 0 && newSubtasks.every((st) => st.completed);
        return {
          ...t,
          subtasks: newSubtasks,
          ...(allDone && !t.completed ? { completed: true, completed_at: Date.now() } : {}),
        };
      })
    );
    await store.updateSubtask(subtaskId, { completed: newCompleted });

    const todo = todos.find((t) => t.id === todoId);
    if (todo) {
      const updatedSubtasks = todo.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: newCompleted } : st
      );
      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
      if (allDone && !todo.completed) {
        await store.updateTodo(todoId, { completed: true, completed_at: Date.now() });
      }
    }
  }, [todos]);

  const deleteSubtask = useCallback(async (todoId: string, subtaskId: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId) }
          : t
      )
    );
    await store.deleteSubtask(subtaskId);
  }, []);

  // 清单操作
  const createList = useCallback(async (name: string, icon?: string, color?: string) => {
    if (!user) return;
    const maxOrder = lists.length > 0 ? Math.max(...lists.map((l) => l.sort_order)) : -1;
    const created = await store.createList({
      user_id: user.id,
      name,
      icon: icon || 'list',
      color: color || '#6366f1',
      sort_order: maxOrder + 1,
      is_default: false,
    });
    setLists((prev) => [...prev, created]);
  }, [user, lists]);

  const updateList = useCallback(async (id: string, updates: Partial<TaskList>) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    await store.updateList(id, updates);
  }, []);

  const deleteList = useCallback(async (id: string) => {
    const result = await store.deleteList(id);
    setLists((prev) => prev.filter((l) => l.id !== id));

    // 将相关任务的 list_id 更新为收件箱
    const inboxList = lists.find((l) => l.name === '收件箱');
    if (inboxList) {
      setTodos((prev) =>
        prev.map((t) => (t.list_id === id ? { ...t, list_id: inboxList.id } : t))
      );
    }

    // 如果当前选中的是被删除的清单，切换到「今天」
    if (selectedListId === id) {
      setSelectedListId('today');
    }

    return result;
  }, [lists, selectedListId]);

  // 提醒操作
  const createReminder = useCallback(async (
    todoId: string,
    reminder: Omit<Reminder, 'id' | 'user_id' | 'todo_id' | 'created_at'>
  ) => {
    if (!user) return;
    const created = await store.createReminder({
      ...reminder,
      todo_id: todoId,
      user_id: user.id,
    });
    setReminders((prev) => [...prev, created]);

    // 更新 todo 的冗余字段
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, reminder_id: created.id, reminder_at: reminder.reminder_at }
          : t
      )
    );
  }, [user]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    await store.updateReminder(id, updates);

    // 同步更新 todo 的冗余字段
    if (updates.reminder_at || updates.is_enabled === false) {
      const reminder = reminders.find((r) => r.id === id);
      if (reminder) {
        setTodos((prev) =>
          prev.map((t) =>
            t.id === reminder.todo_id
              ? { ...t, reminder_at: updates.is_enabled === false ? undefined : updates.reminder_at || t.reminder_at }
              : t
          )
        );
      }
    }
  }, [reminders]);

  const deleteReminder = useCallback(async (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    await store.deleteReminder(id);
    
    // 清除 todo 的冗余字段
    if (reminder) {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === reminder.todo_id
            ? { ...t, reminder_id: undefined, reminder_at: undefined }
            : t
        )
      );
    }
  }, [reminders]);

  // 专注操作
  const startFocus = useCallback(async (session: Omit<FocusSession, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated');
    const created = await store.startFocus({
      ...session,
      user_id: user.id,
    });
    setFocusSessions((prev) => [created, ...prev]);
    return created;
  }, [user]);

  const endFocus = useCallback(async (id: string, updates: Partial<FocusSession>) => {
    await store.endFocus(id, updates);
    setFocusSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const loadFocusStats = useCallback(async (period: 'today' | 'week' | 'month') => {
    if (!user) return { total_sessions: 0, total_duration: 0, completed_sessions: 0 };
    return await store.loadFocusStats(user.id, period);
  }, [user]);

  return (
    <TodoContext.Provider
      value={{
        todos,
        lists,
        reminders,
        focusSessions,
        isLoading,
        isMigrating,
        selectedListId,
        setSelectedListId,
        reviewPeriod,
        setReviewPeriod,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleComplete,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        createList,
        updateList,
        deleteList,
        createReminder,
        updateReminder,
        deleteReminder,
        dueRemindersCount,
        checkDueReminders,
        startFocus,
        endFocus,
        loadFocusStats,
        smartListCounts,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) throw new Error('useTodos must be used within TodoProvider');
  return context;
};
