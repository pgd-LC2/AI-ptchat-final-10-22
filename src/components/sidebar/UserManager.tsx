import React, { useState } from 'react';
import { User, Settings, LogOut, ChevronUp, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/lib/auth-store';
import { cn } from '@/lib/utils';

const UserManager: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
      setIsMenuOpen(false);
    }
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

  return (
    <div className="relative">
      {/* 用户信息按钮 */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-neon-purple" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="font-medium text-white truncate text-sm">
                {userName}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {userEmail}
              </div>
            </div>
          </div>
          <ChevronUp 
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200",
              isMenuOpen ? "rotate-180" : ""
            )}
          />
        </div>
      </button>

      {/* 用户菜单 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-black/80 backdrop-blur-lg rounded-lg border border-white/20 shadow-lg overflow-hidden"
          >
            {/* 用户详细信息 */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neon-purple/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-neon-purple" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white truncate">
                    {userName}
                  </div>
                  <div className="text-sm text-gray-400 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {userEmail}
                  </div>
                </div>
              </div>
            </div>

            {/* 菜单项 */}
            <div className="py-2">
              <button
                onClick={() => {
                  // 这里可以添加设置页面的逻辑
                  console.log('打开设置');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                账户设置
              </button>
              
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                {isSigningOut ? '退出中...' : '退出登录'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 点击空白区域关闭菜单 */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => setIsMenuOpen(false)} 
        />
      )}
    </div>
  );
};

export default UserManager;