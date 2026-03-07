import { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * Animated gradient mesh background — creates a dynamic, flowing color effect.
 */
const GradientMesh = memo(({ className = '' }: { className?: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]"
        style={{ background: 'radial-gradient(circle, hsl(162, 72%, 42%), transparent 70%)' }}
        animate={{
          x: ['-10%', '15%', '-5%'],
          y: ['-10%', '10%', '-15%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
        style={{ background: 'radial-gradient(circle, hsl(200, 75%, 45%), transparent 70%)' }}
        animate={{
          x: ['10%', '-15%', '5%'],
          y: ['10%', '-5%', '15%'],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
        style={{ background: 'radial-gradient(circle, hsl(42, 92%, 55%), transparent 70%)' }}
        animate={{
          x: ['-50%', '-40%', '-60%', '-50%'],
          y: ['-50%', '-40%', '-55%', '-50%'],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
});

GradientMesh.displayName = 'GradientMesh';
export default GradientMesh;
