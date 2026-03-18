import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Todo, TaskList, SmartListType } from '../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MonthViewProps {
  todos: Todo[];
  lists: TaskList[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onAddTodo: (date: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  todos,
  lists,
  selectedDate,
  onSelectDate,
  onAddTodo,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 生成日历网格
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // 周一开始
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // 获取某天的任务
  const getTodosForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return todos.filter((todo) => todo.date === dateStr);
  };

  // 获取任务完成率
  const getCompletionRate = (dayTodos: Todo[]) => {
    if (dayTodos.length === 0) return 0;
    return Math.round(
      (dayTodos.filter((t) => t.completed).length / dayTodos.length) * 100
    );
  };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50">
      {/* 月份导航 */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-zinc-900">
              {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                今天
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 日历网格 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200 border-b-0 rounded-t-xl overflow-hidden">
            {weekDays.map((day) => (
              <div
                key={day}
                className="bg-zinc-50 py-3 text-center text-sm font-semibold text-zinc-500"
              >
                周{day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200 border-t-0 rounded-b-xl overflow-hidden">
            {calendarDays.map((day, index) => {
              const dayTodos = getTodosForDay(day);
              const completionRate = getCompletionRate(dayTodos);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onSelectDate(day)}
                  className={`min-h-[100px] bg-white p-2 cursor-pointer transition-colors hover:bg-zinc-50 ${
                    !isCurrentMonth ? 'bg-zinc-50/50' : ''
                  } ${isSelected ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isTodayDate
                          ? 'w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center'
                          : isCurrentMonth
                          ? 'text-zinc-900'
                          : 'text-zinc-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayTodos.length > 0 && (
                      <span className="text-xs text-zinc-400">{dayTodos.length}</span>
                    )}
                  </div>

                  {/* 完成进度条 */}
                  {dayTodos.length > 0 && (
                    <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          completionRate === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  )}

                  {/* 任务预览 */}
                  <div className="space-y-1">
                    {dayTodos.slice(0, 3).map((todo) => {
                      const list = lists.find((l) => l.id === todo.list_id);
                      return (
                        <div
                          key={todo.id}
                          className={`text-xs truncate px-1.5 py-0.5 rounded ${
                            todo.completed
                              ? 'bg-zinc-100 text-zinc-400 line-through'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {todo.title}
                        </div>
                      );
                    })}
                    {dayTodos.length > 3 && (
                      <div className="text-xs text-zinc-400 px-1.5">+{dayTodos.length - 3} 更多</div>
                    )}
                  </div>

                  {/* 添加按钮（悬停显示） */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTodo(format(day, 'yyyy-MM-dd'));
                    }}
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
