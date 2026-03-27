import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Clock } from 'lucide-react';
import { StoryGroup, useStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import StoryViewers from './StoryViewers';
import { useResolvedUrl } from '@/hooks/useResolvedUrl';

interface StoryViewerProps {
  group: StoryGroup;
  onClose: () => void;
}

const StoryViewer = ({ group, onClose }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [progress, setProgress] = useState(0);
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
    if (showViewers) return;
    
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
  }, [currentIndex, storyDuration, showViewers]);

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
    } else {
      goNext();
    }
  };

  if (!story) return null;

  const viewsForStory = myStoryViews.filter((v) => v.story_id === story.id);

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
        >
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-2 pt-2">
            {group.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
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
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isMyStory && (
                <button
                  onClick={handleDelete}
                  className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-red-500/60 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Story Content */}
          <div className="w-full h-full">
            {story.media_type === 'text' ? (
              <div className={`w-full h-full ${story.background_color || 'bg-gradient-to-br from-emerald-500 to-teal-700'} flex items-center justify-center p-8`}>
                <p className="text-white text-2xl font-bold text-center leading-relaxed">
                  {story.text_content}
                </p>
              </div>
            ) : story.media_type === 'video' ? (
              resolvedMediaUrl ? (
                <video
                  src={resolvedMediaUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  controls
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )
            ) : (
              resolvedMediaUrl ? (
                <img
                  src={resolvedMediaUrl}
                  className="w-full h-full object-cover"
                  alt="story"
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
            <div className="absolute bottom-16 left-0 right-0 z-20 px-4">
              <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-white text-sm text-center">{story.caption}</p>
              </div>
            </div>
          )}

          {/* Navigation Areas */}
          <div className="absolute inset-0 z-10 flex">
            <button className="w-1/3 h-full" onClick={goPrev} />
            <div className="w-1/3" />
            <button className="w-1/3 h-full" onClick={goNext} />
          </div>

          {/* View Count (my stories only) */}
          {isMyStory && (
            <button
              onClick={() => setShowViewers(true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">{story.view_count} مشاهدة</span>
            </button>
          )}

          {/* Arrows */}
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {currentIndex < group.stories.length - 1 && (
            <button
              onClick={goNext}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
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
