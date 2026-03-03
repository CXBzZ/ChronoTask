import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import localforage from 'localforage';
import { Todo, Subtask, LegacyTodo } from './types';
import * as store from './store';
import { useAuth } from './AuthContext';
import { supabase } from './lib/supabase';

export type ReviewPeriod = 'week' | 'month' | 'year';

interface TodoContextType {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, 'id' | 'user_id' | 'subtasks'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  addSubtask: (todoId: string, title: string) => Promise<void>;
  toggleSubtask: (todoId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (todoId: string, subtaskId: string) => Promise<void>;
  isLoading: boolean;
  reviewPeriod: ReviewPeriod;
  setReviewPeriod: (period: ReviewPeriod) => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewPeriod, setReviewPeriod] = useState<ReviewPeriod>('week');

  const reload = useCallback(async () => {
    try {
      const loaded = await store.loadTodos();
      setTodos(loaded);
    } catch (err) {
      console.error('Failed to load todos:', err);
    }
  }, []);

  const migrated = useRef(false);

  // Migrate legacy localforage data on first login
  const migrateLegacyData = useCallback(async (userId: string) => {
    if (migrated.current) return;
    migrated.current = true;

    const LEGACY_KEY = 'chronotask-todos';
    try {
      const legacy = await localforage.getItem<LegacyTodo[]>(LEGACY_KEY);
      if (!legacy?.length) return;

      for (const item of legacy) {
        const { data: todoRow, error: todoErr } = await supabase
          .from('todos')
          .insert({
            user_id: userId,
            title: item.title,
            date: item.date,
            completed: item.completed,
            completed_at: item.completedAt ?? null,
            image: item.image ?? null,
            priority: item.priority || 'medium',
          })
          .select()
          .single();

        if (todoErr || !todoRow) continue;

        if (item.subtasks?.length) {
          await supabase.from('subtasks').insert(
            item.subtasks.map((st) => ({
              todo_id: (todoRow as { id: string }).id,
              user_id: userId,
              title: st.title,
              completed: st.completed,
            }))
          );
        }
      }

      await localforage.removeItem(LEGACY_KEY);
      console.info(`Migrated ${legacy.length} legacy todos to Supabase`);
    } catch (err) {
      console.error('Legacy data migration failed:', err);
    }
  }, []);

  // Initial load (with migration)
  useEffect(() => {
    if (!user) {
      setTodos([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    (async () => {
      await migrateLegacyData(user.id);
      await reload();
    })().finally(() => setIsLoading(false));
  }, [user, reload, migrateLegacyData]);

  // Realtime subscription for multi-device sync
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, reload]);

  const addTodo = useCallback(async (todo: Omit<Todo, 'id' | 'user_id' | 'subtasks'>) => {
    if (!user) return;
    const created = await store.addTodo(todo, user.id);
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

    // Auto-complete parent todo if all subtasks done
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

  return (
    <TodoContext.Provider
      value={{
        todos,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleComplete,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        isLoading,
        reviewPeriod,
        setReviewPeriod,
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
