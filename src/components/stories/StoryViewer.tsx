import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Clock, Pause, Play, Volume2, VolumeX } from 'lucide-react';
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
}

const StoryViewer = ({ group, onClose }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { user } = useAuth();
  const { recordView, deleteStory, myStoryViews } = useStories();
  
  const story = group.stories[currentIndex];
  const isMyStory = group.user_id === user?.id;
  const storyDuration = story?.media_type === 'video' ? 15000 : 5000;
  const resolvedMediaUrl = useResolvedUrl(story?.media_url);

  // Record view
  useEffect(() => {
    if (story && !isMyStory) {
      recordView.mutate(story.id);
    }
  }, [story?.id]);

  // Auto-progress
  useEffect(() => {
    if (showViewers || isPaused) return;
    
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < group.stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + (100 / (storyDuration / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, storyDuration, showViewers, isPaused]);

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < group.stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, group.stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleDelete = async () => {
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

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    setTouchStart(null);
  };

  if (!story) return null;

  const viewsForStory = myStoryViews.filter((v) => v.story_id === story.id);
  const storyCounter = `${currentIndex + 1}/${group.stories.length}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-sm h-[85vh] max-h-[700px] rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-2 pt-2">
            {group.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4 pt-2" dir="rtl">
            <div className="flex items-center gap-2">
              <Avatar className="w-9 h-9 border-2 border-white">
                <AvatarImage src={group.org_logo || group.avatar_url || ''} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {group.user_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-sm font-semibold leading-tight">
                  {group.org_name || group.user_name}
                </p>
                <p className="text-[10px] text-white/70 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(story.created_at), { addSuffix: true, locale: ar })}
                  <span className="mx-1">•</span>
                  <span>{storyCounter}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Pause/Play */}
              <button
                onClick={() => setIsPaused((p) => !p)}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              {/* Mute (video only) */}
              {story.media_type === 'video' && (
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
              {isMyStory && (
                <button
                  onClick={handleDelete}
                  className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-destructive/60 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Paused indicator */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
              >
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Pause className="w-8 h-8 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Story Content */}
          <div className="w-full h-full relative">
            {story.media_type === 'text' ? (
              <div className={`w-full h-full ${story.background_color || 'bg-gradient-to-br from-primary to-primary/60'} flex items-center justify-center p-8`}>
                <motion.p
                  key={story.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-white text-2xl font-bold text-center leading-relaxed drop-shadow-lg"
                >
                  {story.text_content}
                </motion.p>
              </div>
            ) : story.media_type === 'video' ? (
              <>
                {resolvedMediaUrl ? (
                  <video
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
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
          </div>

          {/* Caption */}
          {story.caption && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-28 left-0 right-0 z-20 px-4"
            >
              <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-white text-sm text-center">{story.caption}</p>
              </div>
            </motion.div>
          )}

          {/* Navigation Areas (tap zones) */}
          <div className="absolute inset-0 z-10 flex">
            <button className="w-1/3 h-full" onClick={goPrev} />
            <button
              className="w-1/3 h-full"
              onClick={() => setIsPaused((p) => !p)}
            />
            <button className="w-1/3 h-full" onClick={goNext} />
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
            <button
              onClick={() => setShowViewers(true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white hover:bg-black/60 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">{story.view_count} مشاهدة</span>
            </button>
          )}

          {/* Arrows */}
          {currentIndex > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={goPrev}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
          {currentIndex < group.stories.length - 1 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={goNext}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
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
