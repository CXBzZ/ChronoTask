import React, { useState } from 'react';
import { FileText, AlignLeft, Eye, Edit3 } from 'lucide-react';

interface DescriptionEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  value = '',
  onChange,
  placeholder = '添加任务描述...',
  minHeight = 100,
}) => {
  const [isExpanded, setIsExpanded] = useState(!!value);
  const [showPreview, setShowPreview] = useState(false);

  // 简单的 Markdown 渲染（只支持基础格式）
  const renderMarkdown = (text: string) => {
    if (!text) return <p className="text-zinc-400 italic">暂无描述</p>;

    // 处理标题
    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-zinc-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-zinc-900 mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-zinc-900 mt-6 mb-4">$1</h1>');

    // 处理粗体和斜体
    html = html
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold"><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // 处理列表
    html = html
      .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-zinc-700">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-zinc-700">$1</li>');

    // 处理换行
    html = html.replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: html }} className="prose prose-sm max-w-none" />;
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
      >
        <AlignLeft className="w-4 h-4" />
        <span>添加描述</span>
      </button>
    );
  }

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700">描述</span>
          <span className="text-xs text-zinc-400">支持 Markdown</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-1.5 rounded-lg transition-colors ${
              showPreview ? 'bg-indigo-100 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200'
            }`}
            title={showPreview ? '编辑模式' : '预览模式'}
          >
            {showPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="p-3">
        {showPreview ? (
          <div className="min-h-[100px] text-sm">
            {renderMarkdown(value)}
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[100px] text-sm text-zinc-700 placeholder:text-zinc-400 resize-none focus:outline-none"
            style={{ minHeight }}
          />
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          **粗体** *斜体* # 标题 - 列表
        </span>
        {value && (
          <button
            onClick={() => {
              onChange('');
              setIsExpanded(false);
            }}
            className="text-xs text-red-500 hover:text-red-600"
          >
            清除
          </button>
        )}
      </div>
    </div>
  );
};
