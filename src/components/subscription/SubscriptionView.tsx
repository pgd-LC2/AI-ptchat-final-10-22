import React, { useEffect, useState } from 'react';
import { ChevronLeft, Calendar, CreditCard, Zap, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  getCurrentUserSubscription,
  getSubscriptionPlan,
  getTodayUsageStats,
  type UserSubscription,
  type SubscriptionPlan,
  type UsageStats
} from '@/lib/subscription-utils';

interface SubscriptionViewProps {
  onBack: () => void;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onBack }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const sub = await getCurrentUserSubscription();
      setSubscription(sub);

      if (sub) {
        const planData = await getSubscriptionPlan(sub.plan_id);
        setPlan(planData);
      }

      const usageData = await getTodayUsageStats();
      setUsage(usageData);
    } catch (error) {
      console.error('加载订阅数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '活跃',
      canceled: '已取消',
      expired: '已过期',
      trialing: '试用中'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'text-green-400',
      canceled: 'text-orange-400',
      expired: 'text-red-400',
      trialing: 'text-blue-400'
    };
    return colorMap[status] || 'text-gray-400';
  };

  const messageUsed = usage?.message_count || 0;
  const messageLimit = plan?.daily_message_limit || 0;
  const messagePercentage = messageLimit === -1 ? 0 : (messageUsed / messageLimit) * 100;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full flex items-center justify-center"
      >
        <div className="text-gray-400">加载中...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-medium text-white">我的订阅</div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {plan && (
          <>
            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{plan.description}</p>
                </div>
                {subscription && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 ${getStatusColor(subscription.status)}`}>
                    {getStatusText(subscription.status)}
                  </span>
                )}
              </div>

              {subscription && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>周期开始：{formatDate(subscription.current_period_start)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>周期结束：{formatDate(subscription.current_period_end)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span>计费周期：{subscription.billing_cycle === 'monthly' ? '月付' : '年付'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-medium text-white">今日使用情况</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-400">消息数量</span>
                    <span className="text-white font-medium">
                      {messageLimit === -1 ? `${messageUsed} / 无限制` : `${messageUsed} / ${messageLimit}`}
                    </span>
                  </div>
                  {messageLimit !== -1 && (
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(messagePercentage, 100)}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h4 className="text-sm font-medium text-white">套餐特权</h4>
              </div>

              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}

                {plan.daily_message_limit !== -1 && (
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">每日 {plan.daily_message_limit} 条消息</span>
                  </div>
                )}

                {plan.daily_message_limit === -1 && (
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">无限制消息</span>
                  </div>
                )}

                {plan.has_api_access && (
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">API 访问权限</span>
                  </div>
                )}

                {plan.has_team_collaboration && (
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">团队协作功能（最多 {plan.team_member_limit} 人）</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SubscriptionView;
