/**
 * معاينة مصغرة للريلز داخل مركز المنشورات
 */
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReelsFeed } from '@/hooks/useReels';
import { Play, Eye, Heart, Film } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PostsHubReels = memo(() => {
  const { data: reels = [], isLoading } = useReelsFeed();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-[9/16] rounded-xl" />)}
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Film className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">لا توجد ريلز حالياً</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 text-xs"
          onClick={() => navigate('/dashboard/reels')}
        >
          إنشاء أول ريل
        </Button>
      </div>
    );
  }

  const displayReels = reels.slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {displayReels.map((reel) => (
          <button
            key={reel.id}
            onClick={() => navigate('/dashboard/reels')}
            className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted border border-border/30 hover:border-primary/40 transition-all"
          >
            {/* Thumbnail / Video preview */}
            {reel.thumbnail_url ? (
              <img
                src={reel.thumbnail_url}
                alt={reel.caption || 'ريل'}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <video
                src={reel.video_url}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                preload="metadata"
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Play icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            </div>

            {/* Stats */}
            <div className="absolute bottom-1.5 right-1.5 left-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-white/90">
                <span className="flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  {reel.view_count || 0}
                </span>
                <span className="flex items-center gap-0.5">
                  <Heart className="w-3 h-3" />
                  {reel.like_count || 0}
                </span>
              </div>
            </div>

            {/* Caption */}
            {reel.caption && (
              <div className="absolute bottom-6 right-1.5 left-1.5">
                <p className="text-[10px] text-white/80 leading-tight truncate">
                  {reel.caption}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {reels.length > 6 && (
        <p className="text-center text-[11px] text-muted-foreground">
          +{reels.length - 6} ريل آخر
        </p>
      )}
    </div>
  );
});

PostsHubReels.displayName = 'PostsHubReels';
export default PostsHubReels;
