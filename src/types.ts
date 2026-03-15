export type Priority = 'high' | 'medium' | 'low';

// =============================================
// Sprint 1: 清单系统类型
// =============================================

export interface TaskList {
  id: string;
  user_id: string;
  name: string;
  icon?: string; // lucide 图标名
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  has_migrated_v1: boolean;
  default_list_id?: string;
  updated_at: string;
}

export type SmartListType = 'inbox' | 'today' | 'upcoming' | 'completed';

// =============================================
// 子任务
// =============================================

export interface Subtask {
  id: string;
  todo_id: string;
  user_id: string;
  title: string;
  completed: boolean;
}

// =============================================
// 任务 (Sprint 1 扩展)
// =============================================

export interface Todo {
  id: string;
  user_id: string;
  list_id: string; // Sprint 1: 新增，必填
  title: string;
  description?: string; // Sprint 2: 预留
  date?: string; // Sprint 1: 改为可选 (YYYY-MM-DD)
  completed: boolean;
  completed_at?: number; // timestamp for review sorting
  image?: string; // base64 data URL
  priority: Priority;
  subtasks: Subtask[];
  // Sprint 3+ 预留字段
  reminder_id?: string;
  reminder_at?: string;
  tags?: string[]; // Sprint 4: tag ids
}

/** Shape used when creating a new Todo */
export type TodoInsert = Omit<Todo, 'id' | 'user_id' | 'subtasks'>;

/** Shape for updating a Todo */
export type TodoUpdate = Partial<Omit<Todo, 'id' | 'user_id' | 'subtasks'>>;

/** Shape for legacy local-only todos (pre-migration) */
export interface LegacyTodo {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  completedAt?: number;
  image?: string;
  priority: Priority;
  subtasks: { id: string; title: string; completed: boolean }[];
}

// =============================================
// UI 状态类型
// =============================================

export type MainTab = 'list' | 'calendar' | 'focus';
export type CalendarView = 'day' | 'week' | 'month';

export interface AppState {
  // 当前选中的清单/智能清单
  selectedListId: string | SmartListType;
  // 当前主 Tab
  mainTab: MainTab;
  // 日历状态
  calendarView: CalendarView;
  selectedDate: Date;
}

// =============================================
// 智能清单计数
// =============================================

export interface SmartListCounts {
  inbox: number;
  today: number;
  upcoming: number;
  completed: number;
}
