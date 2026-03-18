import { useFollow } from '@/hooks/useFollow';
import { Separator } from '@/components/ui/separator';
import { Users } from 'lucide-react';

interface FollowStatsProps {
  targetProfileId?: string;
  targetOrgId?: string;
}

const FollowStats = ({ targetProfileId, targetOrgId }: FollowStatsProps) => {
  const { followersCount, followingCount } = useFollow(targetProfileId, targetOrgId);

  return (
    <>
      <Separator orientation="vertical" className="h-8" />
      <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
        <p className="text-lg font-bold">{followersCount}</p>
        <p className="text-[10px] text-muted-foreground">متابِع</p>
      </div>
      <Separator orientation="vertical" className="h-8" />
      <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
        <p className="text-lg font-bold">{followingCount}</p>
        <p className="text-[10px] text-muted-foreground">يتابع</p>
      </div>
    </>
  );
};

export default FollowStats;
