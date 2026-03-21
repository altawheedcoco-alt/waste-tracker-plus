import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const BetaBanner = () => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="fixed left-5 top-1/2 -translate-y-1/2 z-[100] pointer-events-none hidden lg:block"
    >
      <div 
        className="bg-gradient-to-b from-primary/20 to-primary/10 text-primary font-bold py-3 px-8 shadow-sm origin-center -rotate-90 translate-x-[-50%] backdrop-blur-[2px]"
        style={{
          borderRadius: '0 0 8px 8px',
        }}
      >
        <span className="text-sm tracking-widest whitespace-nowrap">{t('betaBanner.label')}</span>
      </div>
    </motion.div>
  );
};

export default BetaBanner;