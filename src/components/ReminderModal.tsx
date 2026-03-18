import React, { useState, useEffect } from 'react';
import { X, Clock, Bell, Repeat, Calendar } from 'lucide-react';
import { Reminder, ReminderType } from '../types';
import { format, addDays, addWeeks, setHours, setMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ReminderModalProps {
  todoId: string;
  todoTitle: string;
  existingReminder?: Reminder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: {
    reminder_at: string;
    type: ReminderType;
    custom_rule?: Reminder['custom_rule'];
  }) => void;
  onDelete?: () => void;
}

const REMINDER_TYPES: { type: ReminderType; label: string; icon: typeof Clock }[] = [
  { type: 'once', label: '仅一次', icon: Bell },
  { type: 'daily', label: '每天', icon: Repeat },
  { type: 'weekly', label: '每周', icon: Calendar },
  { type: 'monthly', label: '每月', icon: Calendar },
  { type: 'custom', label: '自定义', icon: Clock },
];

const QUICK_TIMES = [
  { label: '稍后（30分钟）', getTime: () => addMinutes(new Date(), 30) },
  { label: '1小时后', getTime: () => addHours(new Date(), 1) },
  { label: '今天晚上 8点', getTime: () => setTime(new Date(), 20, 0) },
  { label: '明天早上 9点', getTime: () => setTime(addDays(new Date(), 1), 9, 0) },
];

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 3600000);
}

function setTime(date: Date, hours: number, minutes: number) {
  return setMinutes(setHours(date, hours), minutes);
}

const WEEKDAYS = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 7, label: '日' },
];

export const ReminderModal: React.FC<ReminderModalProps> = ({
  todoId,
  todoTitle,
  existingReminder,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [reminderAt, setReminderAt] = useState<string>('');
  const [reminderType, setReminderType] = useState<ReminderType>('once');
  const [customInterval, setCustomInterval] = useState<number>(1);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (existingReminder) {
      setReminderAt(existingReminder.reminder_at.slice(0, 16)); // 去掉秒和时区
      setReminderType(existingReminder.type);
      if (existingReminder.custom_rule) {
        setCustomInterval(existingReminder.custom_rule.interval || 1);
        setSelectedWeekdays(existingReminder.custom_rule.days_of_week || [1, 2, 3, 4, 5]);
        setEndDate(existingReminder.custom_rule.end_date || '');
      }
    } else {
      // 默认设置为明天早上 9 点
      const tomorrow9am = setTime(addDays(new Date(), 1), 9, 0);
      setReminderAt(format(tomorrow9am, "yyyy-MM-dd'T'HH:mm"));
      setReminderType('once');
      setCustomInterval(1);
      setSelectedWeekdays([1, 2, 3, 4, 5]);
      setEndDate('');
    }
  }, [existingReminder, isOpen]);

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

  const handleSave = () => {
    if (!reminderAt) return;

    const customRule = reminderType === 'custom' || reminderType === 'weekly' || reminderType === 'daily'
      ? {
          interval: customInterval,
          days_of_week: reminderType === 'weekly' ? selectedWeekdays : undefined,
          end_date: endDate || undefined,
        }
      : undefined;

    onSave({
      reminder_at: new Date(reminderAt).toISOString(),
      type: reminderType,
      custom_rule: customRule,
    });
    onClose();
  };

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">{existingReminder ? '编辑提醒' : '设置提醒'}</h2>
              <p className="text-sm text-zinc-500 truncate max-w-[200px]">{todoTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 时间选择 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-700">提醒时间</label>
            <input
              type="datetime-local"
              value={reminderAt}
              onChange={(e) => setReminderAt(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-700"
            />

            {/* 快捷时间 */}
            <div className="flex flex-wrap gap-2">
              {QUICK_TIMES.map((quick) => (
                <button
                  key={quick.label}
                  onClick={() => setReminderAt(format(quick.getTime(), "yyyy-MM-dd'T'HH:mm"))}
                  className="px-3 py-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg transition-colors"
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>

          {/* 重复类型 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-700">重复规则</label>
            <div className="grid grid-cols-2 gap-2">
              {REMINDER_TYPES.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => setReminderType(type)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
                    reminderType === type
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 每周选择器 */}
          {reminderType === 'weekly' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-700">选择星期</label>
              <div className="flex justify-between">
                {WEEKDAYS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => toggleWeekday(value)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      selectedWeekdays.includes(value)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 自定义间隔 */}
          {(reminderType === 'custom' || reminderType === 'daily') && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-700">间隔</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customInterval}
                  onChange={(e) => setCustomInterval(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                />
                <span className="text-sm text-zinc-600">
                  {reminderType === 'daily' ? '天' : reminderType === 'weekly' ? '周' : '天/周/月'}
                </span>
              </div>
            </div>
          )}

          {/* 结束日期 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-700">结束日期（可选）</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50">
          {existingReminder && onDelete ? (
            <button
              onClick={() => {
                if (confirm('确定要删除这个提醒吗？')) {
                  onDelete();
                  onClose();
                }
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              删除提醒
            </button>
          ) : (
            <div />
          )}
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!reminderAt}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {existingReminder ? '更新提醒' : '设置提醒'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
