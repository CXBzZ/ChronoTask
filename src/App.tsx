import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { TodoProvider } from './TodoContext';
import { Layout } from './components/Layout';
import { AuthPage } from './components/AuthPage';
import { Loader2 } from 'lucide-react';

// 初始化深色模式
function initDarkMode() {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem('chronotask-dark-mode');
  if (stored === 'true') {
    document.documentElement.classList.add('dark');
  } else if (stored === null) {
    // 如果没有设置，使用系统偏好
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
}

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
  useEffect(() => {
    initDarkMode();
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
