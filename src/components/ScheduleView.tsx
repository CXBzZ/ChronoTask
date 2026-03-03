import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Image as ImageIcon, Trash2, Edit2, Wand2, CheckSquare, Flag, ListTodo, X, Search, Calendar, CalendarDays, CalendarIcon } from 'lucide-react';
import { useTodos } from '../TodoContext';
import { Todo, Priority } from '../types';
import { ImageEditorModal } from './ImageEditorModal';

export const ScheduleView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { todos, addTodo, toggleComplete, deleteTodo, updateTodo, reviewPeriod } = useTodos();

  useEffect(() => {
    if (reviewPeriod === 'week') {
      setViewMode('week');
    }
  }, [reviewPeriod]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const priorityOrder = { high: 3, medium: 2, low: 1 };

  const getFilteredTodos = (dateString: string) => {
    return todos
      .filter((t) => t.date === dateString)
      .filter((t) => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
      })
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesSubtasks = (t.subtasks || []).some(st => st.title.toLowerCase().includes(query));
        return matchesTitle || matchesSubtasks;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  };

  const dayTodos = getFilteredTodos(dateStr);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTodo({
      title: newTaskTitle.trim(),
      date: dateStr,
      completed: false,
      priority: newTaskPriority,
      subtasks: [],
    });
    setNewTaskTitle('');
    setNewTaskPriority('medium');
  };

  const handleAddSubtask = (todoId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newSubtaskTitles[todoId];
    if (!title?.trim()) return;
    
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    
    const newSubtask = { id: crypto.randomUUID(), title: title.trim(), completed: false };
    updateTodo(todoId, { subtasks: [...(todo.subtasks || []), newSubtask] });
    setNewSubtaskTitles(prev => ({ ...prev, [todoId]: '' }));
  };

  const toggleSubtask = (todoId: string, subtaskId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    
    const newSubtasks = (todo.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    // Auto-complete main task if all subtasks are completed and there is at least one subtask
    const allCompleted = newSubtasks.length > 0 && newSubtasks.every(st => st.completed);
    
    updateTodo(todoId, { 
      subtasks: newSubtasks,
      ...(allCompleted && !todo.completed ? { completed: true, completedAt: Date.now() } : {})
    });
  };

  const deleteSubtask = (todoId: string, subtaskId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    updateTodo(todoId, { subtasks: (todo.subtasks || []).filter(st => st.id !== subtaskId) });
  };

  const handleImageUpload = (todoId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateTodo(todoId, { image: result });
    };
    reader.readAsDataURL(file);
  };

  const renderTodoCard = (todo: Todo, compact = false) => {
    const subtasks = todo.subtasks || [];
    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const progress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
    
    const priorityColors = {
      high: 'text-red-600 bg-red-50 border-red-200',
      medium: 'text-amber-600 bg-amber-50 border-amber-200',
      low: 'text-blue-600 bg-blue-50 border-blue-200'
    };

    return (
      <div
        key={todo.id}
        className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${
          todo.completed ? 'border-zinc-200 opacity-75' : 'border-zinc-200'
        }`}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={() => toggleComplete(todo.id)}
            className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
              todo.completed
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-zinc-300 hover:border-indigo-500'
            }`}
          >
            {todo.completed && <CheckSquare className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`${compact ? 'text-base' : 'text-lg'} font-medium ${
                  todo.completed ? 'text-zinc-400 line-through' : 'text-zinc-900'
                }`}
              >
                {todo.title}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${priorityColors[todo.priority] || priorityColors.medium}`}>
                <Flag className="w-3 h-3" />
                {todo.priority ? todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1) : 'Medium'}
              </span>
            </div>
            
            {!compact && (
              <>
                {/* Subtasks Progress */}
                {subtasks.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                      <span className="flex items-center gap-1"><ListTodo className="w-3 h-3" /> Subtasks</span>
                      <span>{completedSubtasks} / {subtasks.length} ({progress}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtasks List */}
                <div className="mt-3 space-y-2">
                  {subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => toggleSubtask(todo.id, st.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          st.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-zinc-300 hover:border-indigo-400'
                        }`}
                      >
                        {st.completed && <CheckSquare className="w-3 h-3" />}
                      </button>
                      <span className={`text-sm flex-1 ${st.completed ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
                        {st.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(todo.id, st.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add Subtask Form */}
                  {!todo.completed && (
                    <form onSubmit={(e) => handleAddSubtask(todo.id, e)} className="flex items-center gap-2 mt-2">
                      <Plus className="w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        value={newSubtaskTitles[todo.id] || ''}
                        onChange={(e) => setNewSubtaskTitles(prev => ({ ...prev, [todo.id]: e.target.value }))}
                        placeholder="Add a subtask..."
                        className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 text-zinc-700 placeholder:text-zinc-400"
                      />
                      <button 
                        type="submit"
                        disabled={!(newSubtaskTitles[todo.id]?.trim())}
                        className="text-xs font-medium text-indigo-600 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </form>
                  )}
                </div>
                
                {todo.image && (
                  <div className="mt-4 relative group rounded-lg overflow-hidden border border-zinc-200 inline-block">
                    <img src={todo.image} alt="Task attachment" className="max-h-64 object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                      <button
                        onClick={() => setEditingTodo(todo)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md font-medium flex items-center gap-2 transition-colors"
                      >
                        <Wand2 className="w-4 h-4" />
                        Edit with AI
                      </button>
                      <button
                        onClick={() => updateTodo(todo.id, { image: undefined })}
                        className="p-2 bg-red-500/80 hover:bg-red-50 text-white rounded-lg backdrop-blur-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {compact && subtasks.length > 0 && (
              <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
                <ListTodo className="w-3 h-3" />
                <span>{completedSubtasks} / {subtasks.length} subtasks</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {!todo.image && !compact && (
              <label className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors">
                <ImageIcon className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(todo.id, file);
                  }}
                />
              </label>
            )}
            <button
              onClick={() => deleteTodo(todo.id)}
              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CalendarPicker = () => {
    const [currentMonth, setCurrentMonth] = useState(selectedDate);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-2xl border border-zinc-200 shadow-xl p-4 w-72">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-zinc-100 rounded-full">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-zinc-900">{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-zinc-100 rounded-full">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-[10px] font-bold text-zinc-400 text-center py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedDate(day);
                  setIsCalendarOpen(false);
                }}
                className={`
                  h-8 w-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all
                  ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 
                    isCurrentMonth ? 'text-zinc-700 hover:bg-zinc-100' : 'text-zinc-300 hover:bg-zinc-50'}
                  ${isToday && !isSelected ? 'text-indigo-600 font-bold ring-1 ring-indigo-200' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, viewMode === 'day' ? 1 : 7))}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-600" />
          </button>
          <div className="relative">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 rounded-xl transition-colors group"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 min-w-[140px] sm:w-48 text-center group-hover:text-indigo-600">
                {viewMode === 'day' 
                  ? format(selectedDate, 'MMMM d, yyyy')
                  : `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
                }
              </h2>
              <CalendarIcon className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500" />
            </button>
            {isCalendarOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsCalendarOpen(false)}
                />
                <CalendarPicker />
              </>
            )}
          </div>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? 1 : 7))}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-zinc-100 p-1 rounded-lg flex-1 sm:flex-none">
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'day' ? 'bg-white text-indigo-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'week' ? 'bg-white text-indigo-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Week
            </button>
          </div>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap"
          >
            Today
          </button>
        </div>
      </header>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <form onSubmit={handleAddTodo} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <div className="flex gap-3">
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                className="px-4 py-3 rounded-xl border border-zinc-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-zinc-700"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-200 pb-4 gap-4">
            <h3 className="text-lg font-medium text-zinc-900">Tasks</h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-zinc-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex bg-zinc-100 p-1 rounded-lg w-full sm:w-auto justify-center">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${filter === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${filter === 'active' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${filter === 'completed' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {viewMode === 'day' ? (
              dayTodos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500">
                    {filter === 'all' ? 'No tasks for this day. Enjoy your free time!' : `No ${filter} tasks for this day.`}
                  </p>
                </div>
              ) : (
                dayTodos.map((todo) => renderTodoCard(todo))
              )
            ) : (
              <div className="space-y-8">
                {weekDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const todosForDay = getFilteredTodos(dayStr);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div key={dayStr} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border ${isToday ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider">{format(day, 'EEE')}</span>
                          <span className="text-lg font-bold leading-none">{format(day, 'd')}</span>
                        </div>
                        <div>
                          <h4 className={`font-semibold ${isToday ? 'text-indigo-600' : 'text-zinc-900'}`}>
                            {format(day, 'EEEE')}
                          </h4>
                          <p className="text-xs text-zinc-500">{todosForDay.length} tasks</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 pl-12 sm:pl-16">
                        {todosForDay.length === 0 ? (
                          <p className="text-sm text-zinc-400 italic py-2">No tasks scheduled</p>
                        ) : (
                          todosForDay.map((todo) => renderTodoCard(todo, true))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingTodo && (
        <ImageEditorModal
          todo={editingTodo}
          onClose={() => setEditingTodo(null)}
          onSave={(newImage) => {
            updateTodo(editingTodo.id, { image: newImage });
            setEditingTodo(null);
          }}
        />
      )}
    </div>
  );
};
