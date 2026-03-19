import React, { useState } from 'react';
import { LogOut, LayoutList, BarChart3, Calendar, Target, Menu, X } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const handleSelectList = (id: string) => {
    setSelectedListId(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col md:flex-row">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile: Drawer, Desktop: Fixed */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <ListSidebar
          lists={lists}
          smartListCounts={smartListCounts}
          selectedListId={selectedListId}
          onSelectList={handleSelectList}
          onCreateList={createList}
          onUpdateList={updateList}
          onDeleteList={deleteList}
          userEmail={user?.email}
          onSignOut={signOut}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Tab Navigation - Scrollable on mobile */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 p-1 rounded-lg overflow-x-auto">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === 'list'
                    ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline">清单</span>
              </button>
              <button
                onClick={() => setActiveTab('month')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === 'month'
                    ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">月视图</span>
              </button>
              <button
                onClick={() => setActiveTab('focus')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === 'focus'
                    ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">专注</span>
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === 'review'
                    ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">统计</span>
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2 md:gap-4">
            {user && (
              <>
                <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden md:block">{user.email}</span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-2 md:px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
