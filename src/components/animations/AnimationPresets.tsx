import { Variants, Transition } from 'framer-motion';

// ==================== TRANSITION PRESETS ====================
export const transitions = {
  // Spring animations - natural feel
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  } as Transition,
  
  springBouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  } as Transition,
  
  springGentle: {
    type: 'spring',
    stiffness: 200,
    damping: 35,
  } as Transition,

  // Tween animations - controlled timing
  smooth: {
    type: 'tween',
    duration: 0.3,
    ease: 'easeOut',
  } as Transition,
  
  smoothSlow: {
    type: 'tween',
    duration: 0.5,
    ease: 'easeInOut',
  } as Transition,

  // Quick micro-interactions
  quick: {
    type: 'tween',
    duration: 0.15,
    ease: 'easeOut',
  } as Transition,
};

// ==================== FADE VARIANTS ====================
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: { 
    opacity: 0,
    transition: transitions.quick,
  },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: transitions.quick,
  },
};

export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: transitions.quick,
  },
};

export const fadeScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: transitions.springBouncy,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: transitions.quick,
  },
};

// ==================== SLIDE VARIANTS ====================
export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    x: 30,
    transition: transitions.smooth,
  },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    x: -30,
    transition: transitions.smooth,
  },
};

// ==================== STAGGER VARIANTS ====================
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: transitions.quick,
  },
};

// ==================== CARD VARIANTS ====================
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: transitions.springGentle,
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: transitions.spring,
  },
  tap: {
    scale: 0.98,
    transition: transitions.quick,
  },
};

// ==================== MODAL/DIALOG VARIANTS ====================
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15, delay: 0.1 },
  },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: transitions.springBouncy,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: transitions.quick,
  },
};

// ==================== DRAWER VARIANTS ====================
export const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: { 
    x: 0,
    transition: transitions.spring,
  },
  exit: { 
    x: '100%',
    transition: transitions.smooth,
  },
};

export const drawerRTLVariants: Variants = {
  hidden: { x: '-100%' },
  visible: { 
    x: 0,
    transition: transitions.spring,
  },
  exit: { 
    x: '-100%',
    transition: transitions.smooth,
  },
};

// ==================== BUTTON/ICON VARIANTS ====================
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.03,
    transition: transitions.quick,
  },
  tap: { 
    scale: 0.97,
    transition: transitions.quick,
  },
};

export const iconSpinVariants: Variants = {
  initial: { rotate: 0 },
  animate: { 
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==================== LIST VARIANTS ====================
export const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.spring,
  },
};

// ==================== NOTIFICATION VARIANTS ====================
export const notificationVariants: Variants = {
  hidden: { opacity: 0, y: -50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: transitions.springBouncy,
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.9,
    transition: transitions.smooth,
  },
};

// ==================== PROGRESS VARIANTS ====================
export const progressVariants: Variants = {
  hidden: { width: 0 },
  visible: (value: number) => ({
    width: `${value}%`,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  }),
};

// ==================== SKELETON VARIANTS ====================
export const skeletonVariants: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==================== PAGE TRANSITION VARIANTS ====================
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  enter: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};
