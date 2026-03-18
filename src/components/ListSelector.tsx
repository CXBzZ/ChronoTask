import React, { useState, useRef, useEffect } from 'react';
import { List, Check, ChevronDown, Inbox, Sun, CalendarDays, CheckCircle2 } from 'lucide-react';
import { TaskList, SmartListType } from '../types';

interface ListSelectorProps {
  lists: TaskList[];
  value: string;
  onChange: (listId: string) => void;
  showSmartLists?: boolean;
}

const SMART_LIST_ICONS: Record<SmartListType, typeof Inbox> = {
  inbox: Inbox,
  today: Sun,
  upcoming: CalendarDays,
  completed: CheckCircle2,
};

const SMART_LIST_LABELS: Record<SmartListType, string> = {
  inbox: '收件箱',
  today: '今天',
  upcoming: '即将到来',
  completed: '已完成',
};

export const ListSelector: React.FC<ListSelectorProps> = ({
  lists,
  value,
  onChange,
  showSmartLists = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedList = lists.find((l) => l.id === value);

  const handleSelect = (listId: string) => {
    onChange(listId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 hover:border-zinc-300 transition-all min-w-[140px]"
      >
        {selectedList ? (
          <>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedList.color }}
            />
            <span className="flex-1 text-left truncate">{selectedList.name}</span>
          </>
        ) : (
          <>
            <List className="w-4 h-4 text-zinc-400" />
            <span className="flex-1 text-left text-zinc-400">选择清单</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 z-50 min-w-[200px] max-h-80 overflow-y-auto">
          {/* 智能清单 */}
          {showSmartLists && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                智能清单
              </div>
              {( ['inbox', 'today', 'upcoming', 'completed'] as SmartListType[]).map((type) => {
                const Icon = SMART_LIST_ICONS[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleSelect(type)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      value === type ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{SMART_LIST_LABELS[type]}</span>
                    {value === type && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
              <div className="my-2 border-t border-zinc-100" />
            </>
          )}

          {/* 我的清单 */}
          <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            我的清单
          </div>
          {lists
            .filter((l) => !l.is_default)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((list) => (
              <button
                key={list.id}
                onClick={() => handleSelect(list.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  value === list.id ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: list.color }}
                />
                <span className="flex-1 text-left truncate">{list.name}</span>
                {value === list.id && <Check className="w-4 h-4" />}
              </button>
            ))}

          {/* 默认清单（收件箱等） */}
          {lists
            .filter((l) => l.is_default)
            .map((list) => (
              <button
                key={list.id}
                onClick={() => handleSelect(list.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  value === list.id ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: list.color }}
                />
                <span className="flex-1 text-left">{list.name}</span>
                {value === list.id && <Check className="w-4 h-4" />}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
