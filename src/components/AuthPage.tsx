import React, { useState } from 'react';
import { CheckSquare, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

export const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === 'register') {
      const err = await signUp(email, password);
      if (err) {
        setError(err);
      } else {
        setSuccessMsg('注册成功！请检查邮箱确认链接，或直接登录。');
        setMode('login');
      }
    } else {
      const err = await signIn(email, password);
      if (err) {
        setError(err);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <CheckSquare className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">ChronoTask</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {mode === 'login' ? '登录以同步你的任务' : '创建账号开始使用'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? '至少 6 位' : '输入密码'}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
            )}
            {successMsg && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">{successMsg}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {mode === 'login' ? (
              <>
                还没有账号？{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  注册
                </button>
              </>
            ) : (
              <>
                已有账号？{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  登录
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
