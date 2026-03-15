import React, { useState, useMemo } from 'react';
import { Plus, CheckSquare, Flag, ListTodo, X, Search, Calendar } from 'lucide-react';
import { Todo, Priority, TaskList, SmartListType } from '../types';
import { format, parseISO, isSameDay, differenceInDays } from 'date-fns';

interface ListViewProps {
  // 当前筛选条件
  selectedListId: string | SmartListType;
  lists: TaskList[];
  
  // 数据
  todos: Todo[];
  isLoading: boolean;
  
  // 回调
  onAddTodo: (todo: { title: string; list_id: string; date?: string; priority: Priority }) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onDeleteTodo: (id: string) => void;
  onToggleComplete: (id: string) => void;
  
  // 子任务
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}

const priorityOrder = { high: 3, medium: 2, low: 1 };

const priorityColors = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-blue-600 bg-blue-50 border-blue-200',
};

export const ListView: React.FC<ListViewProps> = ({
  selectedListId,
  lists,
  todos,
  isLoading,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onToggleComplete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<Record<string, string>>({});
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // 获取当前选中的清单名称
  const getListTitle = () => {
    switch (selectedListId) {
      case 'inbox':
        return '收件箱';
      case 'today':
        return '今天';
      case 'upcoming':
        return '即将到来';
      case 'completed':
        return '已完成';
      default:
        const list = lists.find((l) => l.id === selectedListId);
        return list?.name || '任务';
    }
  };

  // 智能清单过滤逻辑
  const filteredTodos = useMemo(() => {
    let result = [...todos];

    // 按清单/智能清单筛选
    switch (selectedListId) {
      case 'inbox':
        result = result.filter((t) => !t.date);
        break;
      case 'today':
        result = result.filter((t) => t.date === format(new Date(), 'yyyy-MM-dd'));
        break;
      case 'upcoming':
        result = result.filter((t) => {
          if (!t.date) return false;
          const daysDiff = differenceInDays(parseISO(t.date), new Date());
          return daysDiff > 0 && daysDiff <= 7;
        });
        break;
      case 'completed':
        result = result.filter((t) => {
          if (!t.completed) return false;
          if (!t.completed_at) return false;
          const daysDiff = differenceInDays(new Date(), new Date(t.completed_at));
          return daysDiff <= 30;
        });
        break;
      default:
        // 普通清单
        result = result.filter((t) => t.list_id === selectedListId);
    }

    // 按状态筛选
    if (filter === 'active') {
      result = result.filter((t) => !t.completed);
    } else if (filter === 'completed') {
      result = result.filter((t) => t.completed);
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.subtasks?.some((st) => st.title.toLowerCase().includes(query))
      );
    }

    // 排序：未完成优先，然后按优先级
    return result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [todos, selectedListId, filter, searchQuery, lists]);

  // 获取当前清单ID（用于创建新任务）
  const getCurrentListId = () => {
    if (selectedListId === 'inbox' || selectedListId === 'today' || 
        selectedListId === 'upcoming' || selectedListId === 'completed') {
      // 智能清单，使用用户的第一个自定义清单，或收件箱
      const defaultList = lists.find((l) => l.name === '收件箱');
      return defaultList?.id || lists[0]?.id || '';
    }
    return selectedListId;
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const listId = getCurrentListId();
    if (!listId) return;

    const todoData = {
      title: newTaskTitle.trim(),
      list_id: listId,
      priority: newTaskPriority,
      date: selectedListId === 'today' ? format(new Date(), 'yyyy-MM-dd') : undefined,
    };

    onAddTodo(todoData);
    setNewTaskTitle('');
    setNewTaskPriority('medium');
  };

  const handleAddSubtask = (todoId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newSubtaskTitles[todoId];
    if (!title?.trim()) return;
    onAddSubtask(todoId, title.trim());
    setNewSubtaskTitles((prev) => ({ ...prev, [todoId]: '' }));
  };

  const handleEditSubmit = (todoId: string) => {
    if (!editTitle.trim()) return;
    onUpdateTodo(todoId, { title: editTitle.trim() });
    setEditingTodoId(null);
    setEditTitle('');
  };

  const renderTodoCard = (todo: Todo) => {
    const subtasks = todo.subtasks || [];
    const completedSubtasks = subtasks.filter((st) => st.completed).length;
    const progress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
    const isEditing = editingTodoId === todo.id;

    return (
      <div
        key={todo.id}
        className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${
          todo.completed ? 'border-zinc-200 opacity-75' : 'border-zinc-200'
        }`}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={() => onToggleComplete(todo.id)}
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
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleEditSubmit(todo.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit(todo.id);
                    if (e.key === 'Escape') {
                      setEditingTodoId(null);
                      setEditTitle('');
                    }
                  }}
                  autoFocus
                  className="flex-1 px-2 py-1 text-base font-medium border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p
                  onClick={() => {
                    setEditingTodoId(todo.id);
                    setEditTitle(todo.title);
                  }}
                  className={`text-lg font-medium cursor-pointer hover:text-indigo-600 ${
                    todo.completed ? 'text-zinc-400 line-through' : 'text-zinc-900'
                  }`}
                >
                  {todo.title}
                </p>
              )}
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${
                  priorityColors[todo.priority] || priorityColors.medium
                }`}
              >
                <Flag className="w-3 h-3" />
                {todo.priority === 'high' ? '高' : todo.priority === 'low' ? '低' : '中'}
              </span>
              {todo.date && (
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {todo.date}
                </span>
              )}
            </div>

            {/* Subtasks Progress */}
            {subtasks.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                  <span className="flex items-center gap-1">
                    <ListTodo className="w-3 h-3" /> 子任务
                  </span>
                  <span>
                    {completedSubtasks} / {subtasks.length} ({progress}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Subtasks List */}
            <div className="mt-3 space-y-2">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => onToggleSubtask(todo.id, st.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      st.completed
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'border-zinc-300 hover:border-indigo-400'
                    }`}
                  >
                    {st.completed && <CheckSquare className="w-3 h-3" />}
                  </button>
                  <span
                    className={`text-sm flex-1 ${
                      st.completed ? 'text-zinc-400 line-through' : 'text-zinc-700'
                    }`}
                  >
                    {st.title}
                  </span>
                  <button
                    onClick={() => onDeleteSubtask(todo.id, st.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Subtask Form */}
              {!todo.completed && (
                <form
                  onSubmit={(e) => handleAddSubtask(todo.id, e)}
                  className="flex items-center gap-2 mt-2"
                >
                  <Plus className="w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={newSubtaskTitles[todo.id] || ''}
                    onChange={(e) =>
                      setNewSubtaskTitles((prev) => ({
                        ...prev,
                        [todo.id]: e.target.value,
                      }))
                    }
                    placeholder="添加子任务..."
                    className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 text-zinc-700 placeholder:text-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskTitles[todo.id]?.trim()}
                    className="text-xs font-medium text-indigo-600 disabled:opacity-50"
                  >
                    添加
                  </button>
                </form>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('确定要删除这个任务吗？')) {
                onDeleteTodo(todo.id);
              }
            }}
            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-zinc-900">{getListTitle()}</h2>
          <span className="text-sm text-zinc-500">{filteredTodos.length} 个任务</span>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex bg-zinc-100 p-1 rounded-lg">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Add Task Form */}
          <form onSubmit={handleAddTodo} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="添加新任务..."
              className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-3">
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                className="px-4 py-3 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-700"
              >
                <option value="low">低优先级</option>
                <option value="medium">中优先级</option>
                <option value="high">高优先级</option>
              </select>
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-5 h-5" />
                添加
              </button>
            </div>
          </form>

          {/* Task List */}
          <div className="space-y-3">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500">
                  {searchQuery
                    ? '没有找到匹配的任务'
                    : filter === 'all'
                    ? '暂无任务，添加一个新任务吧！'
                    : filter === 'active'
                    ? '没有进行中的任务'
                    : '没有已完成的任务'}
                </p>
              </div>
            ) : (
              filteredTodos.map((todo) => renderTodoCard(todo))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
