import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, eachDayOfInterval, isSameDay, isSameMonth, subMonths, addMonths, subYears, addYears, eachMonthOfInterval } from 'date-fns';
import { useTodos } from '../TodoContext';
import { CheckCircle2, CalendarDays, Calendar as CalendarIcon, CalendarRange, Flag, ListTodo, CheckSquare, Square, Clock, LayoutList, ChevronLeft, ChevronRight } from 'lucide-react';
import { Priority, Subtask, Todo } from '../types';

type ViewMode = 'grouped' | 'calendar';

interface GroupedTask {
  title: string;
  priority: Priority;
  todos: Todo[];
  subtasks: Subtask[];
  images: string[];
  completedCount: number;
  totalCount: number;
}

export const ReviewView = () => {
  const { todos, reviewPeriod: period, setReviewPeriod: setPeriod } = useTodos();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const now = new Date();

  const priorityColors = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    low: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const getFilteredData = () => {
    let start: Date, end: Date;
    switch (period) {
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
    }

    const relevantTodos = todos.filter((t) => {
      const taskDate = parseISO(t.date);
      const inDate = isWithinInterval(taskDate, { start, end });
      const inCompleted = t.completed_at ? isWithinInterval(new Date(t.completed_at), { start, end }) : false;
      return inDate || inCompleted;
    });

    // Grouped View Data
    const grouped = relevantTodos.reduce((acc, todo) => {
      const key = todo.title.trim().toLowerCase();
      if (!acc[key]) {
        acc[key] = {
          title: todo.title,
          priority: todo.priority || 'medium',
          todos: [],
          subtasks: [],
          images: [],
          completedCount: 0,
          totalCount: 0
        };
      }
      
      const group = acc[key];
      group.todos.push(todo);
      
      if (todo.subtasks && todo.subtasks.length > 0) {
        group.subtasks.push(...todo.subtasks);
        group.totalCount += todo.subtasks.length;
        group.completedCount += todo.subtasks.filter(st => st.completed).length;
      } else {
        group.totalCount += 1;
        if (todo.completed) group.completedCount += 1;
      }

      if (todo.image && !group.images.includes(todo.image)) {
        group.images.push(todo.image);
      }

      const pOrder = { high: 3, medium: 2, low: 1 };
      if (pOrder[todo.priority as Priority] > pOrder[group.priority as Priority]) {
        group.priority = todo.priority;
      }

      return acc;
    }, {} as Record<string, GroupedTask>);

    const groupedTodos = Object.values(grouped).sort((a: GroupedTask, b: GroupedTask) => {
      const pOrder = { high: 3, medium: 2, low: 1 };
      if (pOrder[a.priority] !== pOrder[b.priority]) {
        return pOrder[b.priority] - pOrder[a.priority];
      }
      return (b.completedCount / b.totalCount) - (a.completedCount / a.totalCount);
    });

    // Timeline View Data
    const timelineData = relevantTodos.reduce((acc: Record<string, Todo[]>, todo) => {
      if (!acc[todo.date]) {
        acc[todo.date] = [];
      }
      acc[todo.date].push(todo);
      return acc;
    }, {});

    const sortedDates = Object.keys(timelineData).sort((a, b) => b.localeCompare(a));

    return {
      groupedTodos,
      timelineData,
      sortedDates,
      relevantTodos
    };
  };

  const { groupedTodos, timelineData, sortedDates, relevantTodos } = getFilteredData();
  const totalItems = Number(groupedTodos.reduce((sum: number, g: GroupedTask) => sum + g.totalCount, 0));
  const completedItems = Number(groupedTodos.reduce((sum: number, g: GroupedTask) => sum + g.completedCount, 0));
  const overallProgress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  const uniqueDays = new Set(relevantTodos.map(t => t.date)).size;

  const renderCalendar = () => {
    let start: Date, end: Date;
    switch (period) {
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
    }

    const days = eachDayOfInterval({ start, end });

    if (period === 'year') {
      // Heatmap style for year
      const months = eachMonthOfInterval({ start, end });
      return (
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {months.map((month, mIdx) => {
              const monthStart = startOfMonth(month);
              const monthEnd = endOfMonth(month);
              const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
              
              return (
                <div key={mIdx} className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase text-center">{format(month, 'MMM')}</span>
                  <div className="grid grid-rows-7 grid-flow-col gap-1">
                    {monthDays.map((day, dIdx) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const dayTodos = todos.filter(t => t.date === dayStr);
                      const completedCount = dayTodos.filter(t => t.completed).length;
                      const totalCount = dayTodos.length;
                      
                      let intensity = 'bg-zinc-50';
                      if (totalCount > 0) {
                        const ratio = completedCount / totalCount;
                        if (ratio === 0) intensity = 'bg-zinc-200';
                        else if (ratio < 0.4) intensity = 'bg-indigo-100';
                        else if (ratio < 0.7) intensity = 'bg-indigo-300';
                        else intensity = 'bg-indigo-500';
                      }

                      return (
                        <div 
                          key={dIdx} 
                          className={`w-3 h-3 rounded-sm ${intensity} transition-colors cursor-help`}
                          title={`${format(day, 'MMM d')}: ${completedCount}/${totalCount} tasks`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-end gap-2 text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-zinc-50" />
              <div className="w-3 h-3 rounded-sm bg-indigo-100" />
              <div className="w-3 h-3 rounded-sm bg-indigo-300" />
              <div className="w-3 h-3 rounded-sm bg-indigo-500" />
            </div>
            <span>More</span>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTodos = todos.filter(t => t.date === dayStr);
          const completedCount = dayTodos.filter(t => t.completed).length;
          const totalCount = dayTodos.length;
          const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={dayStr} 
              className={`bg-white border rounded-xl p-3 shadow-sm flex flex-col min-h-[120px] transition-all hover:shadow-md ${
                isToday ? 'ring-2 ring-indigo-500 border-transparent' : 'border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-zinc-400'}`}>
                  {format(day, 'EEE')}
                </span>
                <span className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-zinc-900'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="flex-1 space-y-1 overflow-hidden">
                {dayTodos.slice(0, 3).map(todo => (
                  <div key={todo.id} className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${todo.completed ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                    <span className={`text-[10px] truncate ${todo.completed ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
                      {todo.title}
                    </span>
                  </div>
                ))}
                {dayTodos.length > 3 && (
                  <p className="text-[10px] text-zinc-400 font-medium pl-3">+{dayTodos.length - 3} more</p>
                )}
              </div>

              {totalCount > 0 && (
                <div className="mt-3 pt-2 border-t border-zinc-50">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                    <span>{progress}%</span>
                    <span>{completedCount}/{totalCount}</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                    <div 
                      className={`h-1 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Progress Review</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Look back at what you've accomplished.</p>
        </div>
        
        <div className="flex bg-zinc-100 dark:bg-zinc-700 p-1 rounded-xl">
          <button
            onClick={() => setPeriod('week')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === 'week' ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === 'month' ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            This Month
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === 'year' ? 'bg-white dark:bg-zinc-600 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            This Year
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-zinc-900">{overallProgress}%</p>
              <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-wider">Overall Progress</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <ListTodo className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-zinc-900">{completedItems} <span className="text-lg text-zinc-400 font-medium">/ {totalItems}</span></p>
              <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-wider">Items Completed</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
                <CalendarDays className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-zinc-900">{uniqueDays}</p>
              <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-wider">Active Days</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <h3 className="text-lg font-semibold text-zinc-900">
                {viewMode === 'grouped' ? 'Task Breakdown' : 'Calendar View'}
              </h3>
              <div className="flex bg-zinc-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'grouped' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  Grouped
                </button>
              </div>
            </div>
            
            {relevantTodos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
                <p className="text-zinc-500">No tasks found for this period.</p>
                <p className="text-sm text-zinc-400 mt-1">Time to plan your schedule!</p>
              </div>
            ) : viewMode === 'grouped' ? (
              <div className="space-y-4">
                {groupedTodos.map((group: GroupedTask, idx: number) => {
                  const progress = group.totalCount === 0 ? 0 : Math.round((group.completedCount / group.totalCount) * 100);
                  const isFullyCompleted = progress === 100 && group.totalCount > 0;

                  return (
                    <div key={idx} className={`bg-white border rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md ${isFullyCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-zinc-200'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h4 className={`text-lg font-semibold ${isFullyCompleted ? 'text-emerald-900' : 'text-zinc-900'}`}>
                              {group.title}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${priorityColors[group.priority] || priorityColors.medium}`}>
                              <Flag className="w-3 h-3" />
                              {group.priority ? group.priority.charAt(0).toUpperCase() + group.priority.slice(1) : 'Medium'}
                            </span>
                            {group.todos.length > 1 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium border border-zinc-200">
                                Spans {group.todos.length} days
                              </span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3 mb-4">
                            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                              <span className="font-medium">Progress</span>
                              <span>{group.completedCount} / {group.totalCount} ({progress}%)</span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${isFullyCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Subtasks List */}
                          {group.subtasks.length > 0 && (
                            <div className="mt-4 space-y-2 bg-zinc-50/50 rounded-lg p-3 border border-zinc-100">
                              <h5 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <ListTodo className="w-3 h-3" /> Subtasks
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {group.subtasks.map((st, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    {st.completed ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    ) : (
                                      <Square className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                                    )}
                                    <span className={`text-sm ${st.completed ? 'text-zinc-500 line-through' : 'text-zinc-700'}`}>
                                      {st.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Images */}
                          {group.images.length > 0 && (
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                              {group.images.map((img, i) => (
                                <img key={i} src={img} alt="Task attachment" className="h-20 w-20 object-cover rounded-lg border border-zinc-200 shrink-0" />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {isFullyCompleted && (
                          <div className="shrink-0 mt-1">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              renderCalendar()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
