import { useState, useEffect, useCallback } from 'react';

export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // 从 localStorage 读取设置
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chronotask-dark-mode');
      if (stored !== null) {
        return stored === 'true';
      }
      // 如果没有设置，使用系统偏好
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    // 应用或移除 dark 类
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // 保存到 localStorage
    localStorage.setItem('chronotask-dark-mode', String(isDark));
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  return [isDark, toggle];
}
