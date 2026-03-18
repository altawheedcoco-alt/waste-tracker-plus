import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  targetProfileId?: string;
  targetOrgId?: string;
  size?: 'sm' | 'default';
  className?: string;
}

const FollowButton = ({ targetProfileId, targetOrgId, size = 'sm', className }: FollowButtonProps) => {
  const { isFollowing, toggleFollow, isToggling } = useFollow(targetProfileId, targetOrgId);

  return (
    <Button
      size={size}
      variant={isFollowing ? 'secondary' : 'default'}
      onClick={toggleFollow}
      disabled={isToggling}
      className={cn('gap-1.5', className)}
    >
      {isToggling ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {isFollowing ? 'متابَع' : 'متابعة'}
    </Button>
  );
};

export default FollowButton;
