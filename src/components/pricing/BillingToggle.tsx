import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BillingToggleProps {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
}

const BillingToggle: React.FC<BillingToggleProps> = ({ isAnnual, onToggle }) => {
  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]';

  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <button
        onClick={() => onToggle(false)}
        className={cn(
          'px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
          focusRing,
          !isAnnual
            ? 'bg-white/10 text-white border border-white/20'
            : 'text-gray-400 hover:text-gray-300'
        )}
      >
        月付
      </button>

      <div className="relative w-14 h-7 bg-white/10 rounded-full cursor-pointer border border-white/20" onClick={() => onToggle(!isAnnual)}>
        <motion.div
          className="absolute top-0.5 left-0.5 w-6 h-6 bg-neon-purple rounded-full shadow-lg"
          animate={{
            x: isAnnual ? 28 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      </div>

      <button
        onClick={() => onToggle(true)}
        className={cn(
          'px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 relative',
          focusRing,
          isAnnual
            ? 'bg-white/10 text-white border border-white/20'
            : 'text-gray-400 hover:text-gray-300'
        )}
      >
        年付
        <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
          省更多
        </span>
      </button>
    </div>
  );
};

export default BillingToggle;
