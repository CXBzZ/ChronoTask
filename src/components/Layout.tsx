import React, { useState } from 'react';
import { LogOut, LayoutList, BarChart3, Calendar, Target } from 'lucide-react';
import { ListSidebar } from './ListSidebar';
import { ListView } from './ListView';
import { ReviewView } from './ReviewView';
import { FocusView } from './FocusView';
import { MonthView } from './MonthView';
import { useTodos } from '../TodoContext';
import { useAuth } from '../AuthContext';

export const Layout = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'month' | 'focus' | 'review'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const {
    todos,
    lists,
    reminders,
    isLoading,
    isMigrating,
    selectedListId,
    setSelectedListId,
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
    startFocus,
    endFocus,
    loadFocusStats,
    smartListCounts,
  } = useTodos();
  const { user, signOut } = useAuth();

  if (isMigrating) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">正在初始化数据...</p>
          <p className="text-sm text-zinc-400 mt-2">首次使用需要几秒钟</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <ListSidebar
        lists={lists}
        smartListCounts={smartListCounts}
        selectedListId={selectedListId}
        onSelectList={setSelectedListId}
        onCreateList={createList}
        onUpdateList={updateList}
        onDeleteList={deleteList}
        userEmail={user?.email}
        onSignOut={signOut}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              清单
            </button>
            <button
              onClick={() => setActiveTab('month')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'month'
                  ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              月视图
            </button>
            <button
              onClick={() => setActiveTab('focus')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'focus'
                  ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              专注
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'review'
                  ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              统计
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">{user.email}</span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">退出</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'list' && (
            <ListView
              selectedListId={selectedListId}
              lists={lists}
              todos={todos}
              reminders={reminders}
              isLoading={isLoading}
              onAddTodo={addTodo}
              onUpdateTodo={updateTodo}
              onDeleteTodo={deleteTodo}
              onToggleComplete={toggleComplete}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onDeleteSubtask={deleteSubtask}
              onCreateReminder={createReminder}
              onUpdateReminder={updateReminder}
              onDeleteReminder={deleteReminder}
            />
          )}
          {activeTab === 'month' && (
            <MonthView
              todos={todos}
              lists={lists}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setActiveTab('list');
              }}
              onAddTodo={(date) => {
                console.log('Add todo for date:', date);
              }}
            />
          )}
          {activeTab === 'focus' && (
            <FocusView
              todos={todos}
              onStartFocus={startFocus}
              onEndFocus={endFocus}
              onLoadFocusStats={loadFocusStats}
            />
          )}
          {activeTab === 'review' && <ReviewView />}
        </main>
      </div>
    </div>
  );
};
