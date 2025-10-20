import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader, CircleAlert as AlertCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';
import useAuthStore from '@/lib/auth-store';
import { cn } from '@/lib/utils';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少需要6位');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(formData.email, formData.password, {
        name: formData.name,
      });
      
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

  return (
    <AuthLayout
      title="创建账户"
      subtitle="加入Orbital Chat，开启AI对话之旅"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* 用户名输入 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-200 tracking-wide">
            用户名
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/50 focus:bg-black/30 focus:ring-2 focus:ring-neon-purple/30 transition-all duration-300"
              placeholder="请输入您的用户名"
              disabled={isLoading}
            />
          </div>
        </div>

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
              className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/50 focus:bg-black/30 focus:ring-2 focus:ring-neon-purple/30 transition-all duration-300"
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
              className="w-full pl-12 pr-14 py-4 bg-black/20 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/50 focus:bg-black/30 focus:ring-2 focus:ring-neon-purple/30 transition-all duration-300"
              placeholder="请输入密码（至少6位）"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 确认密码输入 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-200 tracking-wide">
            确认密码
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full pl-12 pr-14 py-4 bg-black/20 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/50 focus:bg-black/30 focus:ring-2 focus:ring-neon-purple/30 transition-all duration-300"
              placeholder="请再次输入密码"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 注册按钮 */}
        <button
          type="submit"
          disabled={isLoading || isSuccess || !formData.name || !formData.email || !formData.password || !formData.confirmPassword}
          className={cn(
            "w-full py-4 rounded-full font-medium transition-all duration-300 shadow-lg",
            isLoading || isSuccess || !formData.name || !formData.email || !formData.password || !formData.confirmPassword
              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed shadow-none"
              : "bg-neon-purple hover:bg-neon-purple/90 text-white shadow-lg hover:shadow-neon-purple/25",
            isSuccess && "!bg-green-500 !text-white"
          )}
        >
          {isSuccess ? (
            <div className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              注册成功
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 animate-spin" />
              注册中...
            </div>
          ) : (
            '注册'
          )}
        </button>

        {/* 登录链接 */}
        <div className="text-center text-sm text-gray-400 pt-4">
          已有账户？{' '}
          <Link 
            to="/login" 
            className="text-neon-purple hover:text-neon-purple/80 font-medium transition-colors hover:underline"
          >
            立即登录
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;