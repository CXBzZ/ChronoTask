-- =============================================
-- ChronoTask Sprint 3: 提醒系统数据库迁移
-- =============================================

-- 提醒表
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_at TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('once', 'daily', 'weekly', 'monthly', 'custom')),
  custom_rule JSONB DEFAULT NULL, -- { interval: number, end_date?: string, days_of_week?: number[] }
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  parent_todo_id UUID REFERENCES todos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 提醒表 RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own reminders"
  ON reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 性能索引
CREATE INDEX IF NOT EXISTS idx_reminders_user_time ON reminders(user_id, reminder_at);
CREATE INDEX IF NOT EXISTS idx_reminders_todo ON reminders(todo_id);
CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON reminders(user_id, is_enabled, reminder_at);

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reminders;

-- =============================================
-- 更新 todos 表冗余字段（方便查询）
-- =============================================
ALTER TABLE todos 
  ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reminder_id UUID REFERENCES reminders(id);

-- 更新索引
CREATE INDEX IF NOT EXISTS idx_todos_user_reminder ON todos(user_id, reminder_at);
