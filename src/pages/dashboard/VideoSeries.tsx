import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Film, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SkipBack, SkipForward, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import LandingWrapper from '@/components/LandingWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';

interface VideoItem {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl?: string;
  videoUrlDark?: string;
  videoUrlLight?: string;
  status: 'available' | 'coming_soon';
  episode: number;
  season: number;
  tags: string[];
}

interface SeasonInfo {
  number: number;
  title: string;
  titleEn: string;
  style: string;
  color: string;
}

const seasons: SeasonInfo[] = [
  { number: 1, title: 'أساسيات المنصة', titleEn: 'Platform Essentials', style: 'Cinematic Minimal', color: 'from-emerald-500 to-teal-600' },
  { number: 2, title: 'الميزات المتقدمة', titleEn: 'Advanced Features', style: 'Tech Product', color: 'from-cyan-500 to-blue-600' },
  { number: 3, title: 'الأنظمة المتكاملة', titleEn: 'Integrated Systems', style: 'Clean Futuristic', color: 'from-indigo-500 to-purple-600' },
  { number: 4, title: 'عالم الشحنات', titleEn: 'Shipments Deep Dive', style: 'Warm Cinematic', color: 'from-amber-500 to-orange-600' },
  { number: 5, title: 'ذكاء المخلفات', titleEn: 'Waste Intelligence AI', style: 'Neural Digital', color: 'from-violet-500 to-fuchsia-600' },
];

const videos: VideoItem[] = [
  // === Season 1 ===
  { id: '1', title: 'تعرّف على iRecycle', titleEn: 'Meet iRecycle', description: 'فيديو تعريفي شامل بالمنصة — واجهة المستخدم، لوحة التحكم، التقارير، تتبع الشاحنات، والإحصائيات الحية.', duration: '0:45', thumbnail: '/thumbnails/ep1-cover.jpg', videoUrl: '/videos/irecycle-series-ep1.mp4', status: 'available', episode: 1, season: 1, tags: ['تعريف', 'المنصة', 'رقمنة'] },
  { id: '2', title: 'كيف تعمل الشحنات؟', titleEn: 'How Shipments Work', description: 'دورة حياة الشحنة من الإنشاء حتى التسليم — التتبع المباشر، الإشعارات، الفوترة التلقائية وشهادات التخلص الآمن.', duration: '0:38', thumbnail: '/thumbnails/ep2-cover.jpg', videoUrlDark: '/videos/irecycle-series-ep2-dark.mp4', videoUrlLight: '/videos/irecycle-series-ep2-light.mp4', status: 'available', episode: 2, season: 1, tags: ['شحنات', 'تتبع', 'فواتير'] },
  { id: '3', title: 'الذكاء الاصطناعي في iRecycle', titleEn: 'AI in iRecycle', description: 'تصنيف المخلفات، توليد المستندات، الوكيل الذكي، تحليل البيانات والتنبؤ بالطلب.', duration: '0:39', thumbnail: '/thumbnails/ep3-cover.jpg', videoUrlDark: '/videos/irecycle-series-ep3-dark.mp4', videoUrlLight: '/videos/irecycle-series-ep3-light.mp4', status: 'available', episode: 3, season: 1, tags: ['AI', 'تحليل', 'أتمتة'] },
  { id: '4', title: 'إدارة الأسطول والسائقين', titleEn: 'Fleet Management', description: 'نظام GPS المتقدم لتتبع الشاحنات، إدارة السائقين، الخريطة الحية وصيانة الأسطول.', duration: '0:39', thumbnail: '/thumbnails/ep4-cover.jpg', videoUrlDark: '/videos/irecycle-series-ep4-dark.mp4', videoUrlLight: '/videos/irecycle-series-ep4-light.mp4', status: 'available', episode: 4, season: 1, tags: ['أسطول', 'GPS', 'سائقين'] },
  { id: '5', title: 'التقارير ولوحة التحكم', titleEn: 'Reports & Dashboard', description: 'لوحات تحكم تفاعلية، تقارير شاملة PDF وExcel، تحليلات متقدمة، تصدير ومشاركة.', duration: '0:39', thumbnail: '/thumbnails/ep5-cover.jpg', videoUrlDark: '/videos/irecycle-series-ep5-dark.mp4', videoUrlLight: '/videos/irecycle-series-ep5-light.mp4', status: 'available', episode: 5, season: 1, tags: ['تقارير', 'داشبورد', 'بيانات'] },
  // === Season 2 ===
  { id: '6', title: 'البورصة الرقمية للمخلفات', titleEn: 'Digital Waste Marketplace', description: 'سوق رقمي ذكي يربط المنشآت المولدة للمخلفات بالمصانع المعالجة — مطابقة ذكية، عروض أسعار فورية، عقود رقمية وتقييمات.', duration: '1:09', thumbnail: '/thumbnails/ep6-cover.jpg', videoUrlDark: '/videos/ep6-dark.mp4', videoUrlLight: '/videos/ep6-light.mp4', status: 'available', episode: 6, season: 2, tags: ['بورصة', 'سوق رقمي', 'مطابقة'] },
  { id: '7', title: 'ضبط الجودة والفحص', titleEn: 'Quality Control & Inspection', description: 'نظام شامل لضبط جودة المخلفات — فحص بالذكاء الاصطناعي، معايير ISO، تصنيف آلي وشهادات جودة معتمدة.', duration: '1:06', thumbnail: '/thumbnails/ep7-cover.jpg', videoUrlDark: '/videos/ep7-dark.mp4', videoUrlLight: '/videos/ep7-light.mp4', status: 'available', episode: 7, season: 2, tags: ['جودة', 'فحص', 'ISO'] },
  { id: '8', title: 'بوابة العملاء', titleEn: 'Customer Portal', description: 'بوابة مخصصة للعملاء لمتابعة الشحنات، الفواتير، التقارير والشهادات مع لوحة تحكم شخصية.', duration: '1:08', thumbnail: '/thumbnails/ep8-cover.jpg', videoUrlDark: '/videos/ep8-dark.mp4', videoUrlLight: '/videos/ep8-light.mp4', status: 'available', episode: 8, season: 2, tags: ['عملاء', 'بوابة', 'خدمة ذاتية'] },
  { id: '9', title: 'تكامل الأنظمة والـ API', titleEn: 'API & System Integration', description: 'ربط iRecycle مع أنظمتك الحالية — ERP، المحاسبة، الخرائط وأنظمة إدارة الأسطول عبر API متكامل.', duration: '1:08', thumbnail: '/thumbnails/ep9-cover.jpg', videoUrlDark: '/videos/ep9-dark.mp4', videoUrlLight: '/videos/ep9-light.mp4', status: 'available', episode: 9, season: 2, tags: ['API', 'تكامل', 'ERP'] },
  { id: '10', title: 'أثر الاستدامة والـ ESG', titleEn: 'Sustainability & ESG Impact', description: 'قياس الأثر البيئي — تقارير ESG، البصمة الكربونية، شهادات الاستدامة ومعايير الاقتصاد الدائري.', duration: '1:15', thumbnail: '/thumbnails/ep10-cover.jpg', videoUrlDark: '/videos/ep10-dark.mp4', videoUrlLight: '/videos/ep10-light.mp4', status: 'available', episode: 10, season: 2, tags: ['استدامة', 'ESG', 'بيئة'] },
  // === Season 3 ===
  { id: '11', title: 'الإشعارات الذكية', titleEn: 'Smart Notifications', description: 'نظام تنبيهات متقدم يبقيك على اطلاع بكل تفاصيل عملياتك — إشعارات فورية، فلترة ذكية، أولويات تلقائية.', duration: '1:38', thumbnail: '/thumbnails/ep11-cover.jpg', videoUrlDark: '/videos/ep11-dark.mp4', status: 'available', episode: 11, season: 3, tags: ['إشعارات', 'تنبيهات', 'AI'] },
  { id: '12', title: 'الإدارة المالية', titleEn: 'Financial Management', description: 'إدارة شاملة للفواتير والمدفوعات والتسويات المالية — فوترة تلقائية، تحليلات مالية، أمان متقدم.', duration: '1:39', thumbnail: '/thumbnails/ep12-cover.jpg', videoUrlDark: '/videos/ep12-dark.mp4', status: 'available', episode: 12, season: 3, tags: ['مالية', 'فواتير', 'تحليلات'] },
  { id: '13', title: 'إدارة القوى العاملة', titleEn: 'Workforce Management', description: 'نظام شامل لإدارة فريق العمل والمهام والأداء — توزيع ذكي، تتبع جغرافي، تدريب وتطوير.', duration: '1:39', thumbnail: '/thumbnails/ep13-cover.jpg', videoUrlDark: '/videos/ep13-dark.mp4', status: 'available', episode: 13, season: 3, tags: ['موظفين', 'مهام', 'أداء'] },
  { id: '14', title: 'مركز الاتصال الذكي', titleEn: 'Smart Call Center', description: 'إدارة متكاملة لخدمة العملاء — رد آلي بالذكاء الاصطناعي، CRM، دعم متعدد القنوات.', duration: '1:40', thumbnail: '/thumbnails/ep14-cover.jpg', videoUrlDark: '/videos/ep14-dark.mp4', status: 'available', episode: 14, season: 3, tags: ['اتصالات', 'CRM', 'دعم'] },
  { id: '15', title: 'الامتثال والحوكمة', titleEn: 'Compliance & Governance', description: 'ضمان الالتزام بالمعايير الدولية — تدقيق رقمي، شهادات ISO، نظام إنذار مبكر.', duration: '1:40', thumbnail: '/thumbnails/ep15-cover.jpg', videoUrlDark: '/videos/ep15-dark.mp4', status: 'available', episode: 15, season: 3, tags: ['امتثال', 'ISO', 'حوكمة'] },
  // === Season 4 ===
  { id: '16', title: 'دورة حياة الشحنة', titleEn: 'Shipment Lifecycle', description: 'رحلة الشحنة الكاملة من لحظة إنشائها حتى التسليم النهائي — المراحل، التتبع، التوثيق والتأكيد.', duration: '1:45', thumbnail: '/thumbnails/ep16-cover.jpg', videoUrlDark: '/videos/ep16-dark.mp4', videoUrlLight: '/videos/ep16-light.mp4', status: 'available', episode: 16, season: 4, tags: ['شحنات', 'دورة حياة', 'تتبع'] },
  { id: '17', title: 'أنواع المخلفات', titleEn: 'Waste Types & Classification', description: 'تصنيف شامل لأنواع المخلفات — صناعية، عضوية، خطرة، إلكترونية — مع معايير الفرز والمعالجة.', duration: '1:45', thumbnail: '/thumbnails/ep17-cover.jpg', videoUrlDark: '/videos/ep17-dark.mp4', videoUrlLight: '/videos/ep17-light.mp4', status: 'available', episode: 17, season: 4, tags: ['مخلفات', 'تصنيف', 'فرز'] },
  { id: '18', title: 'التوثيق الرقمي', titleEn: 'Digital Documentation', description: 'منظومة التوثيق الذكي — بوليصات الشحن، شهادات التخلص الآمن، صور الميزان والتوقيع الإلكتروني.', duration: '1:45', thumbnail: '/thumbnails/ep18-cover.jpg', videoUrlDark: '/videos/ep18-dark.mp4', videoUrlLight: '/videos/ep18-light.mp4', status: 'available', episode: 18, season: 4, tags: ['توثيق', 'شهادات', 'بوليصة'] },
  { id: '19', title: 'الميزان الرقمي', titleEn: 'Digital Weighbridge', description: 'نظام الوزن الذكي المتكامل — ربط الميزان الإلكتروني، التحقق التلقائي، صور التوثيق والتقارير.', duration: '1:45', thumbnail: '/thumbnails/ep19-cover.jpg', videoUrlDark: '/videos/ep19-dark.mp4', videoUrlLight: '/videos/ep19-light.mp4', status: 'available', episode: 19, season: 4, tags: ['ميزان', 'وزن', 'تحقق'] },
  { id: '20', title: 'التسعير الديناميكي', titleEn: 'Dynamic Pricing', description: 'محرك التسعير الذكي — أسعار حسب النوع والوزن والمسافة، عروض خاصة، فوترة تلقائية ومقارنة أسعار السوق.', duration: '1:45', thumbnail: '/thumbnails/ep20-cover.jpg', videoUrlDark: '/videos/ep20-dark.mp4', videoUrlLight: '/videos/ep20-light.mp4', status: 'available', episode: 20, season: 4, tags: ['تسعير', 'فوترة', 'أسعار'] },
  { id: '21', title: 'التخلص الآمن', titleEn: 'Safe Disposal & Compliance', description: 'ضمان التخلص الآمن من المخلفات — شهادات بيئية، تتبع نهاية الدورة، تقارير الامتثال والأثر البيئي.', duration: '1:45', thumbnail: '/thumbnails/ep21-cover.jpg', videoUrlDark: '/videos/ep21-dark.mp4', videoUrlLight: '/videos/ep21-light.mp4', status: 'available', episode: 21, season: 4, tags: ['تخلص آمن', 'بيئة', 'امتثال'] },
  // === Season 5: Waste Intelligence AI ===
  { id: '22', title: 'محرك الذكاء الاصطناعي', titleEn: 'AI Engine Overview', description: 'نظرة شاملة على محرك الذكاء الاصطناعي — النماذج المستخدمة، التدريب المستمر، والتكامل مع كافة أنظمة المنصة.', duration: '1:50', thumbnail: '/thumbnails/ep22-cover.jpg', videoUrlDark: '/videos/ep22-dark.mp4', videoUrlLight: '/videos/ep22-light.mp4', status: 'available', episode: 22, season: 5, tags: ['AI', 'محرك ذكي', 'نماذج'] },
  { id: '23', title: 'التصنيف الذكي للمخلفات', titleEn: 'AI Waste Classification', description: 'تصنيف المخلفات بالرؤية الحاسوبية — تحليل الصور، التعرف على الأنواع، تحديد درجة الخطورة والتوصيات التلقائية.', duration: '1:50', thumbnail: '/thumbnails/ep23-cover.jpg', videoUrlDark: '/videos/ep23-dark.mp4', videoUrlLight: '/videos/ep23-light.mp4', status: 'available', episode: 23, season: 5, tags: ['تصنيف', 'رؤية حاسوبية', 'خطورة'] },
  { id: '24', title: 'التنبؤ بالطلب', titleEn: 'Demand Forecasting', description: 'نظام التنبؤ الذكي — تحليل الاتجاهات، توقع كميات المخلفات، تحسين المسارات وتخطيط الموارد.', duration: '1:50', thumbnail: '/thumbnails/ep24-cover.jpg', videoUrlDark: '/videos/ep24-dark.mp4', videoUrlLight: '/videos/ep24-light.mp4', status: 'available', episode: 24, season: 5, tags: ['تنبؤ', 'تخطيط', 'تحليل'] },
  { id: '25', title: 'الوكيل الذكي المحادثاتي', titleEn: 'Conversational AI Agent', description: 'وكيل ذكي يتحدث مع العملاء عبر واتساب وتليجرام — يأخذ الطلبات، يجيب الاستفسارات، ويصعّد للفريق البشري.', duration: '1:50', thumbnail: '/thumbnails/ep25-cover.jpg', videoUrlDark: '/videos/ep25-dark.mp4', videoUrlLight: '/videos/ep25-light.mp4', status: 'available', episode: 25, season: 5, tags: ['وكيل ذكي', 'محادثات', 'واتساب'] },
  { id: '26', title: 'تحليلات ESG الذكية', titleEn: 'AI-Powered ESG Analytics', description: 'تقارير الاستدامة المدعومة بالذكاء الاصطناعي — حساب البصمة الكربونية، مقارنات السوق، وتوصيات التحسين.', duration: '1:50', thumbnail: '/thumbnails/ep26-cover.jpg', videoUrlDark: '/videos/ep26-dark.mp4', videoUrlLight: '/videos/ep26-light.mp4', status: 'available', episode: 26, season: 5, tags: ['ESG', 'استدامة', 'كربون'] },
  { id: '27', title: 'مستقبل إدارة المخلفات', titleEn: 'Future of Waste Management', description: 'رؤية iRecycle للمستقبل — الروبوتات، IoT، الاقتصاد الدائري الكامل، وكيف ستتحول الصناعة بالتقنية.', duration: '1:50', thumbnail: '/thumbnails/ep27-cover.jpg', videoUrlDark: '/videos/ep27-dark.mp4', videoUrlLight: '/videos/ep27-light.mp4', status: 'available', episode: 27, season: 5, tags: ['مستقبل', 'IoT', 'اقتصاد دائري'] },
];

const getVideoUrl = (video: VideoItem, isDark: boolean): string | undefined => {
  if (video.videoUrlDark && video.videoUrlLight) {
    return isDark ? video.videoUrlDark : video.videoUrlLight;
  }
  return video.videoUrlDark || video.videoUrlLight || video.videoUrl;
};

const availableVideos = videos.filter(v => v.status === 'available');

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/* ─── Custom Video Player ─── */
const VideoPlayer = ({
  video,
  isDark,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  nextVideo,
}: {
  video: VideoItem;
  isDark: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  nextVideo: VideoItem | null;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const [isLoading, setIsLoading] = useState(true);

  const url = getVideoUrl(video, isDark);

  useEffect(() => {
    setShowEndScreen(false);
    setCurrentTime(0);
    setIsPlaying(true);
    setIsLoading(true);
  }, [video.id]);

  const hideControlsDelayed = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (isPlaying && !showEndScreen) setShowControls(false);
    }, 3000);
  }, [isPlaying, showEndScreen]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    hideControlsDelayed();
  }, [hideControlsDelayed]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pct * duration;
    }
  }, [duration]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setShowEndScreen(true);
    setShowControls(true);
  }, []);

  const handleLoadedData = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = videoRef.current?.parentElement?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }, []);

  const skipForward = useCallback(() => {
    if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
  }, [duration]);

  const skipBackward = useCallback(() => {
    if (videoRef.current) videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
        onMouseMove={handleMouseMove}
      >
        {/* Top bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 text-white">
                <Badge className="bg-primary/80 text-primary-foreground text-[10px]">
                  S{video.season} · الحلقة {video.episode}
                </Badge>
                <span className="text-sm font-bold">{video.title}</span>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video area */}
        <div className="flex-1 relative flex items-center justify-center" onClick={togglePlay}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          
          {url ? (
            <video
              ref={videoRef}
              src={url}
              className="w-full h-full object-contain"
              autoPlay
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onLoadedData={handleLoadedData}
              onCanPlay={() => setIsLoading(false)}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
              preload="metadata"
              playsInline
              poster={video.thumbnail ? `${video.thumbnail}?v=6` : undefined}
            />
          ) : (
            <div className="text-center text-white/60 flex flex-col items-center gap-3">
              <Film className="w-16 h-16" />
              <p className="text-sm">الفيديو جاري التحضير...</p>
            </div>
          )}

          {/* Prev/Next arrows overlay */}
          <AnimatePresence>
            {showControls && (
              <>
                {hasPrev && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white backdrop-blur-sm transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </motion.button>
                )}
                {hasNext && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white backdrop-blur-sm transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </motion.button>
                )}
              </>
            )}
          </AnimatePresence>

          {/* End screen - Next Episode */}
          <AnimatePresence>
            {showEndScreen && nextVideo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-black/85 z-30 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center space-y-6 max-w-md px-4">
                  <p className="text-white/60 text-sm">انتهت الحلقة</p>
                  <h3 className="text-white text-2xl font-bold">الحلقة التالية</h3>
                  
                  <button
                    onClick={onNext}
                    className="group relative w-full rounded-xl overflow-hidden border border-white/20 hover:border-primary/60 transition-all"
                  >
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
                      {nextVideo.thumbnail && (
                        <img src={`${nextVideo.thumbnail}?v=6`} alt={nextVideo.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-7 h-7 text-primary-foreground ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3 text-white text-right">
                        <p className="text-xs text-white/60">S{nextVideo.season} · الحلقة {nextVideo.episode}</p>
                        <p className="text-sm font-bold">{nextVideo.title}</p>
                      </div>
                    </div>
                  </button>

                  <button onClick={onClose} className="text-white/50 hover:text-white text-xs transition-colors">
                    العودة للقائمة
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <AnimatePresence>
          {showControls && !showEndScreen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-12"
            >
              {/* Progress bar */}
              <div
                ref={progressRef}
                className="group w-full h-2 bg-white/20 rounded-full cursor-pointer mb-3 relative hover:h-3 transition-all"
                onClick={handleSeek}
              >
                <div className="h-full bg-primary rounded-full relative" style={{ width: `${progress}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); skipBackward(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); skipForward(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-white/70 text-xs font-mono min-w-[80px]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Left controls */}
                <div className="flex items-center gap-2">
                  {hasPrev && (
                    <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="text-white/70 hover:text-white text-xs flex items-center gap-1 transition-colors">
                      <ChevronRight className="w-4 h-4" /> السابقة
                    </button>
                  )}
                  {hasNext && (
                    <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="text-white/70 hover:text-white text-xs flex items-center gap-1 transition-colors">
                      التالية <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─── Main Page ─── */
const VideoSeries = () => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [collapsedSeasons, setCollapsedSeasons] = useState<number[]>([]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggleSeason = (num: number) => {
    setCollapsedSeasons(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  const openVideo = useCallback((video: VideoItem) => {
    const idx = availableVideos.findIndex(v => v.id === video.id);
    if (idx !== -1) setSelectedVideoIndex(idx);
  }, []);

  const goNext = useCallback(() => {
    setSelectedVideoIndex(prev => prev !== null && prev < availableVideos.length - 1 ? prev + 1 : prev);
  }, []);

  const goPrev = useCallback(() => {
    setSelectedVideoIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev);
  }, []);

  const selectedVideo = selectedVideoIndex !== null ? availableVideos[selectedVideoIndex] : null;
  const hasNext = selectedVideoIndex !== null && selectedVideoIndex < availableVideos.length - 1;
  const hasPrev = selectedVideoIndex !== null && selectedVideoIndex > 0;
  const nextVideo = hasNext ? availableVideos[selectedVideoIndex! + 1] : null;

  return (
    <LandingWrapper>
      <Header />
      <div className="space-y-6 p-4 sm:p-6 pt-24 sm:pt-28 max-w-7xl mx-auto">
        <BackButton />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Film className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">سلسلة iRecycle</h1>
              <p className="text-muted-foreground text-sm">تعرّف على المنصة خطوة بخطوة عبر سلسلة فيديوهات احترافية</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Badge variant="outline" className="text-xs gap-1.5">
              <Film className="w-3 h-3" />
              {availableVideos.length} حلقة متاحة
            </Badge>
            <Badge variant="outline" className="text-xs gap-1.5">
              {seasons.length} مواسم
            </Badge>
          </div>
        </motion.div>

        {/* Seasons */}
        {seasons.map((season) => {
          const seasonVideos = videos.filter(v => v.season === season.number);
          const isCollapsed = collapsedSeasons.includes(season.number);

          return (
            <motion.div
              key={season.number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: season.number * 0.1 }}
            >
              <button
                onClick={() => toggleSeason(season.number)}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all mb-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${season.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <span className="text-white font-bold text-base">S{season.number}</span>
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold text-base sm:text-lg">الموسم {season.number}: {season.title}</h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">{season.titleEn}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{season.style}</span>
                      <span className="text-xs text-muted-foreground">{seasonVideos.length} حلقات</span>
                    </div>
                  </div>
                </div>
                {isCollapsed ? <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
                  {seasonVideos.map((video, idx) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`group rounded-lg border overflow-hidden transition-all ${
                        video.status === 'available'
                          ? 'border-border/50 bg-card hover:border-primary/50 hover:shadow-md cursor-pointer'
                          : 'border-border/30 bg-muted/20 opacity-60'
                      }`}
                      onClick={() => video.status === 'available' && openVideo(video)}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {video.thumbnail && (
                          <img
                            src={`${video.thumbnail}?v=6`}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading={idx < 4 ? 'eager' : 'lazy'}
                            decoding="async"
                            fetchPriority={idx < 2 ? 'high' : 'low'}
                            width={320}
                            height={180}
                          />
                        )}
                        
                        {video.status === 'available' ? (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all">
                              <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
                            <Clock className="w-6 h-6 text-white/70" />
                            <span className="text-[10px] text-white/70">قريباً</span>
                          </div>
                        )}

                        <div className="absolute top-2 right-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white/90 backdrop-blur-sm">
                            {video.duration}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-2.5">
                        <h3 className="font-bold text-xs sm:text-sm line-clamp-1">{video.title}</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">{video.description}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {video.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Full-screen Video Player */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          isDark={isDark}
          onClose={() => setSelectedVideoIndex(null)}
          onNext={goNext}
          onPrev={goPrev}
          hasNext={hasNext}
          hasPrev={hasPrev}
          nextVideo={nextVideo}
        />
      )}
    </LandingWrapper>
  );
};

export default VideoSeries;
