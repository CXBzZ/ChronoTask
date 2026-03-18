# Sprint 2 开发计划：清单视图整合 + 任务编辑

## 目标
完成完整的任务编辑体验，包括弹窗编辑、描述字段、各选择器组件

## 任务清单

### 1. 基础选择器组件

#### PrioritySelector.tsx
- 优先级选择：高/中/低
- 视觉区分：红色/橙色/蓝色
- 支持小尺寸和正常尺寸两种模式

#### ListSelector.tsx  
- 清单下拉选择
- 显示图标和颜色
- 支持快速选择智能清单

#### DatePicker.tsx
- 日期选择器
- 快捷选项：今天、明天、下周、无日期
- 日历弹窗选择

### 2. 描述编辑器

#### DescriptionEditor.tsx
- 多行文本输入
- Markdown 简单预览（可选）
- 展开/折叠状态

### 3. 核心弹窗

#### TodoEditModal.tsx
- 完整任务编辑弹窗
- 包含：标题、描述、清单、日期、优先级
- 子任务列表编辑
- 图片预览
- 删除按钮

### 4. 改造现有组件

#### TodoItem 改造
- 添加「更多」按钮（三个点）
- 点击打开 TodoEditModal
- 保留现有行内编辑功能

#### ListView 改造
- 集成 TodoEditModal
- 移除复杂的行内编辑逻辑

## 开发顺序
1. 基础选择器组件（PrioritySelector、ListSelector、DatePicker）
2. DescriptionEditor 组件
3. TodoEditModal 组件
4. 改造 TodoItem，添加编辑入口
5. 测试验证

## 数据结构
```typescript
// 任务编辑表单数据
interface TodoFormData {
  title: string;
  description?: string;
  list_id: string;
  date?: string;
  priority: Priority;
}
```
