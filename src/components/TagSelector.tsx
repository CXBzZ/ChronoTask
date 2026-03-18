import React, { useState, useRef, useEffect } from 'react';
import { Tag as TagIcon, Plus, X, Check } from 'lucide-react';
import { Tag } from '../types';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  onCreateTag?: (name: string, color: string) => Promise<void>;
}

const TAG_COLORS = [
  { value: '#fef3c7', label: '琥珀' },
  { value: '#dbeafe', label: '蓝色' },
  { value: '#d1fae5', label: '翠绿' },
  { value: '#fce7f3', label: '粉色' },
  { value: '#e9d5ff', label: '紫色' },
  { value: '#cffafe', label: '青色' },
  { value: '#fee2e2', label: '红色' },
  { value: '#f3f4f6', label: '灰色' },
];

export const TagSelector: React.FC<TagSelectorProps> = ({
  tags,
  selectedTagIds,
  onChange,
  onCreateTag,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0].value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !onCreateTag) return;
    
    await onCreateTag(newTagName.trim(), selectedColor);
    setNewTagName('');
    setIsCreating(false);
  };

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

  return (
    <div ref={containerRef} className="relative">
      {/* 显示已选标签 */}
      <div className="flex flex-wrap items-center gap-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: tag.color + '40', color: '#374151' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
            <button
              onClick={() => toggleTag(tag.id)}
              className="ml-0.5 hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
        >
          <TagIcon className="w-3 h-3" />
          {selectedTags.length > 0 ? '修改标签' : '添加标签'}
        </button>
      </div>

      {/* 下拉弹窗 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 z-50 w-64">
          {isCreating ? (
            <form onSubmit={handleCreateTag} className="p-3 space-y-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="标签名称"
                autoFocus
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              
              <div className="flex items-center gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-zinc-800 scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!newTagName.trim()}
                  className="flex-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="max-h-48 overflow-y-auto">
                {tags.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-zinc-400 text-center">暂无标签</p>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-left text-zinc-700">{tag.name}</span>
                      {selectedTagIds.includes(tag.id) && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </button>
                  ))
                )}
              </div>
              
              {onCreateTag && (
                <>
                  <div className="my-2 border-t border-zinc-100" />
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    新建标签
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
