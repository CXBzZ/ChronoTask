import React, { useState, useMemo } from 'react';
import { Plus, CheckSquare, Flag, ListTodo, X, Search, Calendar, MoreHorizontal, Edit2 } from 'lucide-react';
import { Todo, Priority, TaskList, SmartListType } from '../types';
import { format, parseISO, isSameDay, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { TodoEditModal } from './TodoEditModal';

interface ListViewProps {
  selectedListId: string | SmartListType;
  lists: TaskList[];
  todos: Todo[];
  isLoading: boolean;
  onAddTodo: (todo: { title: string; list_id: string; date?: string; priority: Priority }) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onDeleteTodo: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}

const priorityOrder = { high: 3, medium: 2, low: 1 };

const priorityColors = {
  high: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: '高' },
  medium: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: '中' },
  low: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: '低' },
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
  
  // 编辑弹窗状态
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
        result = result.filter((t) => t.list_id === selectedListId);
    }

    if (filter === 'active') {
      result = result.filter((t) => !t.completed);
    } else if (filter === 'completed') {
      result = result.filter((t) => t.completed);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.subtasks?.some((st) => st.title.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [todos, selectedListId, filter, searchQuery, lists]);

  const getCurrentListId = () => {
    if (selectedListId === 'inbox' || selectedListId === 'today' || 
        selectedListId === 'upcoming' || selectedListId === 'completed') {
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

  const handleOpenEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTodo(null);
  };

  const handleSaveTodo = (updates: Partial<Todo>) => {
    if (editingTodo) {
      onUpdateTodo(editingTodo.id, updates);
    }
  };

  // 格式化日期显示
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);

    if (isSameDay(date, today)) return { text: '今天', color: 'text-emerald-600' };
    if (isSameDay(date, tomorrow)) return { text: '明天', color: 'text-indigo-600' };
    
    const daysDiff = differenceInDays(date, today);
    if (daysDiff < 0) return { text: format(date, 'M月d日', { locale: zhCN }), color: 'text-red-500' };
    if (daysDiff <= 7) return { text: format(date, 'M月d日', { locale: zhCN }), color: 'text-zinc-600' };
    return { text: format(date, 'M月d日', { locale: zhCN }), color: 'text-zinc-400' };
  };

  const renderTodoCard = (todo: Todo) => {
    const subtasks = todo.subtasks || [];
    const completedSubtasks = subtasks.filter((st) => st.completed).length;
    const progress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
    const dateDisplay = formatDateDisplay(todo.date);
    const priorityConfig = priorityColors[todo.priority];
    const list = lists.find((l) => l.id === todo.list_id);

    return (
      <div
        key={todo.id}
        className={`bg-white border rounded-xl p-4 shadow-sm transition-all hover:shadow-md ${
          todo.completed ? 'border-zinc-200 opacity-75' : 'border-zinc-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* 完成勾选 */}
          <button
            onClick={() => onToggleComplete(todo.id)}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              todo.completed
                ? 'bg-indigo-600 border-indigo-600'
                : 'border-zinc-300 hover:border-indigo-500'
            }`}
          >
            {todo.completed && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* 标题行 */}
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`text-base font-medium cursor-pointer hover:text-indigo-600 transition-colors ${
                  todo.completed ? 'text-zinc-400 line-through' : 'text-zinc-900'
                }`}
                onClick={() => handleOpenEditModal(todo)}
              >
                {todo.title}
              </p>
              
              {/* 优先级标签 */}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}
              >
                {priorityConfig.label}
              </span>

              {/* 清单标签（当不在当前清单视图时显示） */}
              {selectedListId !== todo.list_id && list && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                  style={{ backgroundColor: list.color + '20', color: list.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: list.color }} />
                  {list.name}
                </span>
              )}
            </div>

            {/* 描述预览 */}
            {todo.description && (
              <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                {todo.description.slice(0, 100)}
                {todo.description.length > 100 && '...'}
              </p>
            )}

            {/* 元信息行 */}
            <div className="flex items-center gap-3 mt-2">
              {dateDisplay && (
                <span className={`text-xs flex items-center gap-1 ${dateDisplay.color}`}>
                  <Calendar className="w-3 h-3" />
                  {dateDisplay.text}
                </span>
              )}
              
              {subtasks.length > 0 && (
                <span className="text-xs text-zinc-400 flex items-center gap-1"
                >
                  <ListTodo className="w-3 h-3" />
                  {completedSubtasks}/{subtasks.length}
                </span>
              )}
            </div>

            {/* 子任务列表（简化展示） */}
            {subtasks.length > 0 && (
              <div className="mt-3 space-y-1">
                {subtasks.slice(0, 3).map((st) => (
                  <div key={st.id} className="flex items-center gap-2"
                  >
                    <button
                      onClick={() => onToggleSubtask(todo.id, st.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        st.completed
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-zinc-300 hover:border-indigo-400'
                      }`}
                    >
                      {st.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`text-sm ${
                        st.completed ? 'text-zinc-400 line-through' : 'text-zinc-600'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
                {subtasks.length > 3 && (
                  <span className="text-xs text-zinc-400">+{subtasks.length - 3} 个子任务</span>
                )}
              </div>
            )}

            {/* 快速添加子任务 */}
            {!todo.completed && (
              <form
                onSubmit={(e) => handleAddSubtask(todo.id, e)}
                className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-400" />
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
                  className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 text-zinc-600 placeholder:text-zinc-400"
                />
              </form>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              onClick={() => handleOpenEditModal(todo)}
              className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="编辑"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('确定要删除这个任务吗？')) {
                  onDeleteTodo(todo.id);
                }
              }}
              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="删除"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
    <>
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
                filteredTodos.map((todo) => (
                  <div key={todo.id} className="group">
                    {renderTodoCard(todo)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <TodoEditModal
        todo={editingTodo}
        lists={lists}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveTodo}
        onDelete={onDeleteTodo}
        onAddSubtask={onAddSubtask}
        onToggleSubtask={onToggleSubtask}
        onDeleteSubtask={onDeleteSubtask}
      />
    </>
  );
};
