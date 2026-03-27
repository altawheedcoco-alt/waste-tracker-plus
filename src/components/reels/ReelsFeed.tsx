import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowRight, Flame, Clock, Bookmark } from 'lucide-react';
import { useReelsFeed, useReelActions } from '@/hooks/useReels';
import ReelItem from './ReelItem';
import ReelComments from './ReelComments';
import ReelUploadDialog from './ReelUploadDialog';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type FeedTab = 'trending' | 'latest' | 'saved';

const ReelsFeed = memo(() => {
  const { data: reels = [], isLoading } = useReelsFeed();
  const { toggleLike, toggleBookmark, deleteReel, incrementView } = useReelActions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentReelId, setCommentReelId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('latest');
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const viewedReels = useRef(new Set<string>());

  // Filter reels based on tab
  const filteredReels = (() => {
    switch (activeTab) {
      case 'trending':
        return [...reels].sort((a, b) => b.like_count - a.like_count);
      case 'saved':
        return reels.filter(r => r.is_bookmarked);
      default:
        return reels;
    }
  })();

  // Intersection observer
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
              const reelId = filteredReels[idx]?.id;
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
  }, [filteredReels, incrementView]);

  const handleShare = useCallback((reel: typeof reels[0]) => {
    // Share is now handled inside ReelItem via ReelShareSheet
  }, []);

  const handleDuet = useCallback((reel: typeof reels[0]) => {
    // Open upload dialog with duet reference
    setShowUpload(true);
  }, []);

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const tabs: { id: FeedTab; icon: typeof Flame; label: string }[] = [
    { id: 'trending', icon: Flame, label: 'رائج' },
    { id: 'latest', icon: Clock, label: 'الأحدث' },
    { id: 'saved', icon: Bookmark, label: 'المحفوظ' },
  ];

  return (
    <div className="h-[100dvh] bg-black relative">
      {/* Header with glassmorphism */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/60 to-transparent pb-6">
        <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)]">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
            <ArrowRight className="w-5 h-5 text-white" />
          </button>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/10">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setActiveIndex(0); }}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    isActive ? 'bg-white/20 text-white' : 'text-white/50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowUpload(true)}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Feed */}
      {filteredReels.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-5 px-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl"
          >
            {activeTab === 'saved' ? '🔖' : '🎬'}
          </motion.div>
          <h2 className="text-white text-xl font-bold text-center">
            {activeTab === 'saved' ? 'لا توجد ريلز محفوظة' : 'لا توجد ريلز بعد'}
          </h2>
          <p className="text-white/50 text-center text-sm">
            {activeTab === 'saved' ? 'احفظ الريلز المفضلة لديك لمشاهدتها لاحقاً' : 'كن أول من ينشر ريل على المنصة!'}
          </p>
          {activeTab !== 'saved' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUpload(true)}
              className="px-8 py-3.5 bg-gradient-to-r from-primary to-primary/80 rounded-full text-primary-foreground font-bold shadow-lg shadow-primary/30"
            >
              نشر ريل جديد 🎬
            </motion.button>
          )}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {filteredReels.map((reel, i) => (
            <div key={reel.id} data-index={i} className="h-full snap-start snap-always">
              <ReelItem
                reel={reel}
                isActive={activeIndex === i}
                onLike={() => toggleLike.mutate({ reelId: reel.id, isLiked: !!reel.is_liked })}
                onComment={() => setCommentReelId(reel.id)}
                onBookmark={() => toggleBookmark.mutate({ reelId: reel.id, isBookmarked: !!reel.is_bookmarked })}
                onShare={() => handleShare(reel)}
                onDelete={() => deleteReel.mutate(reel.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Reel counter */}
      {filteredReels.length > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
          <span className="text-white/30 text-[10px] font-medium bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
            {activeIndex + 1} / {filteredReels.length}
          </span>
        </div>
      )}

      {/* Comments */}
      <AnimatePresence>
        {commentReelId && (
          <ReelComments reelId={commentReelId} onClose={() => setCommentReelId(null)} />
        )}
      </AnimatePresence>

      {/* Upload */}
      <ReelUploadDialog open={showUpload} onOpenChange={setShowUpload} />
    </div>
  );
});

ReelsFeed.displayName = 'ReelsFeed';
export default ReelsFeed;
