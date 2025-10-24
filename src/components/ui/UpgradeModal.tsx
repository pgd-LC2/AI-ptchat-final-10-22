import React from 'react';
import { X, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'model_locked' | 'feature_locked';
  remaining?: number;
  limit?: number;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  reason = 'limit_reached',
  limit = 20,
}) => {
  const navigate = useNavigate();
  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]';

  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  const getContent = () => {
    switch (reason) {
      case 'limit_reached':
        return {
          icon: <Crown className="w-12 h-12 text-neon-purple" />,
          title: '今日对话次数已达上限',
          description: `您今天已使用 ${limit} 次对话。升级到专业版或旗舰版，享受更多对话次数和高级功能。`,
          benefits: [
            '专业版：每日 500 次对话',
            '旗舰版：无限次对话',
            'Auto 智能路由',
            '访问高级 AI 模型',
          ],
        };
      case 'model_locked':
        return {
          icon: <Sparkles className="w-12 h-12 text-neon-cyan" />,
          title: '该模型需要升级订阅',
          description: '您选择的模型属于高级功能，需要升级到专业版或旗舰版才能使用。',
          benefits: [
            '访问 GPT-5、Claude 3.5 等顶级模型',
            '体验最新 AI 技术',
            '更快的响应速度',
            '更高的输出质量',
          ],
        };
      case 'feature_locked':
        return {
          icon: <Crown className="w-12 h-12 text-neon-pink" />,
          title: '该功能需要升级订阅',
          description: '您尝试使用的功能属于付费功能，升级订阅后即可解锁。',
          benefits: [
            'API 访问权限',
            '团队协作功能',
            '永久历史记录',
            '优先技术支持',
          ],
        };
    }
  };

  const content = getContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card rounded-2xl border border-white/20 p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={onClose}
                className={cn(
                  'absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors',
                  focusRing
                )}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="mb-4">{content.icon}</div>
                <h2 className="text-2xl font-bold text-gray-100 mb-3">
                  {content.title}
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  {content.description}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {content.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="flex items-center gap-3 text-gray-300"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
                    <span className="text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleUpgrade}
                  className={cn(
                    'w-full py-4 rounded-full font-medium text-white bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-neon-purple/25 flex items-center justify-center gap-2',
                    focusRing
                  )}
                >
                  <span>立即升级</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className={cn(
                    'w-full py-3 rounded-full font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all duration-300',
                    focusRing
                  )}
                >
                  稍后再说
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
