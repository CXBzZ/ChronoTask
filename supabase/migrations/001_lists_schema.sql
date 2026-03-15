-- =============================================
-- ChronoTask Sprint 1: 清单系统数据库迁移
-- 执行顺序：
-- 1. 创建 lists 表
-- 2. 创建 user_settings 表
-- 3. 修改 todos 表（新增字段，date 改为可选）
-- 4. 添加 RLS 策略和索引
-- 5. 启用 Realtime
-- =============================================

-- =============================================
-- 1. 清单表 (lists)
-- =============================================
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT, -- lucide 图标名，如 'briefcase', 'home'
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false, -- 系统默认清单不可删
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 清单表 RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own lists"
  ON lists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. 用户设置表 (user_settings)
-- 用于迁移标记、默认清单等
-- =============================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_migrated_v1 BOOLEAN DEFAULT false,
  default_list_id UUID REFERENCES lists(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户设置表 RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. 修改 todos 表
-- =============================================

-- 新增 list_id 字段（先允许 NULL，迁移后设为必填）
ALTER TABLE todos 
  ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES lists(id),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ALTER COLUMN date DROP NOT NULL; -- 允许无截止日期

-- 添加 todos 表索引
CREATE INDEX IF NOT EXISTS idx_todos_user_list ON todos(user_id, list_id);

-- =============================================
-- 4. 性能优化索引
-- =============================================
CREATE INDEX IF NOT EXISTS idx_lists_user_order ON lists(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_todos_user_date ON todos(user_id, date);

-- =============================================
-- 5. 启用 Realtime
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE lists;
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;

-- =============================================
-- 6. 迁移辅助函数（可选，也可在应用层实现）
-- =============================================

-- 为用户创建默认清单的函数
CREATE OR REPLACE FUNCTION create_default_lists(p_user_id UUID)
RETURNS TABLE (inbox_id UUID, schedule_id UUID) AS $$
DECLARE
  v_inbox_id UUID;
  v_schedule_id UUID;
BEGIN
  -- 创建收件箱
  INSERT INTO lists (user_id, name, icon, color, sort_order, is_default)
  VALUES (p_user_id, '收件箱', 'inbox', '#6366f1', 0, true)
  RETURNING id INTO v_inbox_id;
  
  -- 创建日程
  INSERT INTO lists (user_id, name, icon, color, sort_order, is_default)
  VALUES (p_user_id, '日程', 'calendar', '#10b981', 1, true)
  RETURNING id INTO v_schedule_id;
  
  -- 标记已迁移
  INSERT INTO user_settings (user_id, has_migrated_v1, default_list_id)
  VALUES (p_user_id, true, v_inbox_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET has_migrated_v1 = true, default_list_id = v_inbox_id;
  
  RETURN QUERY SELECT v_inbox_id, v_schedule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 注意事项：
-- 1. 执行此脚本后，现有任务的 list_id 为 NULL
-- 2. 需要在应用层运行数据迁移脚本，将现有任务分配到对应清单
-- 3. 迁移完成后，可考虑将 list_id 设为 NOT NULL
-- =============================================
