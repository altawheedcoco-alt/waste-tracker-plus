import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const FloatingHealthButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on the health page itself
  if (location.pathname === '/dashboard/health') return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      onClick={() => navigate('/dashboard/health')}
      className={cn(
        'fixed bottom-20 left-4 z-40 w-12 h-12 rounded-full',
        'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
        'shadow-lg shadow-emerald-500/30 flex items-center justify-center',
        'hover:scale-110 active:scale-95 transition-transform',
      )}
      title="iRecycle Health"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <Heart className="w-5 h-5" />
      </motion.div>
    </motion.button>
  );
};

export default FloatingHealthButton;
