import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  CheckCircle2,
  Plus,
  Image as ImageIcon,
  AlertCircle,
  Bell,
  Clock,
} from 'lucide-react';
import { Todo, TaskList, Priority, Subtask, Reminder } from '../types';
import { PrioritySelector } from './PrioritySelector';
import { ListSelector } from './ListSelector';
import { DatePicker } from './DatePicker';
import { DescriptionEditor } from './DescriptionEditor';
import { ReminderModal } from './ReminderModal';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TodoEditModalProps {
  todo: Todo | null;
  lists: TaskList[];
  reminders: Reminder[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (todo: Partial<Todo> & { subtasks?: Subtask[] }) => void;
  onDelete?: (id: string) => void;
  onAddSubtask?: (todoId: string, title: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask?: (todoId: string, subtaskId: string) => void;
  onCreateReminder?: (todoId: string, reminder: Omit<Reminder, 'id' | 'user_id' | 'todo_id' | 'created_at'>) => void;
  onUpdateReminder?: (id: string, updates: Partial<Reminder>) => void;
  onDeleteReminder?: (id: string) => void;
}

interface TodoEditModalProps {
  todo: Todo | null;
  lists: TaskList[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (todo: Partial<Todo> & { subtasks?: Subtask[] }) => void;
  onDelete?: (id: string) => void;
  onAddSubtask?: (todoId: string, title: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask?: (todoId: string, subtaskId: string) => void;
}

export const TodoEditModal: React.FC<TodoEditModalProps> = ({
  todo,
  lists,
  reminders,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onCreateReminder,
  onUpdateReminder,
  onDeleteReminder,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    list_id: '',
    date: undefined as string | undefined,
    priority: 'medium' as Priority,
  });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title,
        description: todo.description || '',
        list_id: todo.list_id,
        date: todo.date,
        priority: todo.priority,
      });
    } else {
      // 新建任务默认值
      const defaultList = lists.find((l) => l.name === '收件箱') || lists[0];
      setFormData({
        title: '',
        description: '',
        list_id: defaultList?.id || '',
        date: undefined,
        priority: 'medium',
      });
    }
  }, [todo, lists, isOpen]);

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

  const isNew = !todo;
  const subtasks = todo?.subtasks || [];

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      onSave({
        ...formData,
        title: formData.title.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !todo || !onAddSubtask) return;
    onAddSubtask(todo.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-900">
            {isNew ? '新建任务' : '编辑任务'}
          </h2>
          <div className="flex items-center gap-2">
            {!isNew && onDelete && (
              <button
                onClick={() => {
                  if (todo && confirm('确定要删除这个任务吗？')) {
                    onDelete(todo.id);
                    onClose();
                  }
                }}
                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="删除任务"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 标题输入 */}
          <div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="任务标题"
              className="w-full text-xl font-semibold text-zinc-900 placeholder:text-zinc-300 border-0 focus:outline-none focus:ring-0 p-0"
              autoFocus
            />
          </div>

          {/* 属性选择行 */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">清单:</span>
              <ListSelector
                lists={lists}
                value={formData.list_id}
                onChange={(list_id) => setFormData({ ...formData, list_id })}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">日期:</span>
              <DatePicker
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
              />
            </div>
          </div>

          {/* 优先级 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">优先级:</span>
            <PrioritySelector
              value={formData.priority}
              onChange={(priority) => setFormData({ ...formData, priority })}
              size="sm"
            />
          </div>

          {/* 描述编辑器 */}
          <DescriptionEditor
            value={formData.description}
            onChange={(description) => setFormData({ ...formData, description })}
          />

          {/* 子任务列表（仅编辑模式） */}
          {!isNew && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700">子任务</span>
                <span className="text-xs text-zinc-400">
                  ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
                </span>
              </div>

              <div className="p-4 space-y-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 group"
                  >
                    <button
                      onClick={() => onToggleSubtask?.(todo!.id, subtask.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        subtask.completed
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-zinc-300 hover:border-indigo-400'
                      }`}
                    >
                      {subtask.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        subtask.completed ? 'text-zinc-400 line-through' : 'text-zinc-700'
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => onDeleteSubtask?.(todo!.id, subtask.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* 添加子任务 */}
                <form onSubmit={handleAddSubtask} className="flex items-center gap-3 pt-2">
                  <div className="w-5 h-5 rounded border-2 border-dashed border-zinc-300 flex items-center justify-center">
                    <Plus className="w-3 h-3 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="添加子任务..."
                    className="flex-1 text-sm text-zinc-700 placeholder:text-zinc-400 border-0 focus:outline-none focus:ring-0 p-0"
                  />
                </form>
              </div>
            </div>
          )}

          {/* 提醒设置 */}
          {!isNew && todo && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700">提醒</span>
                </div>
                <button
                  onClick={() => setIsReminderModalOpen(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {todo.reminder_id ? '修改' : '设置'}
                </button>
              </div>

              <div className="p-4">
                {todo.reminder_id && reminders ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-700">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>
                        {todo.reminder_at && format(parseISO(todo.reminder_at), 'M月d日 HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                      {reminders.find((r) => r.id === todo.reminder_id)?.type === 'once'
                        ? '仅一次'
                        : reminders.find((r) => r.id === todo.reminder_id)?.type === 'daily'
                        ? '每天'
                        : reminders.find((r) => r.id === todo.reminder_id)?.type === 'weekly'
                        ? '每周'
                        : reminders.find((r) => r.id === todo.reminder_id)?.type === 'monthly'
                        ? '每月'
                        : '自定义'}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">暂无提醒</p>
                )}
              </div>
            </div>
          )}

          {/* 图片预览 */}
          {todo?.image && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700">图片</span>
              </div>
              <div className="p-4">
                <img
                  src={todo.image}
                  alt="Task"
                  className="max-h-64 rounded-lg object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <AlertCircle className="w-4 h-4" />
            <span>按 Ctrl+Enter 快速保存</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting ? '保存中...' : isNew ? '创建任务' : '保存更改'}
            </button>
          </div>
        </div>
      </div>

      {/* Reminder Modal */}
      {!isNew && todo && (
        <ReminderModal
          todoId={todo.id}
          todoTitle={todo.title}
          existingReminder={reminders?.find((r) => r.id === todo.reminder_id)}
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          onSave={(reminderData) => {
            const existing = reminders?.find((r) => r.id === todo.reminder_id);
            if (existing && onUpdateReminder) {
              onUpdateReminder(existing.id, reminderData);
            } else if (onCreateReminder) {
              onCreateReminder(todo.id, reminderData);
            }
          }}
          onDelete={() => {
            const existing = reminders?.find((r) => r.id === todo.reminder_id);
            if (existing && onDeleteReminder) {
              onDeleteReminder(existing.id);
            }
          }}
        />
      )}
    </div>
  );
};
