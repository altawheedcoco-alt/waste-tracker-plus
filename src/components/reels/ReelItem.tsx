import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Play, Pause, Volume2, VolumeX, MoreHorizontal, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Reel } from '@/hooks/useReels';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onDelete?: () => void;
}

const ReelItem = memo(({ reel, isActive, onLike, onComment, onBookmark, onShare, onDelete }: ReelItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const lastTap = useRef(0);

  // Auto play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  // Progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    video.addEventListener('timeupdate', update);
    return () => video.removeEventListener('timeupdate', update);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap = like
      if (!reel.is_liked) onLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      togglePlay();
    }
    lastTap.current = now;
  }, [reel.is_liked, onLike, togglePlay]);

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <div className="relative w-full h-full bg-black snap-start snap-always flex-shrink-0">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        className="absolute inset-0 w-full h-full object-contain"
        loop
        muted={isMuted}
        playsInline
        preload={isActive ? 'auto' : 'metadata'}
        poster={reel.thumbnail_url || undefined}
        onClick={handleDoubleTap}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/20 z-20">
        <motion.div
          className="h-full bg-white"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Play/Pause overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-tap heart animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 pointer-events-none" />

      {/* Bottom info */}
      <div className="absolute bottom-4 left-4 right-20 z-20">
        {/* User info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 ring-2 ring-white/50">
            <AvatarImage src={reel.profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/30 text-white text-sm">
              {reel.profile?.full_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-bold text-sm">{reel.profile?.full_name}</p>
            {reel.org_name && (
              <p className="text-white/60 text-xs">{reel.org_name}</p>
            )}
          </div>
          <span className="text-white/40 text-xs">
            {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true, locale: ar })}
          </span>
        </div>

        {/* Caption */}
        {reel.caption && (
          <p className="text-white text-sm leading-relaxed mb-2 line-clamp-3">{reel.caption}</p>
        )}

        {/* Hashtags */}
        {reel.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {reel.hashtags.map((tag, i) => (
              <span key={i} className="text-primary-foreground/90 text-xs font-medium bg-white/10 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right sidebar - TikTok style */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
        {/* Like */}
        <button onClick={onLike} className="flex flex-col items-center gap-1">
          <motion.div whileTap={{ scale: 1.4 }}>
            <Heart className={cn('w-7 h-7', reel.is_liked ? 'text-red-500 fill-red-500' : 'text-white')} />
          </motion.div>
          <span className="text-white text-[11px] font-semibold">{formatCount(reel.like_count)}</span>
        </button>

        {/* Comment */}
        <button onClick={onComment} className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="text-white text-[11px] font-semibold">{formatCount(reel.comment_count)}</span>
        </button>

        {/* Bookmark */}
        <button onClick={onBookmark} className="flex flex-col items-center gap-1">
          <Bookmark className={cn('w-7 h-7', reel.is_bookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-white')} />
        </button>

        {/* Share */}
        <button onClick={onShare} className="flex flex-col items-center gap-1">
          <Share2 className="w-7 h-7 text-white" />
        </button>

        {/* Views */}
        <div className="flex flex-col items-center gap-1">
          <Eye className="w-5 h-5 text-white/50" />
          <span className="text-white/50 text-[10px]">{formatCount(reel.view_count)}</span>
        </div>

        {/* More */}
        {user?.id === reel.user_id && (
          <button onClick={() => setShowMore(!showMore)} className="relative">
            <MoreHorizontal className="w-6 h-6 text-white" />
            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-full right-0 mb-2 bg-card rounded-xl shadow-2xl overflow-hidden min-w-[140px]"
                >
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-2 px-4 py-3 text-destructive text-sm w-full hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" /> حذف الريل
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>

      {/* Mute toggle */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-6 right-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
      </button>
    </div>
  );
});

ReelItem.displayName = 'ReelItem';
export default ReelItem;
