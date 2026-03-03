import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { TodoProvider } from './TodoContext';
import { Layout } from './components/Layout';
import { AuthPage } from './components/AuthPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <TodoProvider>
      <Layout />
    </TodoProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
