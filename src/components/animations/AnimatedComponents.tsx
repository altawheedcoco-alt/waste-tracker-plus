import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import {
  fadeUpVariants,
  fadeScaleVariants,
  staggerContainerVariants,
  staggerItemVariants,
  cardVariants,
  buttonVariants,
  slideRightVariants,
  slideLeftVariants,
  notificationVariants,
  pageVariants,
} from './AnimationPresets';
import { cn } from '@/lib/utils';

// ==================== ANIMATED CONTAINER ====================
interface AnimatedContainerProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedContainer = forwardRef<HTMLDivElement, AnimatedContainerProps>(
  ({ children, delay = 0, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeUpVariants}
      custom={delay}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedContainer.displayName = 'AnimatedContainer';

// ==================== ANIMATED PAGE ====================
interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedPage = ({ children, className }: AnimatedPageProps) => (
  <motion.div
    initial="initial"
    animate="enter"
    exit="exit"
    variants={pageVariants}
    className={className}
  >
    {children}
  </motion.div>
);

// ==================== STAGGER LIST ====================
interface StaggerListProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'ul' | 'ol';
}

export const StaggerList = ({ children, className, as = 'div' }: StaggerListProps) => {
  const Component = motion[as];
  return (
    <Component
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={staggerContainerVariants}
      className={className}
    >
      {children}
    </Component>
  );
};

// ==================== STAGGER ITEM ====================
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = ({ children, className }: StaggerItemProps) => (
  <motion.div variants={staggerItemVariants} className={className}>
    {children}
  </motion.div>
);

export const StaggerListItem = ({ children, className }: StaggerItemProps) => (
  <motion.li variants={staggerItemVariants} className={className}>
    {children}
  </motion.li>
);

// ==================== ANIMATED CARD ====================
interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  enableHover?: boolean;
  enableTap?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, enableHover = true, enableTap = true, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={enableHover ? 'hover' : undefined}
      whileTap={enableTap ? 'tap' : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedCard.displayName = 'AnimatedCard';

// ==================== ANIMATED BUTTON ====================
interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  className?: string;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, ...props }, ref) => (
    <motion.button
      ref={ref}
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
);
AnimatedButton.displayName = 'AnimatedButton';

// ==================== FADE IN VIEW ====================
interface FadeInViewProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  once?: boolean;
}

export const FadeInView = ({ 
  children, 
  className, 
  delay = 0, 
  direction = 'up',
  once = true 
}: FadeInViewProps) => {
  const getVariants = () => {
    switch (direction) {
      case 'left': return slideRightVariants;
      case 'right': return slideLeftVariants;
      case 'scale': return fadeScaleVariants;
      default: return fadeUpVariants;
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-50px' }}
      variants={getVariants()}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ==================== ANIMATED NUMBER ====================
interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  formatOptions?: Intl.NumberFormatOptions;
}

export const AnimatedNumber = ({ 
  value, 
  className,
  duration = 1,
  formatOptions 
}: AnimatedNumberProps) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {value.toLocaleString('en-US', formatOptions)}
      </motion.span>
    </motion.span>
  );
};

// ==================== ANIMATED PRESENCE WRAPPER ====================
interface AnimatedPresenceWrapperProps {
  children: ReactNode;
  show: boolean;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export const AnimatedPresenceWrapper = ({ 
  children, 
  show, 
  mode = 'wait' 
}: AnimatedPresenceWrapperProps) => (
  <AnimatePresence mode={mode}>
    {show && children}
  </AnimatePresence>
);

// ==================== NOTIFICATION ANIMATION ====================
interface AnimatedNotificationProps {
  children: ReactNode;
  show: boolean;
  className?: string;
}

export const AnimatedNotification = ({ 
  children, 
  show, 
  className 
}: AnimatedNotificationProps) => (
  <AnimatePresence>
    {show && (
      <motion.div
        variants={notificationVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// ==================== LOADING SPINNER ====================
interface AnimatedSpinnerProps {
  size?: number;
  className?: string;
}

export const AnimatedSpinner = ({ size = 24, className }: AnimatedSpinnerProps) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    className={cn('border-2 border-primary border-t-transparent rounded-full', className)}
    style={{ width: size, height: size }}
  />
);

// ==================== PULSE DOT ====================
interface PulseDotProps {
  color?: string;
  size?: number;
}

export const PulseDot = ({ color = 'bg-green-500', size = 8 }: PulseDotProps) => (
  <span className="relative inline-flex">
    <motion.span
      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', color)}
      style={{ width: size, height: size }}
    />
    <span 
      className={cn('relative inline-flex rounded-full', color)}
      style={{ width: size, height: size }}
    />
  </span>
);

// ==================== SKELETON LOADER ====================
interface SkeletonLoaderProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const SkeletonLoader = ({ className, width, height }: SkeletonLoaderProps) => (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className={cn('bg-muted rounded', className)}
    style={{ width, height }}
  />
);

// ==================== ANIMATED PROGRESS BAR ====================
interface AnimatedProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
}

export const AnimatedProgress = ({ value, className, barClassName }: AnimatedProgressProps) => (
  <div className={cn('w-full h-2 bg-muted rounded-full overflow-hidden', className)}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={cn('h-full bg-primary rounded-full', barClassName)}
    />
  </div>
);
