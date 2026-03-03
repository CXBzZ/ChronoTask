import React, { useState } from 'react';
import { Calendar, CheckSquare, LogOut } from 'lucide-react';
import { ScheduleView } from './ScheduleView';
import { ReviewView } from './ReviewView';
import { useAuth } from '../AuthContext';

export const Layout = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'review'>('schedule');
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-6 border-b border-zinc-100">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            ChronoTask
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full ${
              activeTab === 'schedule'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full ${
              activeTab === 'review'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            Review
          </button>
        </nav>

        {/* User info + sign out */}
        {user && (
          <div className="p-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-500 truncate mb-2" title={user.email}>
              {user.email}
            </p>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 w-full text-sm text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {activeTab === 'schedule' ? <ScheduleView /> : <ReviewView />}
      </main>
    </div>
  );
};
