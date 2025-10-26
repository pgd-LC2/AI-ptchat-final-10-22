import React from 'react';
import { motion } from 'framer-motion';
import { flyInTop } from './motion-presets';
import { cn } from '@/lib/utils';

interface RouteTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const RouteTransition: React.FC<RouteTransitionProps> = ({ children, className }) => {
  return (
    <motion.div
      variants={flyInTop}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn('w-full h-full', className)}
    >
      {children}
    </motion.div>
  );
};

export default RouteTransition;
