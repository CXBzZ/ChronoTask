import localforage from 'localforage';
import { Todo } from './types';

const STORE_KEY = 'chronotask-todos';

export const loadTodos = async (): Promise<Todo[]> => {
  const todos = await localforage.getItem<Todo[]>(STORE_KEY);
  return todos || [];
};

export const saveTodos = async (todos: Todo[]): Promise<void> => {
  await localforage.setItem(STORE_KEY, todos);
};
