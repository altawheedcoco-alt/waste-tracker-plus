import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Eye, Trash2, Clock, Pause, Play, Volume2, VolumeX, Share2, Bookmark, MessageCircle, Heart, ChevronUp } from 'lucide-react';
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
    return Math.max(0, allGroups.findIndex(g => g.user_id === initialGroup.user_id));
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user } = useAuth();
  const { recordView, deleteStory, myStoryViews } = useStories();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef(0);
  const dragY = useMotionValue(0);
  const dragOpacity = useTransform(dragY, [0, 200], [1, 0.3]);
  const dragScale = useTransform(dragY, [0, 200], [1, 0.85]);

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

  // Reset image loaded state
  useEffect(() => {
    setImageLoaded(false);
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
      switch (e.key) {
        case 'ArrowLeft': goNext(); break;
        case 'ArrowRight': goPrev(); break;
        case ' ': e.preventDefault(); setIsPaused(p => !p); break;
        case 'Escape': onClose(); break;
        case 'ArrowUp': if (allGroups) goNextGroup(); break;
        case 'ArrowDown': if (allGroups) goPrevGroup(); break;
        case 'm': setIsMuted(m => !m); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentGroupIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < (group?.stories.length || 1) - 1) {
      setCurrentIndex(i => i + 1);
    } else if (allGroups && currentGroupIndex < allGroups.length - 1) {
      setCurrentGroupIndex(i => i + 1);
      setCurrentIndex(0);
    } else {
      onClose();
    }
  }, [currentIndex, currentGroupIndex, group?.stories.length, allGroups, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
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
    if (group.stories.length <= 1) onClose();
    else if (currentIndex >= group.stories.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1));
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
    } catch {}
  };

  // Double tap to like
  const handleContentTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      setLiked(true);
      setShowDoubleTapHeart(true);
      handleReact('❤️');
      setTimeout(() => setShowDoubleTapHeart(false), 1200);
    }
    lastTapRef.current = now;
  };

  // Touch/swipe
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const diffX = touchStart.x - e.changedTouches[0].clientX;
    const diffY = touchStart.y - e.changedTouches[0].clientY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      diffX > 0 ? goNext() : goPrev();
    } else if (diffY < -80) {
      onClose();
    } else if (diffY > 80 && isMyStory) {
      setShowViewers(true);
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
  };

  if (!story || !group) return null;

  const viewsForStory = myStoryViews.filter(v => v.story_id === story.id);
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
        <motion.div
          key={`${group.user_id}`}
          style={{ opacity: dragOpacity, scale: dragScale }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.4}
          onDragEnd={(_, info: PanInfo) => {
            if (info.offset.y > 120) onClose();
          }}
          initial={{ scale: 0.88, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="relative w-full max-w-[380px] h-[92vh] max-h-[780px] rounded-[20px] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-30 flex gap-[3px] px-3 pt-2.5">
            {group.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[2.5px] bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={false}
                  animate={{
                    width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                  }}
                  transition={i === currentIndex ? { duration: 0.05, ease: 'linear' } : { duration: 0.3 }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-3 left-0 right-0 z-30 flex items-center justify-between px-3 pt-3" dir="rtl">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Avatar className="w-10 h-10 border-2 border-white/60 shadow-lg">
                  <AvatarImage src={group.org_logo || group.avatar_url || ''} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                    {group.user_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
              </div>
              <div className="text-white">
                <p className="text-[13px] font-semibold leading-tight drop-shadow-md">
                  {isMyStory ? 'حالتي' : (group.org_name || group.user_name)}
                </p>
                <p className="text-[10px] text-white/70 flex items-center gap-1 drop-shadow-sm">
                  {formatDistanceToNow(new Date(story.created_at), { addSuffix: true, locale: ar })}
                  {group.stories.length > 1 && (
                    <>
                      <span className="mx-0.5 text-white/40">•</span>
                      <span className="bg-white/15 rounded-full px-1.5 py-px text-[9px]">{storyCounter}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPaused(p => !p)}
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/90 active:scale-90 transition-transform"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              {story.media_type === 'video' && (
                <button
                  onClick={() => setIsMuted(m => !m)}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/90 active:scale-90 transition-transform"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/90 active:scale-90 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Paused overlay */}
          <AnimatePresence>
            {isPaused && !showActions && !showViewers && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-lg flex items-center justify-center"
                >
                  <Pause className="w-7 h-7 text-white" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Double-tap heart animation */}
          <AnimatePresence>
            {showDoubleTapHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Story Content */}
          <div className="w-full h-full relative bg-black">
            <AnimatePresence mode="wait">
              {story.media_type === 'text' ? (
                <motion.div
                  key={`text-${story.id}`}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className={`w-full h-full ${story.background_color || 'bg-gradient-to-br from-primary to-primary/60'} flex items-center justify-center p-10`}
                >
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 20 }}
                    className="text-white text-[22px] font-bold text-center leading-[1.8] drop-shadow-lg"
                    style={{ textShadow: '0 3px 15px rgba(0,0,0,0.4)' }}
                  >
                    {story.text_content}
                  </motion.p>
                </motion.div>
              ) : story.media_type === 'video' ? (
                <motion.div
                  key={`video-${story.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  {resolvedMediaUrl && (
                    <video
                      ref={videoRef}
                      src={resolvedMediaUrl}
                      className="w-full h-full object-contain bg-black"
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
                  )}
                  <div className="video-spinner absolute inset-0 bg-black/30 items-center justify-center z-10 hidden">
                    <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`image-${story.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  {resolvedMediaUrl ? (
                    <>
                      {/* Blurred background fill */}
                      <img
                        src={resolvedMediaUrl}
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
                        alt=""
                      />
                      {/* Main image */}
                      <motion.img
                        initial={{ scale: 1.08, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        src={resolvedMediaUrl}
                        className="relative w-full h-full object-contain z-[1]"
                        alt="story"
                        loading="eager"
                        onLoad={() => setImageLoaded(true)}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gradient overlays */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-[5] pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-[5] pointer-events-none" />
          </div>

          {/* Caption */}
          {story.caption && (
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="absolute bottom-32 left-0 right-0 z-20 px-5"
            >
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl px-4 py-3 border border-white/5">
                <p className="text-white text-[13px] text-center leading-relaxed" dir="rtl">{story.caption}</p>
              </div>
            </motion.div>
          )}

          {/* Navigation tap zones */}
          <div className="absolute inset-0 z-10 flex">
            <button
              className="w-1/3 h-full"
              onClick={goPrev}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
            />
            <button
              className="w-1/3 h-full"
              onClick={handleContentTap}
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

          {/* Side actions (right side, like Instagram) */}
          {!isMyStory && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute left-3 bottom-36 z-20 flex flex-col items-center gap-3"
            >
              <button
                onClick={() => { setLiked(l => !l); handleReact('❤️'); }}
                className="flex flex-col items-center gap-0.5"
              >
                <motion.div
                  whileTap={{ scale: 0.7 }}
                  animate={liked ? { scale: [1, 1.3, 1] } : {}}
                  className={`w-10 h-10 rounded-full ${liked ? 'bg-red-500/30' : 'bg-black/30'} backdrop-blur-md flex items-center justify-center`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                </motion.div>
              </button>
              <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
                <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
                  <Share2 className="w-4.5 h-4.5 text-white" />
                </div>
              </button>
            </motion.div>
          )}

          {/* Reactions bar (for others' stories) */}
          {!isMyStory && (
            <StoryReactions
              storyId={story.id}
              ownerName={group.org_name || group.user_name}
              isMyStory={isMyStory}
              onReact={handleReact}
              onReply={handleReply}
            />
          )}

          {/* My story bottom bar */}
          {isMyStory && (
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-4 left-0 right-0 z-20 px-4 flex items-center justify-between"
              dir="rtl"
            >
              {/* Viewers */}
              <button
                onClick={() => setShowViewers(true)}
                className="flex items-center gap-2 bg-black/30 backdrop-blur-lg rounded-full px-4 py-2.5 text-white border border-white/5 active:scale-95 transition-transform"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">{story.view_count}</span>
                <ChevronUp className="w-3.5 h-3.5 text-white/60" />
              </button>
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform border border-white/5"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform border border-white/5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Swipe up hint for my stories */}
          {isMyStory && viewsForStory.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ delay: 1.5, duration: 2, repeat: 0 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 z-15 text-white/50 text-[10px] flex flex-col items-center pointer-events-none"
            >
              <ChevronUp className="w-4 h-4 animate-bounce" />
              <span>اسحب لأعلى للمشاهدات</span>
            </motion.div>
          )}
        </motion.div>

        {/* Viewers Panel */}
        <AnimatePresence>
          {showViewers && isMyStory && (
            <StoryViewers
              views={viewsForStory}
              onClose={() => setShowViewers(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
