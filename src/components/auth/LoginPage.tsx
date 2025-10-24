import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader, CircleAlert as AlertCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';
import useAuthStore from '@/lib/auth-store';
import { cn } from '@/lib/utils';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn(formData.email, formData.password);

      if (result.error) {
        setError(result.error);
      } else {
        setIsSuccess(true);
        // 延迟导航，让用户看到成功状态
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]';

  return (
    <AuthLayout
      title="欢迎回来"
      subtitle="登录您的账户，继续与世界顶尖AI对话"
    >
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            aria-live="polite"
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* 邮箱输入 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-200 tracking-wide">
            邮箱地址
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              inputMode="email"
              className={cn(
                'w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-full text-white placeholder-gray-500 transition-all duration-300',
                'focus:outline-none focus:border-neon-purple/50 focus:bg-black/30 focus:ring-2 focus:ring-neon-purple/30',
                focusRing,
                isLoading && 'cursor-not-allowed opacity-80'
              )}
              placeholder="请输入您的邮箱"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 密码输入 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-200 tracking-wide">
            密码
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className={cn(
                'w-full pl-12 pr-14 py-4 bg-black/20 border border-white/10 rounded-full text-white placeholder-gray-500 transition-all duration-300',
                'focus:outline-none focus:border-neon-purple/50 focus:bg-black/30 focus:ring-2 focus:ring-neon-purple/30',
                focusRing,
                isLoading && 'cursor-not-allowed opacity-80'
              )}
              placeholder="请输入您的密码"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              aria-pressed={showPassword}
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-full',
                focusRing
              )}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 登录按钮 */}
        <button
          type="submit"
          disabled={isLoading || isSuccess || !formData.email || !formData.password}
          className={cn(
            'w-full py-4 rounded-full font-medium transition-all duration-300 shadow-lg',
            isLoading || isSuccess || !formData.email || !formData.password
              ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-neon-purple hover:bg-neon-purple/90 text-white shadow-lg hover:shadow-neon-purple/25',
            focusRing,
            isSuccess && '!bg-green-500 !text-white'
          )}
          aria-live="polite"
          aria-busy={isLoading}
        >
          {isSuccess ? (
            <div className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              登录成功
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 animate-spin" />
              登录中...
            </div>
          ) : (
            '登录'
          )}
        </button>

        {/* 注册链接 */}
        <div className="text-center text-sm text-gray-400 pt-4">
          还没有账户？{' '}
          <Link
            to="/register"
            className={cn(
              'text-neon-purple hover:text-neon-purple/80 font-medium transition-colors hover:underline rounded-full px-2 py-1',
              focusRing
            )}
          >
            立即注册
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
