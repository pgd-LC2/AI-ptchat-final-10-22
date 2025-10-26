import { Variants, Easing } from 'framer-motion';

const easeOutSoft: Easing = [0.16, 1, 0.3, 1];
const easeInSoft: Easing = [0.4, 0, 0.2, 1];

export const flyInTop: Variants = {
  hidden: {
    opacity: 0,
    y: -56,
    scale: 0.98,
    filter: 'blur(8px)',
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: easeOutSoft,
    },
  },
  exit: {
    opacity: 0,
    y: 36,
    scale: 0.98,
    filter: 'blur(6px)',
    transition: {
      duration: 0.45,
      ease: easeInSoft,
    },
  },
};

export const subtleFade: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: easeOutSoft,
    },
  },
};

export const staggeredContainer = (stagger = 0.08, delay = 0.12): Variants => ({
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      delayChildren: delay,
      staggerChildren: stagger,
      when: 'beforeChildren',
    },
  },
});

export const floatUpItem: Variants = {
  hidden: {
    opacity: 0,
    y: -32,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutSoft,
    },
  },
};

export const gentleHover = {
  whileHover: {
    y: -2,
    scale: 1.02,
  },
  whileTap: {
    scale: 0.98,
  },
};
