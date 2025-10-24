import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  planId: string;
  name: string;
  nameEn: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isRecommended: boolean;
  isAnnual: boolean;
  onSelect: () => void;
  delay?: number;
}

const PricingCard: React.FC<PricingCardProps> = ({
  name,
  nameEn,
  description,
  priceMonthly,
  priceYearly,
  features,
  isRecommended,
  isAnnual,
  onSelect,
  delay = 0,
}) => {
  const displayPrice = isAnnual ? priceYearly : priceMonthly;
  const monthlyEquivalent = isAnnual ? Math.floor(priceYearly / 12) : priceMonthly;
  const isFree = displayPrice === 0;
  const savings = isAnnual && !isFree ? (priceMonthly * 12 - priceYearly) : 0;

  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'relative glass-card rounded-2xl border p-8 transition-all duration-300 flex flex-col',
        isRecommended
          ? 'border-neon-purple/50 ring-1 ring-neon-purple/30 shadow-neon-purple scale-105 lg:scale-110'
          : 'border-white/10 hover:border-white/20 hover:-translate-y-1'
      )}
    >
      {isRecommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-neon-purple rounded-full flex items-center gap-1.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="text-sm font-medium text-white">推荐</span>
        </div>
      )}

      <div className="flex-1">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-100 mb-2">{name}</h3>
          <p className="text-sm text-gray-400 uppercase tracking-wide mb-3">{nameEn}</p>
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>

        <div className="mb-8">
          {isFree ? (
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold text-gray-100">免费</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xl text-gray-400">¥</span>
                <motion.span
                  key={displayPrice}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-6xl font-bold text-gray-100"
                >
                  {Math.floor(displayPrice / 100)}
                </motion.span>
                <span className="text-base text-gray-400">
                  /{isAnnual ? '年' : '月'}
                </span>
              </div>
              {isAnnual && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">
                    相当于 ¥{Math.floor(monthlyEquivalent / 100)}/月
                  </p>
                  {savings > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                      <span className="text-sm font-medium text-green-400">
                        节省 ¥{Math.floor(savings / 100)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: delay + 0.1 + index * 0.05 }}
              className="flex items-start gap-3"
            >
              {feature.startsWith('✗') ? (
                <>
                  <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm text-gray-500 leading-relaxed">
                    {feature.replace('✗ ', '')}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm text-gray-300 leading-relaxed">{feature}</span>
                </>
              )}
            </motion.li>
          ))}
        </ul>
      </div>

      <button
        onClick={onSelect}
        className={cn(
          'w-full py-4 rounded-full font-medium transition-all duration-300',
          focusRing,
          isRecommended
            ? 'bg-neon-purple hover:bg-neon-purple/90 text-white shadow-lg hover:shadow-neon-purple/25'
            : isFree
            ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/20'
            : 'bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/30'
        )}
      >
        {isFree ? '开始使用' : '立即订阅'}
      </button>
    </motion.div>
  );
};

export default PricingCard;
