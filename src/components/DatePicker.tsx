import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X, ChevronDown } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (date: string | undefined) => void;
  placeholder?: string;
}

const quickOptions = [
  { label: '今天', getDate: () => new Date() },
  { label: '明天', getDate: () => addDays(new Date(), 1) },
  { label: '下周一', getDate: () => startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }) },
  { label: '下周日', getDate: () => startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 0 }) },
];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = '选择日期',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  const selectedDate = value ? new Date(value) : null;

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return placeholder;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = addDays(today, 1);

    if (isSameDay(date, today)) return '今天';
    if (isSameDay(date, tomorrow)) return '明天';
    return format(date, 'M月d日', { locale: zhCN });
  };

  const handleSelectDate = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setIsOpen(false);
  };

  // 生成日历网格
  const generateCalendarDays = () => {
    const start = startOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
          value
            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span>{formatDisplayDate(value)}</span>
        {value ? (
          <X
            className="w-3.5 h-3.5 hover:text-red-500"
            onClick={handleClear}
          />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-zinc-200 p-4 z-50 w-72">
          {/* 快捷选项 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {quickOptions.map((option) => {
              const date = option.getDate();
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              return (
                <button
                  key={option.label}
                  onClick={() => handleSelectDate(date)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
            <button
              onClick={() => onChange(undefined)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                !value
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              无日期
            </button>
          </div>

          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1 hover:bg-zinc-100 rounded-lg"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <span className="text-sm font-medium text-zinc-900">
              {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1 hover:bg-zinc-100 rounded-lg"
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs text-zinc-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={index}
                  onClick={() => handleSelectDate(day)}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : isToday
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : isCurrentMonth
                      ? 'text-zinc-700 hover:bg-zinc-100'
                      : 'text-zinc-300'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
