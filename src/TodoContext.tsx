import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Todo } from './types';
import { loadTodos, saveTodos } from './store';

export type ReviewPeriod = 'week' | 'month' | 'year';

interface TodoContextType {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, 'id'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleComplete: (id: string) => void;
  isLoading: boolean;
  reviewPeriod: ReviewPeriod;
  setReviewPeriod: (period: ReviewPeriod) => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewPeriod, setReviewPeriod] = useState<ReviewPeriod>('week');

  useEffect(() => {
    loadTodos().then((loadedTodos) => {
      setTodos(loadedTodos);
      setIsLoading(false);
    });
  }, []);

  const addTodo = (todo: Omit<Todo, 'id'>) => {
    const newTodo: Todo = { ...todo, id: crypto.randomUUID() };
    const newTodos = [...todos, newTodo];
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    const newTodos = todos.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  const deleteTodo = (id: string) => {
    const newTodos = todos.filter((t) => t.id !== id);
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  const toggleComplete = (id: string) => {
    const newTodos = todos.map((t) => {
      if (t.id === id) {
        const completed = !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? Date.now() : undefined,
        };
      }
      return t;
    });
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  return (
    <TodoContext.Provider value={{ todos, addTodo, updateTodo, deleteTodo, toggleComplete, isLoading, reviewPeriod, setReviewPeriod }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) throw new Error('useTodos must be used within TodoProvider');
  return context;
};
