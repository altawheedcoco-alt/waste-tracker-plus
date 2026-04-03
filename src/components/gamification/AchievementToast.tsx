import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award } from 'lucide-react';
import { getTierColor } from '@/hooks/useGamification';

interface AchievementToastProps {
  achievement: {
    title_ar: string;
    icon: string;
    tier: string;
    points_reward: number;
    description_ar?: string | null;
  } | null;
  onClose: () => void;
}

const AchievementToast = ({ achievement, onClose }: AchievementToastProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 400);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {visible && achievement && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[340px]"
        >
          <div className="bg-background border-2 border-primary/30 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
            <div className="text-4xl shrink-0">{achievement.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">إنجاز جديد!</span>
              </div>
              <p className="text-sm font-semibold">{achievement.title_ar}</p>
              {achievement.description_ar && (
                <p className="text-xs text-muted-foreground mt-0.5">{achievement.description_ar}</p>
              )}
              <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${getTierColor(achievement.tier)}`}>
                +{achievement.points_reward} نقطة
              </span>
            </div>
            <button onClick={() => { setVisible(false); onClose(); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementToast;
