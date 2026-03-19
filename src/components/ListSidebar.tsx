import React, { useState } from 'react';
import {
  Inbox,
  Sun,
  CalendarDays,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Settings,
  X,
} from 'lucide-react';
import { TaskList, SmartListType } from '../types';
import { SettingsModal } from './SettingsModal';

interface SmartListCounts {
  inbox: number;
  today: number;
  upcoming: number;
  completed: number;
}

interface ListSidebarProps {
  lists: TaskList[];
  smartListCounts: SmartListCounts;
  selectedListId: string | SmartListType;
  onSelectList: (id: string | SmartListType) => void;
  onCreateList: (name: string, icon?: string, color?: string) => Promise<void>;
  onUpdateList: (id: string, updates: Partial<TaskList>) => Promise<void>;
  onDeleteList: (id: string) => Promise<void>;
  userEmail?: string;
  onSignOut?: () => void;
  onClose?: () => void;
}

const SMART_LIST_ICONS: Record<SmartListType, React.ReactNode> = {
  inbox: <Inbox className="w-5 h-5" />,
  today: <Sun className="w-5 h-5" />,
  upcoming: <CalendarDays className="w-5 h-5" />,
  completed: <CheckCircle2 className="w-5 h-5" />,
};

const SMART_LIST_LABELS: Record<SmartListType, string> = {
  inbox: '收件箱',
  today: '今天',
  upcoming: '即将到来',
  completed: '已完成',
};

const LIST_COLORS = [
  '#6366f1',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

export const ListSidebar: React.FC<ListSidebarProps> = ({
  lists,
  smartListCounts,
  selectedListId,
  onSelectList,
  onCreateList,
  onUpdateList,
  onDeleteList,
  userEmail,
  onSignOut,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [editName, setEditName] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const customLists = lists.filter((l) => !l.is_default);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await onCreateList(
      newListName.trim(),
      'list',
      LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)]
    );
    setNewListName('');
    setIsCreating(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList || !editName.trim()) return;
    await onUpdateList(editingList.id, { name: editName.trim() });
    setEditingList(null);
    setEditName('');
  };

  const renderSmartListItem = (type: SmartListType) => {
    const isSelected = selectedListId === type;
    const count = smartListCounts[type];

    return (
      <button
        key={type}
        onClick={() => onSelectList(type)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isSelected
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}>
            {SMART_LIST_ICONS[type]}
          </span>
          <span>{SMART_LIST_LABELS[type]}</span>
        </div>
        {count > 0 && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isSelected
                ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 w-64">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          ChronoTask
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Smart Lists */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            智能清单
          </p>
          {renderSmartListItem('inbox')}
          {renderSmartListItem('today')}
          {renderSmartListItem('upcoming')}
          {renderSmartListItem('completed')}
        </div>

        {/* Custom Lists */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              我的清单
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="p-1 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
              title="新建清单"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {customLists.map((list) => {
            const isSelected = selectedListId === list.id;

            if (editingList?.id === list.id) {
              return (
                <form
                  key={list.id}
                  onSubmit={handleEditSubmit}
                  className="px-3 py-2"
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onBlur={() => {
                      setEditingList(null);
                      setEditName('');
                    }}
                  />
                </form>
              );
            }

            return (
              <div
                key={list.id}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                onClick={() => onSelectList(list.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="truncate">{list.name}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingList(list);
                      setEditName(list.name);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定要删除清单 "${list.name}" 吗？其中的任务将移至收件箱。`)) {
                        onDeleteList(list.id);
                      }
                    }}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Create New List Form */}
          {isCreating && (
            <form onSubmit={handleCreateSubmit} className="px-3 py-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="清单名称"
                autoFocus
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onBlur={() => {
                  if (!newListName.trim()) {
                    setIsCreating(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewListName('');
                  }
                }}
              />
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-700">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl transition-colors"
        >
          <Settings className="w-5 h-5" />
          设置
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userEmail={userEmail}
        onSignOut={onSignOut || (() => {})}
      />
    </div>
  );
};
