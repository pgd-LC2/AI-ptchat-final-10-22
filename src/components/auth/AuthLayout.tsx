import React from 'react';
import { motion } from 'framer-motion';
import NeonCore from '../ui/NeonCore';
import Particles from '../ui/Particles';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-screen bg-dark-bg-end flex items-center justify-center relative overflow-hidden">
      <Particles />
      
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-auto p-6"
      >
        {/* 头部 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <NeonCore providerColor="#7C3AED" className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent tracking-tight">
            {title}
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm mx-auto">
            {subtitle}
          </p>
        </div>

        {/* 表单容器 */}
        <div className="glass-card rounded-3xl p-8 border border-white/12 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
        
        {/* 底部 */}
        <div className="text-center mt-8 text-xs text-gray-500 tracking-wide">
          Orbital Chat - 连接世界顶尖AI大模型
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;