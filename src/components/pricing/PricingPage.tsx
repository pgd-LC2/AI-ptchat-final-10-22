import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import PricingCard from './PricingCard';
import BillingToggle from './BillingToggle';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { staggeredContainer, floatUpItem, subtleFade } from '../ui/motion-presets';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_en: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_recommended: boolean;
  sort_order: number;
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setPlans(data || []);
    } catch (error) {
      console.error('Failed to load subscription plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    console.log('Selected plan:', planId);
  };

  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg-start via-dark-bg-via to-dark-bg-end flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg-start via-dark-bg-via to-dark-bg-end py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-purple/5 via-transparent to-transparent" />

      <motion.div
        className="max-w-7xl mx-auto relative z-10"
        variants={staggeredContainer(0.12, 0.18)}
        initial="hidden"
        animate="show"
      >
        <motion.button
          onClick={() => navigate('/')}
          className={cn(
            'flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors mb-8 px-4 py-2 rounded-full hover:bg-white/5',
            focusRing
          )}
          variants={floatUpItem}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回首页</span>
        </motion.button>

        <motion.div variants={floatUpItem} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-neon-purple" />
            <span className="text-sm text-gray-300">选择最适合您的订阅方案</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            灵活的订阅档位
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            无论您是个人用户还是专业团队，我们都为您准备了合适的方案。
            <br />
            立即开始使用 Orbital Chat，连接世界顶尖 AI 模型。
          </p>
        </motion.div>

        <motion.div variants={floatUpItem}>
          <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
        </motion.div>

        <motion.div variants={subtleFade} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6 mb-16">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              planId={plan.id}
              name={plan.name}
              nameEn={plan.name_en}
              description={plan.description}
              priceMonthly={plan.price_monthly}
              priceYearly={plan.price_yearly}
              features={plan.features}
              isRecommended={plan.is_recommended}
              isAnnual={isAnnual}
              onSelect={() => handleSelectPlan(plan.id)}
              delay={index * 0.1}
            />
          ))}
        </motion.div>

        <motion.div variants={staggeredContainer(0.1, 0.18)} initial="hidden" animate="show" className="text-center space-y-6">
          <motion.div variants={floatUpItem} className="glass-card rounded-2xl border border-white/10 p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">企业定制方案</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              如果您的团队规模超过 5 人，或需要更高的使用配额，我们可以为您量身定制专属方案。
            </p>
            <button
              className={cn(
                'px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white rounded-full transition-all duration-300',
                focusRing
              )}
            >
              联系我们
            </button>
          </motion.div>

          <motion.div variants={floatUpItem} className="text-sm text-gray-500 space-y-2">
            <p>所有订阅均支持随时取消，未使用部分按比例退款</p>
            <p>价格不含税，支持微信支付、支付宝、信用卡支付</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PricingPage;
