/**
 * PageTransition — تأثير انتقالي سلس بين الصفحات
 * يُغلف محتوى الصفحة ويُطبق حركة دخول/خروج أنيقة
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode, memo } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  /** disable animation for performance-sensitive pages */
  disabled?: boolean;
}

const variants = {
  initial: { opacity: 0, y: 12, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.995 },
};

const transition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

const PageTransition = memo(({ children, disabled }: PageTransitionProps) => {
  const location = useLocation();

  if (disabled) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});

PageTransition.displayName = 'PageTransition';
export default PageTransition;
