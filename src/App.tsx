import React from 'react';
import { TodoProvider } from './TodoContext';
import { Layout } from './components/Layout';

export default function App() {
  return (
    <TodoProvider>
      <Layout />
    </TodoProvider>
  );
}
