import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Play, Volume2, VolumeX, MoreHorizontal, Trash2, Eye, Music, UserPlus, BarChart3, Sparkles, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Reel } from '@/hooks/useReels';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import ReelShareSheet from './ReelShareSheet';
import ReelAnalytics from './ReelAnalytics';

// Video filters
const VIDEO_FILTERS = [
  { id: 'none', label: 'عادي', css: 'none' },
  { id: 'bw', label: 'أبيض وأسود', css: 'grayscale(100%)' },
  { id: 'warm', label: 'دافئ', css: 'sepia(40%) saturate(130%) brightness(105%)' },
  { id: 'cold', label: 'بارد', css: 'saturate(80%) hue-rotate(20deg) brightness(105%)' },
  { id: 'cinematic', label: 'سينمائي', css: 'contrast(120%) saturate(90%) brightness(95%)' },
  { id: 'vintage', label: 'كلاسيكي', css: 'sepia(60%) contrast(90%) brightness(95%)' },
  { id: 'vivid', label: 'حيوي', css: 'saturate(160%) contrast(110%)' },
  { id: 'fade', label: 'باهت', css: 'saturate(60%) brightness(110%) contrast(85%)' },
] as const;

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onDelete?: () => void;
  onDuet?: () => void;
}

const ReelItem = memo(({ reel, isActive, onLike, onComment, onBookmark, onShare, onDelete, onDuet }: ReelItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const [progress, setProgress] = useState(0);
  const [expandCaption, setExpandCaption] = useState(false);
  const { user } = useAuth();
  const lastTap = useRef(0);

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
    if (video.paused) { video.play(); setIsPlaying(true); }
    else { video.pause(); setIsPlaying(false); }
  }, []);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!reel.is_liked) onLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    } else {
      togglePlay();
    }
    lastTap.current = now;
  }, [reel.is_liked, onLike, togglePlay]);

  const fmt = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const isOwner = user?.id === reel.user_id;
  const currentFilter = VIDEO_FILTERS.find(f => f.id === activeFilter) || VIDEO_FILTERS[0];
  const reelUrl = `${window.location.origin}/reels?id=${reel.id}`;

  return (
    <div className="relative w-full h-full bg-black snap-start snap-always flex-shrink-0 overflow-hidden">
      {/* Blurred background */}
      {reel.thumbnail_url && (
        <div
          className="absolute inset-0 scale-150 blur-3xl opacity-30"
          style={{ backgroundImage: `url(${reel.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}

      {/* Video with filter */}
      <video
        ref={videoRef}
        src={reel.video_url}
        className="absolute inset-0 w-full h-full object-contain z-[1]"
        style={{ filter: currentFilter.css }}
        loop
        muted={isMuted}
        playsInline
        preload={isActive ? 'auto' : 'metadata'}
        poster={reel.thumbnail_url || undefined}
        onClick={handleDoubleTap}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-white/15 z-20">
        <motion.div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full" style={{ width: `${progress}%` }} />
      </div>

      {/* Pause indicator */}
      <AnimatePresence>
        {!isPlaying && isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center z-10"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Play className="w-9 h-9 text-white fill-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-tap heart */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{ scale: 1.3, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, y: -50 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <Heart className="w-28 h-28 text-destructive fill-destructive drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter selector */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-0 right-0 z-30 px-3"
          >
            <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-3 border border-white/10">
              <p className="text-white/60 text-[10px] text-center mb-2">🎨 فلاتر الفيديو</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {VIDEO_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={cn(
                      'flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all',
                      activeFilter === f.id
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />

      {/* Bottom info */}
      <div className="absolute bottom-5 left-4 right-[72px] z-20">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative">
            <Avatar className="w-11 h-11 ring-2 ring-white/40">
              <AvatarImage src={reel.profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/40 text-white text-sm font-bold">
                {reel.profile?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            {!isOwner && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center border-2 border-black">
                <UserPlus className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-sm truncate">{reel.profile?.full_name}</p>
              <span className="text-white/30 text-[10px]">•</span>
              <span className="text-white/40 text-[10px] flex-shrink-0">
                {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true, locale: ar })}
              </span>
            </div>
            {reel.org_name && <p className="text-white/50 text-[11px] truncate">{reel.org_name}</p>}
          </div>
        </div>

        {reel.caption && (
          <div className="mb-2">
            <p className={cn('text-white/90 text-[13px] leading-relaxed', !expandCaption && 'line-clamp-2')} onClick={() => setExpandCaption(!expandCaption)}>
              {reel.caption}
            </p>
            {reel.caption.length > 80 && !expandCaption && (
              <button onClick={() => setExpandCaption(true)} className="text-white/50 text-[11px] mt-0.5">المزيد</button>
            )}
          </div>
        )}

        {reel.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {reel.hashtags.slice(0, 4).map((tag, i) => (
              <span key={i} className="text-[11px] font-medium text-primary/90 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">#{tag}</span>
            ))}
          </div>
        )}

        {/* Music ticker */}
        <div className="flex items-center gap-2 overflow-hidden">
          <Music className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
          <div className="overflow-hidden flex-1">
            <motion.p
              animate={{ x: [0, -200] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="text-white/40 text-[11px] whitespace-nowrap"
            >
              الصوت الأصلي — {reel.profile?.full_name} &nbsp;&nbsp;&nbsp;&nbsp; الصوت الأصلي — {reel.profile?.full_name}
            </motion.p>
          </div>
          <motion.div
            animate={isPlaying ? { rotate: 360 } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted-foreground/30 border-2 border-white/20 flex items-center justify-center flex-shrink-0"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-black/80" />
          </motion.div>
        </div>
      </div>

      {/* Right action bar */}
      <div className="absolute right-2.5 bottom-28 z-20 flex flex-col items-center gap-3.5">
        {/* Like */}
        <button onClick={onLike} className="flex flex-col items-center gap-0.5 active:scale-110 transition-transform">
          <motion.div whileTap={{ scale: 1.5 }} className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <Heart className={cn('w-6 h-6 transition-colors', reel.is_liked ? 'text-destructive fill-destructive' : 'text-white')} />
          </motion.div>
          <span className="text-white text-[10px] font-bold">{fmt(reel.like_count)}</span>
        </button>

        {/* Comment */}
        <button onClick={onComment} className="flex flex-col items-center gap-0.5 active:scale-110 transition-transform">
          <div className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold">{fmt(reel.comment_count)}</span>
        </button>

        {/* Bookmark */}
        <button onClick={onBookmark} className="flex flex-col items-center gap-0.5 active:scale-110 transition-transform">
          <div className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <Bookmark className={cn('w-6 h-6 transition-colors', reel.is_bookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-white')} />
          </div>
        </button>

        {/* Share */}
        <button onClick={() => setShowShareSheet(true)} className="flex flex-col items-center gap-0.5 active:scale-110 transition-transform">
          <div className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* Duet/Reply */}
        {!isOwner && onDuet && (
          <button onClick={onDuet} className="flex flex-col items-center gap-0.5 active:scale-110 transition-transform">
            <div className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <Reply className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/60 text-[9px]">ديو</span>
          </button>
        )}

        {/* Filters */}
        <button onClick={() => setShowFilters(!showFilters)} className="flex flex-col items-center gap-0.5 active:scale-110 transition-transform">
          <div className={cn(
            'w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center',
            activeFilter !== 'none' ? 'bg-primary/40 ring-1 ring-primary/60' : 'bg-black/20'
          )}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* Views */}
        <button
          onClick={isOwner ? () => setShowAnalytics(true) : undefined}
          className="flex flex-col items-center gap-0.5"
        >
          {isOwner ? (
            <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-white/60" />
            </div>
          ) : (
            <Eye className="w-4 h-4 text-white/40" />
          )}
          <span className="text-white/40 text-[9px]">{fmt(reel.view_count)}</span>
        </button>

        {/* More (owner) */}
        {isOwner && (
          <button onClick={() => setShowMore(!showMore)} className="relative active:scale-110 transition-transform">
            <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden min-w-[150px] border border-border/30"
                >
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-2.5 px-4 py-3.5 text-destructive text-sm w-full hover:bg-destructive/10 transition-colors"
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
        className="absolute top-14 right-4 z-20 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-white/80" /> : <Volume2 className="w-4 h-4 text-white/80" />}
      </button>

      {/* Share Sheet */}
      <ReelShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        reelUrl={reelUrl}
        videoUrl={reel.video_url}
        caption={reel.caption}
      />

      {/* Analytics (owner only) */}
      {isOwner && (
        <ReelAnalytics
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          reel={reel}
        />
      )}
    </div>
  );
});

ReelItem.displayName = 'ReelItem';
export default ReelItem;
