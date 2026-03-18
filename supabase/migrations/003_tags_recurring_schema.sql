-- =============================================
-- ChronoTask Sprint 4: 标签 + 重复任务数据库迁移
-- =============================================

-- =============================================
-- 1. 标签表 (tags)
-- =============================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 标签表 RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tags"
  ON tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 标签表索引
CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);

-- =============================================
-- 2. 任务标签关联表 (todo_tags)
-- =============================================
CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (todo_id, tag_id)
);

-- 关联表 RLS
ALTER TABLE todo_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own todo_tags"
  ON todo_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid()
    )
  );

-- 关联表索引
CREATE INDEX IF NOT EXISTS idx_todo_tags_tag ON todo_tags(tag_id);

-- =============================================
-- 3. 更新 todos 表 - 添加 parent_todo_id 支持重复任务
-- =============================================
ALTER TABLE todos 
  ADD COLUMN IF NOT EXISTS parent_todo_id UUID REFERENCES todos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_todos_parent ON todos(parent_todo_id);

-- =============================================
-- 4. 启用 Realtime
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE tags;
ALTER PUBLICATION supabase_realtime ADD TABLE todo_tags;
