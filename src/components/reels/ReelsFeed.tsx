import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowRight } from 'lucide-react';
import { useReelsFeed, useReelActions } from '@/hooks/useReels';
import ReelItem from './ReelItem';
import ReelComments from './ReelComments';
import ReelUploadDialog from './ReelUploadDialog';
import { useNavigate } from 'react-router-dom';

const ReelsFeed = memo(() => {
  const { data: reels = [], isLoading } = useReelsFeed();
  const { toggleLike, toggleBookmark, incrementView } = useReelActions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentReelId, setCommentReelId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const viewedReels = useRef(new Set<string>());

  // Intersection observer for snap scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) {
              setActiveIndex(idx);
              // Track view
              const reelId = reels[idx]?.id;
              if (reelId && !viewedReels.current.has(reelId)) {
                viewedReels.current.add(reelId);
                incrementView.mutate(reelId);
              }
            }
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    container.querySelectorAll('[data-index]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels, incrementView]);

  const handleShare = useCallback((reel: typeof reels[0]) => {
    if (navigator.share) {
      navigator.share({
        title: reel.caption || 'ريل',
        url: window.location.href,
      }).catch(() => {});
    }
  }, []);

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 pt-[env(safe-area-inset-top)]">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-bold text-lg">ريلز</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {/* Feed */}
      {reels.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-4 px-8">
          <div className="text-6xl">🎬</div>
          <h2 className="text-white text-xl font-bold">لا توجد ريلز بعد</h2>
          <p className="text-white/60 text-center">كن أول من ينشر ريل على المنصة!</p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-6 py-3 bg-primary rounded-full text-primary-foreground font-bold"
          >
            نشر ريل جديد
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {reels.map((reel, i) => (
            <div key={reel.id} data-index={i} className="h-full snap-start snap-always">
              <ReelItem
                reel={reel}
                isActive={activeIndex === i}
                onLike={() => toggleLike.mutate({ reelId: reel.id, isLiked: !!reel.is_liked })}
                onComment={() => setCommentReelId(reel.id)}
                onBookmark={() => toggleBookmark.mutate({ reelId: reel.id, isBookmarked: !!reel.is_bookmarked })}
                onShare={() => handleShare(reel)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Comments bottom sheet */}
      <AnimatePresence>
        {commentReelId && (
          <ReelComments
            reelId={commentReelId}
            onClose={() => setCommentReelId(null)}
          />
        )}
      </AnimatePresence>

      {/* Upload dialog */}
      <ReelUploadDialog open={showUpload} onOpenChange={setShowUpload} />
    </div>
  );
});

ReelsFeed.displayName = 'ReelsFeed';
export default ReelsFeed;
