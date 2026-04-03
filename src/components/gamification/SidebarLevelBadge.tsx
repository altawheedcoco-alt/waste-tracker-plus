import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

const SidebarLevelBadge = memo(() => {
  const navigate = useNavigate();
  const { gamification, levelInfo, isLoading } = useGamification();

  if (isLoading || !gamification) return null;

  return (
    <button
      onClick={() => navigate('/dashboard/gamification')}
      className="w-full p-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-right space-y-1.5 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">{levelInfo.current.name}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Lv.{levelInfo.current.level}</span>
      </div>
      <Progress value={levelInfo.progress} className="h-1.5" />
      <p className="text-[10px] text-muted-foreground">{gamification.total_points} نقطة</p>
    </button>
  );
});

SidebarLevelBadge.displayName = 'SidebarLevelBadge';
export default SidebarLevelBadge;
