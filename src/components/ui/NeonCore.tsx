
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NeonCoreProps {
  providerColor: string;
  className?: string;
}

const NeonCore: React.FC<NeonCoreProps> = ({ providerColor, className }) => {
  return (
    <motion.div
      className={cn("relative w-16 h-16", className)}
      animate={{ '--neon-color': providerColor } as any}
      transition={{ duration: 0.4 }}
    >
      <div
        className="absolute inset-0 rounded-full bg-[var(--neon-color)] opacity-30 blur-3xl"
        style={{ backgroundColor: 'var(--neon-color)' }}
      />
      <div
        className="absolute inset-0 rounded-full bg-[var(--neon-color)] opacity-50 blur-2xl"
        style={{ backgroundColor: 'var(--neon-color)' }}
      />
      <div
        className="absolute inset-2 rounded-full bg-[var(--neon-color)] opacity-70 blur-xl"
        style={{ backgroundColor: 'var(--neon-color)' }}
      />
      <div
        className="absolute inset-4 rounded-full bg-[var(--neon-color)] opacity-90 blur-sm"
        style={{ backgroundColor: 'var(--neon-color)' }}
      />
      <div
        className="absolute inset-6 rounded-full bg-dark-bg-via border-2 border-[var(--neon-color)]"
        style={{ borderColor: 'var(--neon-color)' }}
      />
    </motion.div>
  );
};

export default NeonCore;
  