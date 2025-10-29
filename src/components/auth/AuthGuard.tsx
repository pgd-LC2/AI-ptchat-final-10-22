import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '@/lib/auth-store';
import { Loader } from 'lucide-react';
import NeonCore from '../ui/NeonCore';
import Particles from '../ui/Particles';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen w-screen bg-dark-bg-end flex items-center justify-center relative overflow-hidden">
        <Particles />
        <div className="relative z-10 flex flex-col items-center">
          <NeonCore providerColor="#7C3AED" className="w-16 h-16 mb-6" />
          <div className="flex items-center gap-3">
            <Loader className="w-5 h-5 animate-spin text-neon-purple" />
            <span className="text-gray-300">正在验证身份...</span>
          </div>
        </div>
      </div>
    );
  }

  // 如果未登录，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果已登录，渲染子组件
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default AuthGuard;