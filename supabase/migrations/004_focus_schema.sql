-- =============================================
-- ChronoTask Sprint 5: 专注系统数据库迁移
-- =============================================

-- 专注记录表
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  todo_id UUID REFERENCES todos(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER NOT NULL, -- 计划时长（秒）
  actual_duration INTEGER DEFAULT 0, -- 实际专注时长（秒）
  is_completed BOOLEAN DEFAULT false,
  type TEXT CHECK (type IN ('focus', 'short_break', 'long_break')) DEFAULT 'focus',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 专注表 RLS
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own focus sessions"
  ON focus_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_focus_user_started ON focus_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_focus_todo ON focus_sessions(todo_id);

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE focus_sessions;
