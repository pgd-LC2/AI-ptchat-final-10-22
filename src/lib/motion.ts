import { Variants, Easing } from 'framer-motion';

const easeOutSoft: Easing = [0.16, 1, 0.3, 1];
const easeInSoft: Easing = [0.4, 0, 0.2, 1];

export const staggerContainer = (
  stagger = 0.12,
  delay = 0.2,
  exitDuration = 0.35
): Variants => ({
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: delay,
      staggerChildren: stagger,
      staggerDirection: 1,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: exitDuration,
      ease: easeInSoft,
      staggerChildren: stagger,
      staggerDirection: -1,
      when: 'afterChildren',
    },
  },
});

export const slideInFromLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -64,
    filter: 'blur(12px)',
  },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: easeOutSoft,
    },
  },
  exit: {
    opacity: 0,
    x: -56,
    filter: 'blur(8px)',
    transition: {
      duration: 0.45,
      ease: easeInSoft,
    },
  },
};

export const slideInFromRight: Variants = {
  hidden: {
    opacity: 0,
    x: 64,
    filter: 'blur(12px)',
  },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: easeOutSoft,
    },
  },
  exit: {
    opacity: 0,
    x: 56,
    filter: 'blur(8px)',
    transition: {
      duration: 0.45,
      ease: easeInSoft,
    },
  },
};
