import React from 'react';
import { Flag } from 'lucide-react';
import { Priority } from '../types';

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const priorityConfig = {
  high: {
    label: '高优先级',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverBg: 'hover:bg-red-100',
  },
  medium: {
    label: '中优先级',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:bg-amber-100',
  },
  low: {
    label: '低优先级',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
  },
};

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  value,
  onChange,
  size = 'md',
  showLabel = true,
}) => {
  const config = priorityConfig[value];

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-1">
        {( ['high', 'medium', 'low'] as Priority[]).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`p-1.5 rounded-lg transition-all ${
              value === p
                ? `${priorityConfig[p].bgColor} ${priorityConfig[p].color}`
                : 'text-zinc-300 hover:text-zinc-400 hover:bg-zinc-50'
            }`}
            title={priorityConfig[p].label}
          >
            <Flag className="w-4 h-4 fill-current" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {( ['high', 'medium', 'low'] as Priority[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
            value === p
              ? `${priorityConfig[p].bgColor} ${priorityConfig[p].color} ${priorityConfig[p].borderColor}`
              : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <Flag className={`w-4 h-4 ${value === p ? 'fill-current' : ''}`} />
          {showLabel && priorityConfig[p].label}
        </button>
      ))}
    </div>
  );
};
