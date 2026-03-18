import React, { useState, useEffect } from 'react';
import { X, User, LogOut, Moon, Globe, Bell, Info } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onSignOut: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'about'>('general');
  const [isDark, toggleDarkMode] = useDarkMode();

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">设置</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-40 border-r border-zinc-100 dark:border-zinc-700 py-4">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              通用
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}
            >
              <User className="w-4 h-4" />
              账户
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'about'
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}
            >
              <Info className="w-4 h-4" />
              关于
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
                      <Bell className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">通知</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">应用内提醒</p>
                    </div>
                  </div>
                  <div className="w-11 h-6 bg-indigo-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
                      <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">深色模式</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">切换主题颜色</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`w-11 h-6 rounded-full relative transition-colors ${
                      isDark ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isDark ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">当前用户</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{userEmail || '未登录'}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm('确定要退出登录吗？')) {
                      onSignOut();
                      onClose();
                    }
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">退出登录</span>
                </button>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">ChronoTask</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">版本 v1.0.0</p>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  一个简洁、高效的任务管理应用。
                  <br />
                  支持清单、提醒、标签、重复任务和番茄专注。
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">© 2026 ChronoTask. All rights reserved.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
