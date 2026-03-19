import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, Clock, Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { FocusSession, Todo, FocusType } from '../types';

interface FocusViewProps {
  todos: Todo[];
  onStartFocus: (session: Omit<FocusSession, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  onEndFocus: (id: string, updates: Partial<FocusSession>) => Promise<void>;
  onLoadFocusStats: (period: 'today' | 'week' | 'month') => Promise<{
    total_sessions: number;
    total_duration: number;
    completed_sessions: number;
  }>;
}

const FOCUS_DURATION = 25 * 60; // 25 分钟
const SHORT_BREAK_DURATION = 5 * 60; // 5 分钟
const LONG_BREAK_DURATION = 15 * 60; // 15 分钟

export const FocusView: React.FC<FocusViewProps> = ({
  todos,
  onStartFocus,
  onEndFocus,
  onLoadFocusStats,
}) => {
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string>('');
  const [stats, setStats] = useState({
    today: { total_sessions: 0, total_duration: 0, completed_sessions: 0 },
    week: { total_sessions: 0, total_duration: 0, completed_sessions: 0 },
  });

  // 加载统计数据
  useEffect(() => {
    const loadStats = async () => {
      const [today, week] = await Promise.all([
        onLoadFocusStats('today'),
        onLoadFocusStats('week'),
      ]);
      setStats({ today, week });
    };
    loadStats();
  }, [onLoadFocusStats]);

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const getDuration = () => {
    switch (mode) {
      case 'focus':
        return FOCUS_DURATION;
      case 'short_break':
        return SHORT_BREAK_DURATION;
      case 'long_break':
        return LONG_BREAK_DURATION;
    }
  };

  const handleStart = async () => {
    const duration = getDuration();
    setTimeLeft(duration);
    setIsRunning(true);

    const session = await onStartFocus({
      todo_id: selectedTodoId || undefined,
      started_at: new Date().toISOString(),
      duration,
      actual_duration: 0,
      is_completed: false,
      type: mode,
    });

    setSessionId(session.id);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleStop = async () => {
    if (sessionId) {
      const actualDuration = getDuration() - timeLeft;
      await onEndFocus(sessionId, {
        ended_at: new Date().toISOString(),
        actual_duration: actualDuration,
        is_completed: false,
      });
    }
    resetTimer();
  };

  const handleComplete = async () => {
    if (sessionId) {
      await onEndFocus(sessionId, {
        ended_at: new Date().toISOString(),
        actual_duration: getDuration(),
        is_completed: true,
      });
    }
    resetTimer();
    // 刷新统计
    const [today, week] = await Promise.all([
      onLoadFocusStats('today'),
      onLoadFocusStats('week'),
    ]);
    setStats({ today, week });
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration());
    setSessionId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'focus':
        return '专注时间';
      case 'short_break':
        return '短休息';
      case 'long_break':
        return '长休息';
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'focus':
        return 'text-indigo-600';
      case 'short_break':
        return 'text-emerald-600';
      case 'long_break':
        return 'text-blue-600';
    }
  };

  const getModeBg = () => {
    switch (mode) {
      case 'focus':
        return 'bg-indigo-50';
      case 'short_break':
        return 'bg-emerald-50';
      case 'long_break':
        return 'bg-blue-50';
    }
  };

  const activeTodos = todos.filter((t) => !t.completed);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">番茄专注</h2>
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-700 p-1 rounded-lg">
            {(['focus', 'short_break', 'long_break'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  if (!isRunning) {
                    setTimeLeft(
                      m === 'focus'
                        ? FOCUS_DURATION
                        : m === 'short_break'
                        ? SHORT_BREAK_DURATION
                        : LONG_BREAK_DURATION
                    );
                  }
                }}
                disabled={isRunning}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                } ${isRunning ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {m === 'focus' ? '专注' : m === 'short_break' ? '短休息' : '长休息'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 计时器 */}
          <div className={`${getModeBg()} dark:bg-zinc-800 rounded-3xl p-8 md:p-12 text-center`}>
            <p className={`text-lg font-medium ${getModeColor()} mb-4`}>{getModeLabel()}</p>
            <div className={`text-6xl md:text-8xl font-bold ${getModeColor()} mb-8 font-mono`}>
              {formatTime(timeLeft)}
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {!isRunning && !sessionId ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
                >
                  <Play className="w-5 md:w-6 h-5 md:h-6" />
                  开始
                </button>
              ) : isRunning ? (
                <>
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-amber-500 text-white rounded-2xl font-semibold hover:bg-amber-600 transition-colors shadow-lg"
                  >
                    <Pause className="w-5 md:w-6 h-5 md:h-6" />
                    暂停
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                  >
                    <Square className="w-4 md:w-5 h-4 md:h-5" />
                    停止
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleResume}
                    className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    <Play className="w-5 md:w-6 h-5 md:h-6" />
                    继续
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                  >
                    <Square className="w-4 md:w-5 h-4 md:h-5" />
                    停止
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 关联任务选择 */}
          {mode === 'focus' && !isRunning && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                关联任务（可选）
              </label>
              <select
                value={selectedTodoId}
                onChange={(e) => setSelectedTodoId(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">不关联任务</option>
                {activeTodos.map((todo) => (
                  <option key={todo.id} value={todo.id}>
                    {todo.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 统计数据 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 今日统计 */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">今日专注</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.today.total_sessions}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">专注次数</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {Math.floor(stats.today.total_duration)}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">专注分钟</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.today.completed_sessions}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">完成次数</p>
                </div>
              </div>
            </div>

            {/* 本周统计 */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">本周专注</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.week.total_sessions}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">专注次数</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.floor(stats.week.total_duration)}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">专注分钟</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.week.total_sessions > 0
                      ? Math.round((stats.week.completed_sessions / stats.week.total_sessions) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">完成率</p>
                </div>
              </div>
            </div>
          </div>

          {/* 提示 */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <Target className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-400">番茄工作法提示</p>
              <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                专注 25 分钟，休息 5 分钟。每 4 个番茄钟后，进行 15 分钟的长休息。
                保持专注，提高效率！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
