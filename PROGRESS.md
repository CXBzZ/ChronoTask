# ChronoTask 开发进度

## 当前状态：Sprint 2 已完成 ✅

---

## 已完成功能

### Sprint 1: 清单系统 ✅
- [x] 数据库 Schema 迁移（lists, user_settings 表）
- [x] ListSidebar 组件（智能清单 + 自定义清单）
- [x] ListView 组件（按清单筛选任务）
- [x] 数据迁移逻辑（自动迁移旧数据到新清单系统）
- [x] Store API 扩展（lists CRUD）

### Sprint 2: 任务编辑 ✅
- [x] PrioritySelector 优先级选择器
- [x] ListSelector 清单选择器
- [x] DatePicker 日期选择器（含快捷选项和日历弹窗）
- [x] DescriptionEditor 描述编辑器（支持 Markdown 预览）
- [x] TodoEditModal 完整任务编辑弹窗
- [x] 重构 ListView 集成编辑弹窗
- [x] 优化任务卡片 UI（显示描述预览、清单标签、日期等）

---

## 待开发功能

### Sprint 3: 提醒系统 📋
- [ ] Reminders 数据库表
- [ ] Reminders API（含 check 接口）
- [ ] ReminderModal 提醒设置弹窗
- [ ] ReminderBadge 侧边栏红点提醒
- [ ] 应用内提醒通知（Toast 形式）
- [ ] 前端轮询检查提醒逻辑

### Sprint 4: 标签 + 重复任务 📋
- [ ] Tags 数据库表
- [ ] Tags API
- [ ] TagSelector 标签选择器
- [ ] TagSidebarGroup 标签侧边栏分组
- [ ] 重复任务生成算法
- [ ] RecurringIndicator 重复任务标识

### Sprint 5: 月视图 + 番茄专注 📋
- [ ] MonthView 月视图组件
- [ ] 顶部 Tab 导航（清单/日历/专注）
- [ ] Focus API
- [ ] FocusView + FocusTimer 专注计时器
- [ ] 专注统计卡片

---

## 最新提交

```
commit 3298f77
Author: Dev Claw <dev@cxbzz.github.io>
Date:   2026-03-18

    feat: Sprint 2 - 任务编辑弹窗与选择器组件
```

---

## 下一步行动

**Sprint 3: 提醒系统**

需要开始开发提醒功能，包括：
1. 创建 reminders 数据库表
2. 实现提醒 CRUD API
3. 开发 ReminderModal 弹窗
4. 实现应用内提醒通知

是否开始 Sprint 3?
