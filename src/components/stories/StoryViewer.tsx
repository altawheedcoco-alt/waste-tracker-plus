import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Clock, Pause, Play, Volume2, VolumeX, Share2, Bookmark, Download } from 'lucide-react';
import { StoryGroup, useStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import StoryViewers from './StoryViewers';
import StoryReactions from './StoryReactions';
import { useResolvedUrl } from '@/hooks/useResolvedUrl';
import { toast } from 'sonner';

interface StoryViewerProps {
  group: StoryGroup;
  onClose: () => void;
  allGroups?: StoryGroup[];
}

const StoryViewer = ({ group: initialGroup, onClose, allGroups }: StoryViewerProps) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(() => {
    if (!allGroups) return 0;
    return allGroups.findIndex(g => g.user_id === initialGroup.user_id) || 0;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { user } = useAuth();
  const { recordView, deleteStory, myStoryViews } = useStories();
  const videoRef = useRef<HTMLVideoElement>(null);

  const group = allGroups ? allGroups[currentGroupIndex] : initialGroup;
  const story = group?.stories[currentIndex];
  const isMyStory = group?.user_id === user?.id;
  const storyDuration = story?.media_type === 'video' ? 15000 : 6000;
  const resolvedMediaUrl = useResolvedUrl(story?.media_url);

  // Record view
  useEffect(() => {
    if (story && !isMyStory) {
      recordView.mutate(story.id);
    }
  }, [story?.id]);

  // Auto-progress
  useEffect(() => {
    if (showViewers || isPaused || showActions) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + (100 / (storyDuration / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, currentGroupIndex, storyDuration, showViewers, isPaused, showActions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.key === 'ArrowLeft' ? goNext() : goPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowUp' && allGroups) {
        goNextGroup();
      } else if (e.key === 'ArrowDown' && allGroups) {
        goPrevGroup();
      } else if (e.key === 'm') {
        setIsMuted(m => !m);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentGroupIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < (group?.stories.length || 1) - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (allGroups && currentGroupIndex < allGroups.length - 1) {
      setCurrentGroupIndex(i => i + 1);
      setCurrentIndex(0);
    } else {
      onClose();
    }
  }, [currentIndex, currentGroupIndex, group?.stories.length, allGroups, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else if (allGroups && currentGroupIndex > 0) {
      setCurrentGroupIndex(i => i - 1);
      setCurrentIndex(0);
    }
  }, [currentIndex, currentGroupIndex, allGroups]);

  const goNextGroup = useCallback(() => {
    if (allGroups && currentGroupIndex < allGroups.length - 1) {
      setCurrentGroupIndex(i => i + 1);
      setCurrentIndex(0);
    }
  }, [currentGroupIndex, allGroups]);

  const goPrevGroup = useCallback(() => {
    if (allGroups && currentGroupIndex > 0) {
      setCurrentGroupIndex(i => i - 1);
      setCurrentIndex(0);
    }
  }, [currentGroupIndex, allGroups]);

  const handleDelete = async () => {
    if (!story) return;
    await deleteStory.mutateAsync(story.id);
    if (group.stories.length <= 1) {
      onClose();
    } else if (currentIndex >= group.stories.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const handleReact = (emoji: string) => {
    toast.success(`${emoji} تم إرسال التفاعل`);
  };

  const handleReply = (text: string) => {
    toast.success('تم إرسال الرد');
  };

  const handleShare = async () => {
    if (!story) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `حالة ${group.org_name || group.user_name}`,
          text: story.caption || story.text_content || 'شاهد هذه الحالة',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('تم نسخ الرابط');
      }
    } catch {
      // user cancelled
    }
  };

  const handleSaveHighlight = () => {
    toast.success('تم حفظ الحالة في المميزات');
  };

  // Touch/swipe support (horizontal + vertical)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diffX = touchStart.x - e.changedTouches[0].clientX;
    const diffY = touchStart.y - e.changedTouches[0].clientY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      diffX > 0 ? goNext() : goPrev();
    } else if (Math.abs(diffY) > 80) {
      if (diffY > 0 && allGroups) {
        goNextGroup();
      } else if (diffY < 0) {
        onClose();
      }
    }
    setTouchStart(null);
  };

  // Long press to pause
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => setIsPaused(true), 200);
  };
  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isPaused) setIsPaused(false);
  };

  if (!story || !group) return null;

  const viewsForStory = myStoryViews.filter((v) => v.story_id === story.id);
  const storyCounter = `${currentIndex + 1}/${group.stories.length}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        onClick={onClose}
      >
        {/* Previous group preview (desktop) */}
        {allGroups && currentGroupIndex > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 0.4, x: 0 }}
            className="hidden md:block absolute left-4 w-20 h-36 rounded-xl bg-muted/20 overflow-hidden cursor-pointer"
            onClick={(e) => { e.stopPropagation(); goPrevGroup(); }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <Avatar className="w-10 h-10">
                <AvatarImage src={allGroups[currentGroupIndex - 1].org_logo || allGroups[currentGroupIndex - 1].avatar_url || ''} />
                <AvatarFallback className="text-xs bg-primary/20">{allGroups[currentGroupIndex - 1].user_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </motion.div>
        )}

        {/* Next group preview (desktop) */}
        {allGroups && currentGroupIndex < allGroups.length - 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 0.4, x: 0 }}
            className="hidden md:block absolute right-4 w-20 h-36 rounded-xl bg-muted/20 overflow-hidden cursor-pointer"
            onClick={(e) => { e.stopPropagation(); goNextGroup(); }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <Avatar className="w-10 h-10">
                <AvatarImage src={allGroups[currentGroupIndex + 1].org_logo || allGroups[currentGroupIndex + 1].avatar_url || ''} />
                <AvatarFallback className="text-xs bg-primary/20">{allGroups[currentGroupIndex + 1].user_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </motion.div>
        )}

        <motion.div
          key={`${group.user_id}-${currentIndex}`}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-sm h-[90vh] max-h-[750px] rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-[3px] px-2 pt-2">
            {group.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={false}
                  animate={{
                    width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                  }}
                  transition={i === currentIndex ? { duration: 0.05 } : { duration: 0.3 }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-3 pt-2" dir="rtl">
            <div className="flex items-center gap-2">
              <Avatar className="w-9 h-9 border-2 border-white/80 shadow-lg">
                <AvatarImage src={group.org_logo || group.avatar_url || ''} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {group.user_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-sm font-semibold leading-tight drop-shadow-md">
                  {group.org_name || group.user_name}
                </p>
                <p className="text-[10px] text-white/80 flex items-center gap-1 drop-shadow-sm">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(story.created_at), { addSuffix: true, locale: ar })}
                  <span className="mx-0.5">•</span>
                  <span className="bg-white/20 rounded-full px-1.5 py-px">{storyCounter}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Pause/Play */}
              <button
                onClick={() => setIsPaused((p) => !p)}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              {/* Mute */}
              {story.media_type === 'video' && (
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
              {/* Actions menu */}
              <button
                onClick={() => setShowActions(a => !a)}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors text-lg leading-none"
              >
                ⋮
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions dropdown */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="absolute top-16 left-3 z-30 bg-black/70 backdrop-blur-lg rounded-xl overflow-hidden min-w-[140px]"
                dir="rtl"
                onClick={() => setShowActions(false)}
              >
                <button onClick={handleShare} className="flex items-center gap-2 w-full px-4 py-2.5 text-white text-sm hover:bg-white/10 transition-colors">
                  <Share2 className="w-4 h-4" /> مشاركة
                </button>
                {isMyStory && (
                  <>
                    <button onClick={handleSaveHighlight} className="flex items-center gap-2 w-full px-4 py-2.5 text-white text-sm hover:bg-white/10 transition-colors">
                      <Bookmark className="w-4 h-4" /> حفظ في المميزات
                    </button>
                    <button onClick={handleDelete} className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 text-sm hover:bg-white/10 transition-colors">
                      <Trash2 className="w-4 h-4" /> حذف الحالة
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Paused indicator */}
          <AnimatePresence>
            {isPaused && !showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
              >
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                  <Pause className="w-8 h-8 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Story Content */}
          <div className="w-full h-full relative">
            {story.media_type === 'text' ? (
              <motion.div
                key={story.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`w-full h-full ${story.background_color || 'bg-gradient-to-br from-primary to-primary/60'} flex items-center justify-center p-8`}
              >
                <motion.p
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring' }}
                  className="text-white text-2xl font-bold text-center leading-relaxed drop-shadow-lg"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                >
                  {story.text_content}
                </motion.p>
              </motion.div>
            ) : story.media_type === 'video' ? (
              <>
                {resolvedMediaUrl ? (
                  <video
                    ref={videoRef}
                    src={resolvedMediaUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted={isMuted}
                    preload="auto"
                    onWaiting={(e) => {
                      const spinner = e.currentTarget.parentElement?.querySelector('.video-spinner') as HTMLElement;
                      if (spinner) spinner.style.display = 'flex';
                    }}
                    onPlaying={(e) => {
                      const spinner = e.currentTarget.parentElement?.querySelector('.video-spinner') as HTMLElement;
                      if (spinner) spinner.style.display = 'none';
                    }}
                    onPause={() => setIsPaused(true)}
                    onPlay={() => setIsPaused(false)}
                  />
                ) : null}
                <div className="video-spinner absolute inset-0 bg-black/50 items-center justify-center z-10 hidden">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              </>
            ) : (
              resolvedMediaUrl ? (
                <motion.img
                  key={story.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  src={resolvedMediaUrl}
                  className="w-full h-full object-cover"
                  alt="story"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )
            )}

            {/* Gradient overlays for readability */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent z-[5] pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent z-[5] pointer-events-none" />
          </div>

          {/* Caption */}
          {story.caption && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-28 left-0 right-0 z-20 px-4"
            >
              <div className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10">
                <p className="text-white text-sm text-center leading-relaxed" dir="rtl">{story.caption}</p>
              </div>
            </motion.div>
          )}

          {/* Navigation Areas (tap zones) */}
          <div className="absolute inset-0 z-10 flex">
            <button
              className="w-1/3 h-full"
              onClick={goPrev}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
            />
            <button
              className="w-1/3 h-full"
              onClick={() => setIsPaused((p) => !p)}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
            />
            <button
              className="w-1/3 h-full"
              onClick={goNext}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
            />
          </div>

          {/* Reactions (for others' stories) */}
          {!isMyStory && (
            <StoryReactions
              storyId={story.id}
              ownerName={group.org_name || group.user_name}
              isMyStory={isMyStory}
              onReact={handleReact}
              onReply={handleReply}
            />
          )}

          {/* View Count (my stories only) */}
          {isMyStory && (
            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={() => setShowViewers(true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-5 py-2.5 text-white hover:bg-black/60 transition-colors border border-white/10"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{story.view_count} مشاهدة</span>
            </motion.button>
          )}

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={goPrev}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
          {currentIndex < group.stories.length - 1 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={goNext}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}
        </motion.div>

        {/* Viewers Panel */}
        {showViewers && isMyStory && (
          <StoryViewers
            views={viewsForStory}
            onClose={() => setShowViewers(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
