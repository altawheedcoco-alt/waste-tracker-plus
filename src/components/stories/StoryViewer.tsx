import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Eye, Trash2, Pause, Play, Volume2, VolumeX, Share2, Bookmark, Heart, ChevronUp, MessageCircle, Music2, Forward, MoreHorizontal, Download, Flag, UserPlus } from 'lucide-react';
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
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [following, setFollowing] = useState(false);
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

  // Set initial like count from view_count
  useEffect(() => {
    if (story) setLikeCount(Math.floor((story.view_count || 0) * 0.6));
  }, [story?.id]);

  // Record view
  useEffect(() => {
    if (story && !isMyStory) recordView.mutate(story.id);
  }, [story?.id]);

  // Auto-progress
  useEffect(() => {
    if (showViewers || isPaused || showMoreMenu) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { goNext(); return 0; }
        return prev + (100 / (storyDuration / 50));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [currentIndex, currentGroupIndex, storyDuration, showViewers, isPaused, showMoreMenu]);

  // Keyboard
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
        case 'l': handleLike(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentGroupIndex, liked]);

  const goNext = useCallback(() => {
    if (currentIndex < (group?.stories.length || 1) - 1) setCurrentIndex(i => i + 1);
    else if (allGroups && currentGroupIndex < allGroups.length - 1) { setCurrentGroupIndex(i => i + 1); setCurrentIndex(0); }
    else onClose();
  }, [currentIndex, currentGroupIndex, group?.stories.length, allGroups, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
    else if (allGroups && currentGroupIndex > 0) { setCurrentGroupIndex(i => i - 1); setCurrentIndex(0); }
  }, [currentIndex, currentGroupIndex, allGroups]);

  const goNextGroup = useCallback(() => {
    if (allGroups && currentGroupIndex < allGroups.length - 1) { setCurrentGroupIndex(i => i + 1); setCurrentIndex(0); }
  }, [currentGroupIndex, allGroups]);

  const goPrevGroup = useCallback(() => {
    if (allGroups && currentGroupIndex > 0) { setCurrentGroupIndex(i => i - 1); setCurrentIndex(0); }
  }, [currentGroupIndex, allGroups]);

  const handleDelete = async () => {
    if (!story) return;
    await deleteStory.mutateAsync(story.id);
    if (group.stories.length <= 1) onClose();
    else if (currentIndex >= group.stories.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const handleLike = () => {
    setLiked(l => {
      setLikeCount(c => l ? Math.max(0, c - 1) : c + 1);
      return !l;
    });
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
        await navigator.share({ title: `حالة ${group.org_name || group.user_name}`, text: story.caption || story.text_content || 'شاهد هذه الحالة', url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('تم نسخ الرابط');
      }
    } catch {}
  };

  const handleBookmark = () => {
    setBookmarked(b => !b);
    toast.success(bookmarked ? 'تم إزالة الحفظ' : 'تم الحفظ ✓');
  };

  const handleFollow = () => {
    setFollowing(f => !f);
    toast.success(following ? 'تم إلغاء المتابعة' : 'تم المتابعة ✓');
  };

  // Double tap to like
  const handleContentTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) handleLike();
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 1200);
    }
    lastTapRef.current = now;
  };

  // Touch/swipe
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const diffX = touchStart.x - e.changedTouches[0].clientX;
    const diffY = touchStart.y - e.changedTouches[0].clientY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) { diffX > 0 ? goNext() : goPrev(); }
    else if (diffY < -80) onClose();
    else if (diffY > 80 && isMyStory) setShowViewers(true);
    setTouchStart(null);
  };

  // Long press to pause
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const handlePointerDown = () => { longPressTimer.current = setTimeout(() => setIsPaused(true), 200); };
  const handlePointerUp = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  if (!story || !group) return null;

  const viewsForStory = myStoryViews.filter(v => v.story_id === story.id);
  const storyCounter = `${currentIndex + 1}/${group.stories.length}`;
  const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

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
          key={group.user_id}
          style={{ opacity: dragOpacity, scale: dragScale }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.4}
          onDragEnd={(_, info: PanInfo) => { if (info.offset.y > 120) onClose(); }}
          initial={{ scale: 0.88, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="relative w-full max-w-[380px] h-[94vh] max-h-[800px] rounded-[20px] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* ══════ Progress Bars ══════ */}
          <div className="absolute top-0 left-0 right-0 z-30 flex gap-[3px] px-3 pt-2">
            {group.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[2.5px] bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={false}
                  animate={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }}
                  transition={i === currentIndex ? { duration: 0.05, ease: 'linear' } : { duration: 0.3 }}
                />
              </div>
            ))}
          </div>

          {/* ══════ Header ══════ */}
          <div className="absolute top-2 left-0 right-0 z-30 flex items-center justify-between px-3 pt-3" dir="rtl">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Avatar className="w-9 h-9 border-[1.5px] border-white/60 shadow-lg">
                  <AvatarImage src={group.org_logo || group.avatar_url || ''} />
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-bold">
                    {group.user_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-white min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-bold leading-tight drop-shadow-md truncate max-w-[120px]">
                    {isMyStory ? 'حالتي' : (group.org_name || group.user_name)}
                  </p>
                  {/* Follow button (TikTok style) */}
                  {!isMyStory && !following && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileTap={{ scale: 0.8 }}
                      onClick={handleFollow}
                      className="bg-primary rounded-md px-2 py-0.5 text-[9px] font-bold text-primary-foreground"
                    >
                      متابعة
                    </motion.button>
                  )}
                </div>
                <p className="text-[9px] text-white/60 flex items-center gap-1">
                  {formatDistanceToNow(new Date(story.created_at), { addSuffix: true, locale: ar })}
                  {group.stories.length > 1 && (
                    <span className="text-white/40 text-[8px]">• {storyCounter}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPaused(p => !p)}
                className="w-7 h-7 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white/80 active:scale-90 transition-transform"
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </button>
              {story.media_type === 'video' && (
                <button
                  onClick={() => setIsMuted(m => !m)}
                  className="w-7 h-7 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white/80 active:scale-90 transition-transform"
                >
                  {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
              )}
              <button
                onClick={() => setShowMoreMenu(m => !m)}
                className="w-7 h-7 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white/80 active:scale-90 transition-transform"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white/80 active:scale-90 transition-transform"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ══════ More Menu (Bottom Sheet) ══════ */}
          <AnimatePresence>
            {showMoreMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 bg-black/40"
                  onClick={() => setShowMoreMenu(false)}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-50 bg-neutral-900 rounded-t-2xl pb-6"
                  dir="rtl"
                >
                  <div className="flex justify-center pt-2 pb-3">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 px-4 pb-4">
                    {[
                      { icon: Bookmark, label: bookmarked ? 'محفوظ' : 'حفظ', active: bookmarked, action: handleBookmark },
                      { icon: Share2, label: 'مشاركة', active: false, action: handleShare },
                      { icon: Forward, label: 'إعادة نشر', active: false, action: () => toast.success('تم إعادة النشر') },
                      { icon: Download, label: 'تحميل', active: false, action: () => toast.info('قريباً') },
                    ].map(({ icon: Icon, label, active, action }) => (
                      <button key={label} onClick={action} className="flex flex-col items-center gap-1.5">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${active ? 'bg-primary/20' : 'bg-white/10'}`}>
                          <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-white'}`} />
                        </div>
                        <span className={`text-[10px] ${active ? 'text-primary' : 'text-white/70'}`}>{label}</span>
                      </button>
                    ))}
                  </div>
                  {!isMyStory && (
                    <div className="border-t border-white/10 mx-4 pt-3 space-y-1">
                      <button onClick={handleFollow} className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                        <UserPlus className="w-5 h-5 text-white/70" />
                        <span className="text-sm text-white/90">{following ? 'إلغاء المتابعة' : 'متابعة'} {group.org_name || group.user_name}</span>
                      </button>
                      <button className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                        <Flag className="w-5 h-5 text-white/70" />
                        <span className="text-sm text-white/90">إبلاغ</span>
                      </button>
                    </div>
                  )}
                  {isMyStory && (
                    <div className="border-t border-white/10 mx-4 pt-3">
                      <button onClick={handleDelete} className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                        <Trash2 className="w-5 h-5 text-red-400" />
                        <span className="text-sm text-red-400">حذف الحالة</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ══════ Paused overlay ══════ */}
          <AnimatePresence>
            {isPaused && !showMoreMenu && !showViewers && (
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
                  className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-lg flex items-center justify-center"
                >
                  <Pause className="w-6 h-6 text-white" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════ Double-tap heart ══════ */}
          <AnimatePresence>
            {showDoubleTapHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 1.4, 1.1], opacity: [1, 1, 0] }}
                transition={{ duration: 1, times: [0, 0.3, 1] }}
                className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-28 h-28 text-red-500 fill-red-500 drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════ Story Content ══════ */}
          <div className="w-full h-full relative bg-black">
            <AnimatePresence mode="wait">
              {story.media_type === 'text' ? (
                <motion.div
                  key={`text-${story.id}`}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`w-full h-full ${story.background_color || 'bg-gradient-to-br from-primary to-primary/60'} flex items-center justify-center p-10`}
                >
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, type: 'spring', damping: 20 }}
                    className="text-white text-[22px] font-bold text-center leading-[1.8] drop-shadow-lg"
                    style={{ textShadow: '0 3px 15px rgba(0,0,0,0.4)' }}
                  >
                    {story.text_content}
                  </motion.p>
                </motion.div>
              ) : story.media_type === 'video' ? (
                <motion.div key={`video-${story.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
                  {resolvedMediaUrl && (
                    <video
                      ref={videoRef}
                      src={resolvedMediaUrl}
                      className="w-full h-full object-contain bg-black"
                      autoPlay playsInline muted={isMuted} preload="auto"
                      onWaiting={(e) => { const s = e.currentTarget.parentElement?.querySelector('.video-spinner') as HTMLElement; if (s) s.style.display = 'flex'; }}
                      onPlaying={(e) => { const s = e.currentTarget.parentElement?.querySelector('.video-spinner') as HTMLElement; if (s) s.style.display = 'none'; }}
                      onPause={() => setIsPaused(true)}
                      onPlay={() => setIsPaused(false)}
                    />
                  )}
                  <div className="video-spinner absolute inset-0 bg-black/30 items-center justify-center z-10 hidden">
                    <div className="w-10 h-10 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                </motion.div>
              ) : (
                <motion.div key={`image-${story.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full relative">
                  {resolvedMediaUrl ? (
                    <>
                      <img src={resolvedMediaUrl} className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40" alt="" />
                      <motion.img
                        initial={{ scale: 1.06, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        src={resolvedMediaUrl}
                        className="relative w-full h-full object-contain z-[1]"
                        alt="story" loading="eager"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gradient overlays */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent z-[5] pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-[5] pointer-events-none" />
          </div>

          {/* ══════ TikTok/Reels Side Action Bar ══════ */}
          {!isMyStory && (
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="absolute left-2.5 bottom-[140px] z-20 flex flex-col items-center gap-4"
            >
              {/* Like */}
              <button onClick={handleLike} className="flex flex-col items-center">
                <motion.div
                  whileTap={{ scale: 0.7 }}
                  animate={liked ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="w-11 h-11 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center border border-white/5"
                >
                  <Heart className={`w-[22px] h-[22px] ${liked ? 'text-red-500 fill-red-500' : 'text-white'} transition-colors`} />
                </motion.div>
                <span className="text-[10px] text-white/80 mt-0.5 font-medium">{formatCount(likeCount)}</span>
              </button>

              {/* Comment / Reply */}
              <button className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center border border-white/5">
                  <MessageCircle className="w-[21px] h-[21px] text-white" />
                </div>
                <span className="text-[10px] text-white/80 mt-0.5 font-medium">رد</span>
              </button>

              {/* Share */}
              <button onClick={handleShare} className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center border border-white/5">
                  <Share2 className="w-[20px] h-[20px] text-white" />
                </div>
                <span className="text-[10px] text-white/80 mt-0.5 font-medium">مشاركة</span>
              </button>

              {/* Bookmark */}
              <button onClick={handleBookmark} className="flex flex-col items-center">
                <motion.div
                  whileTap={{ scale: 0.7 }}
                  animate={bookmarked ? { scale: [1, 1.3, 1] } : {}}
                  className="w-11 h-11 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center border border-white/5"
                >
                  <Bookmark className={`w-[20px] h-[20px] ${bookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-white'} transition-colors`} />
                </motion.div>
              </button>

              {/* Rotating music disc (TikTok signature) */}
              <motion.div
                animate={{ rotate: isPaused ? 0 : 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="w-9 h-9 rounded-full border-2 border-white/20 bg-neutral-800 flex items-center justify-center overflow-hidden"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={group.org_logo || group.avatar_url || ''} />
                  <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">{group.user_name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </motion.div>
            </motion.div>
          )}

          {/* ══════ Caption + Music ticker (Reels/TikTok bottom) ══════ */}
          <div className="absolute bottom-[60px] left-14 right-3 z-20 space-y-2" dir="rtl">
            {/* Name */}
            {!isMyStory && (
              <p className="text-white text-[13px] font-bold drop-shadow-md">
                @{group.org_name || group.user_name}
              </p>
            )}
            {/* Caption */}
            {story.caption && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white/90 text-[12px] leading-relaxed drop-shadow-md line-clamp-3"
              >
                {story.caption}
              </motion.p>
            )}
            {story.text_content && story.media_type !== 'text' && (
              <p className="text-white/70 text-[11px] line-clamp-2">{story.text_content}</p>
            )}
            {/* Music ticker */}
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Music2 className="w-3 h-3 text-white/60 shrink-0" />
              <div className="overflow-hidden flex-1">
                <motion.p
                  animate={{ x: ['0%', '-100%'] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="text-[10px] text-white/50 whitespace-nowrap"
                >
                  {group.org_name || group.user_name} • الصوت الأصلي &nbsp;&nbsp;&nbsp; {group.org_name || group.user_name} • الصوت الأصلي
                </motion.p>
              </div>
            </div>
          </div>

          {/* ══════ Bottom reply bar (for others) ══════ */}
          {!isMyStory && (
            <StoryReactions
              storyId={story.id}
              ownerName={group.org_name || group.user_name}
              isMyStory={isMyStory}
              onReact={handleReact}
              onReply={handleReply}
            />
          )}

          {/* ══════ My story bottom bar ══════ */}
          {isMyStory && (
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-3 left-0 right-0 z-20 px-3 flex items-center justify-between"
              dir="rtl"
            >
              <button
                onClick={() => setShowViewers(true)}
                className="flex items-center gap-2 bg-black/25 backdrop-blur-lg rounded-full px-4 py-2 text-white border border-white/5 active:scale-95 transition-transform"
              >
                <Eye className="w-4 h-4" />
                <span className="text-[13px] font-medium">{story.view_count}</span>
                <ChevronUp className="w-3 h-3 text-white/50" />
              </button>
              <div className="flex items-center gap-1.5">
                <button onClick={handleShare} className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform border border-white/5">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleDelete} className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform border border-white/5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════ Navigation tap zones ══════ */}
          <div className="absolute inset-0 z-10 flex">
            <button className="w-1/3 h-full" onClick={goPrev} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} />
            <button className="w-1/3 h-full" onClick={handleContentTap} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} />
            <button className="w-1/3 h-full" onClick={goNext} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} />
          </div>
        </motion.div>

        {/* Viewers Panel */}
        <AnimatePresence>
          {showViewers && isMyStory && (
            <StoryViewers views={viewsForStory} onClose={() => setShowViewers(false)} />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
