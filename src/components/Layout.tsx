import React, { useState } from 'react';
import { Calendar, CheckSquare, Image as ImageIcon } from 'lucide-react';
import { ScheduleView } from './ScheduleView';
import { ReviewView } from './ReviewView';

export const Layout = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'review'>('schedule');

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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {activeTab === 'schedule' ? <ScheduleView /> : <ReviewView />}
      </main>
    </div>
  );
};
