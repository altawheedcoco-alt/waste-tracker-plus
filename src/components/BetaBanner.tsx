import { motion } from 'framer-motion';

const BetaBanner = () => {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="fixed left-5 top-1/2 -translate-y-1/2 z-[100] pointer-events-none hidden lg:block"
    >
      <div 
        className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground font-bold py-3 px-8 shadow-lg origin-center -rotate-90 translate-x-[-50%]"
        style={{
          borderRadius: '0 0 8px 8px',
        }}
      >
        <span className="text-sm tracking-widest whitespace-nowrap">بث تجريبي</span>
      </div>
    </motion.div>
  );
};

export default BetaBanner;
