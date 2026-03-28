import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Film, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import LandingWrapper from '@/components/LandingWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/ui/back-button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
];

const videos: VideoItem[] = [
  // === Season 1 ===
  {
    id: '1', title: 'تعرّف على iRecycle', titleEn: 'Meet iRecycle',
    description: 'فيديو تعريفي شامل بالمنصة — واجهة المستخدم، لوحة التحكم، التقارير، تتبع الشاحنات، والإحصائيات الحية.',
    duration: '0:45', thumbnail: '/thumbnails/ep1-cover.jpg', videoUrl: '/videos/irecycle-series-ep1.mp4',
    status: 'available', episode: 1, season: 1, tags: ['تعريف', 'المنصة', 'رقمنة'],
  },
  {
    id: '2', title: 'كيف تعمل الشحنات؟', titleEn: 'How Shipments Work',
    description: 'دورة حياة الشحنة من الإنشاء حتى التسليم — التتبع المباشر، الإشعارات، الفوترة التلقائية وشهادات التخلص الآمن.',
    duration: '0:38', thumbnail: '/thumbnails/ep2-cover.jpg',
    videoUrlDark: '/videos/irecycle-series-ep2-dark.mp4', videoUrlLight: '/videos/irecycle-series-ep2-light.mp4',
    status: 'available', episode: 2, season: 1, tags: ['شحنات', 'تتبع', 'فواتير'],
  },
  {
    id: '3', title: 'الذكاء الاصطناعي في iRecycle', titleEn: 'AI in iRecycle',
    description: 'تصنيف المخلفات، توليد المستندات، الوكيل الذكي، تحليل البيانات والتنبؤ بالطلب.',
    duration: '0:39', thumbnail: '/thumbnails/ep3-cover.jpg',
    videoUrlDark: '/videos/irecycle-series-ep3-dark.mp4', videoUrlLight: '/videos/irecycle-series-ep3-light.mp4',
    status: 'available', episode: 3, season: 1, tags: ['AI', 'تحليل', 'أتمتة'],
  },
  {
    id: '4', title: 'إدارة الأسطول والسائقين', titleEn: 'Fleet Management',
    description: 'نظام GPS المتقدم لتتبع الشاحنات، إدارة السائقين، الخريطة الحية وصيانة الأسطول.',
    duration: '0:39', thumbnail: '/thumbnails/ep4-cover.jpg',
    videoUrlDark: '/videos/irecycle-series-ep4-dark.mp4', videoUrlLight: '/videos/irecycle-series-ep4-light.mp4',
    status: 'available', episode: 4, season: 1, tags: ['أسطول', 'GPS', 'سائقين'],
  },
  {
    id: '5', title: 'التقارير ولوحة التحكم', titleEn: 'Reports & Dashboard',
    description: 'لوحات تحكم تفاعلية، تقارير شاملة PDF وExcel، تحليلات متقدمة، تصدير ومشاركة.',
    duration: '0:39', thumbnail: '/thumbnails/ep5-cover.jpg',
    videoUrlDark: '/videos/irecycle-series-ep5-dark.mp4', videoUrlLight: '/videos/irecycle-series-ep5-light.mp4',
    status: 'available', episode: 5, season: 1, tags: ['تقارير', 'داشبورد', 'بيانات'],
  },
  // === Season 2 ===
  {
    id: '6', title: 'البورصة الرقمية للمخلفات', titleEn: 'Digital Waste Marketplace',
    description: 'سوق رقمي ذكي يربط المنشآت المولدة للمخلفات بالمصانع المعالجة — مطابقة ذكية، عروض أسعار فورية، عقود رقمية وتقييمات.',
    duration: '1:09', thumbnail: '/thumbnails/ep6-cover.jpg',
    videoUrlDark: '/videos/ep6-dark.mp4', videoUrlLight: '/videos/ep6-light.mp4',
    status: 'available', episode: 6, season: 2, tags: ['بورصة', 'سوق رقمي', 'مطابقة'],
  },
  {
    id: '7', title: 'ضبط الجودة والفحص', titleEn: 'Quality Control & Inspection',
    description: 'نظام شامل لضبط جودة المخلفات — فحص بالذكاء الاصطناعي، معايير ISO، تصنيف آلي وشهادات جودة معتمدة.',
    duration: '1:06', thumbnail: '/thumbnails/ep7-cover.jpg',
    videoUrlDark: '/videos/ep7-dark.mp4', videoUrlLight: '/videos/ep7-light.mp4',
    status: 'available', episode: 7, season: 2, tags: ['جودة', 'فحص', 'ISO'],
  },
  {
    id: '8', title: 'بوابة العملاء', titleEn: 'Customer Portal',
    description: 'بوابة مخصصة للعملاء لمتابعة الشحنات، الفواتير، التقارير والشهادات مع لوحة تحكم شخصية.',
    duration: '1:08', thumbnail: '/thumbnails/ep8-cover.jpg',
    videoUrlDark: '/videos/ep8-dark.mp4', videoUrlLight: '/videos/ep8-light.mp4',
    status: 'available', episode: 8, season: 2, tags: ['عملاء', 'بوابة', 'خدمة ذاتية'],
  },
  {
    id: '9', title: 'تكامل الأنظمة والـ API', titleEn: 'API & System Integration',
    description: 'ربط iRecycle مع أنظمتك الحالية — ERP، المحاسبة، الخرائط وأنظمة إدارة الأسطول عبر API متكامل.',
    duration: '1:08', thumbnail: '/thumbnails/ep9-cover.jpg',
    videoUrlDark: '/videos/ep9-dark.mp4', videoUrlLight: '/videos/ep9-light.mp4',
    status: 'available', episode: 9, season: 2, tags: ['API', 'تكامل', 'ERP'],
  },
  {
    id: '10', title: 'أثر الاستدامة والـ ESG', titleEn: 'Sustainability & ESG Impact',
    description: 'قياس الأثر البيئي — تقارير ESG، البصمة الكربونية، شهادات الاستدامة ومعايير الاقتصاد الدائري.',
    duration: '1:15', thumbnail: '/thumbnails/ep10-cover.jpg',
    videoUrlDark: '/videos/ep10-dark.mp4', videoUrlLight: '/videos/ep10-light.mp4',
    status: 'available', episode: 10, season: 2, tags: ['استدامة', 'ESG', 'بيئة'],
  },
];

const getVideoUrl = (video: VideoItem, isDark: boolean): string | undefined => {
  if (video.videoUrlDark && video.videoUrlLight) {
    return isDark ? video.videoUrlDark : video.videoUrlLight;
  }
  return video.videoUrl;
};

const VideoSeries = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [collapsedSeasons, setCollapsedSeasons] = useState<number[]>([]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggleSeason = (num: number) => {
    setCollapsedSeasons(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

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
              {videos.filter(v => v.status === 'available').length} حلقة متاحة
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
              transition={{ delay: season.number * 0.15 }}
            >
              {/* Season Header */}
              <button
                onClick={() => toggleSeason(season.number)}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-l from-card to-card/60 border border-border/50 hover:border-primary/30 transition-all mb-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${season.color} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-lg">S{season.number}</span>
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold text-lg">الموسم {season.number}: {season.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{season.titleEn}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{season.style}</span>
                      <span className="text-xs text-muted-foreground">{seasonVideos.length} حلقات</span>
                    </div>
                  </div>
                </div>
                {isCollapsed ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronUp className="w-5 h-5 text-muted-foreground" />}
              </button>

              {/* Video Grid */}
              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {seasonVideos.map((video, idx) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={`group rounded-xl border overflow-hidden transition-all duration-300 ${
                        video.status === 'available'
                          ? 'border-primary/30 bg-card hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 cursor-pointer'
                          : 'border-border/50 bg-muted/20 opacity-70'
                      }`}
                      onClick={() => video.status === 'available' && setSelectedVideo(video)}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center overflow-hidden">
                        {video.thumbnail ? (
                          <img src={`${video.thumbnail}?v=5`} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : null}
                        {!video.thumbnail && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />}

                        {video.status === 'available' ? (
                          <div className="absolute top-3 left-3 z-10">
                            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 text-primary-foreground mr-[-1px]" />
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <Clock className="w-8 h-8 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-medium">قريباً</span>
                          </div>
                        )}

                        {!video.thumbnail && (
                          <>
                            <div className="absolute top-3 right-3 z-10">
                              <Badge variant="secondary" className="text-[10px] bg-black/70 text-white border-0 backdrop-blur-sm">
                                S{video.season} · الحلقة {video.episode}
                              </Badge>
                            </div>

                            {video.status === 'available' && (
                              <div className="absolute bottom-3 left-3 z-10">
                                <Badge variant="secondary" className="text-[10px] bg-black/70 text-white border-0 backdrop-blur-sm">
                                  {video.duration}
                                </Badge>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-sm mb-1">{video.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{video.description}</p>
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {video.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
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

        {/* Video Player Dialog */}
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">{selectedVideo?.title || 'فيديو'}</DialogTitle>
            {selectedVideo && (
              <div>
                <div className="aspect-video bg-black flex items-center justify-center">
                  {getVideoUrl(selectedVideo, isDark) ? (
                    <video src={getVideoUrl(selectedVideo, isDark)} controls autoPlay className="w-full h-full" />
                  ) : (
                    <div className="text-center text-white/60 flex flex-col items-center gap-3">
                      <Film className="w-16 h-16" />
                      <p className="text-sm">الفيديو جاري التحضير...</p>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px]">الموسم {selectedVideo.season}</Badge>
                    <Badge variant="outline" className="text-[10px]">الحلقة {selectedVideo.episode}</Badge>
                    <Badge variant="outline" className="text-[10px]">{selectedVideo.duration}</Badge>
                  </div>
                  <h2 className="text-lg font-bold mb-1">{selectedVideo.title}</h2>
                  <p className="text-xs text-muted-foreground mb-1">{selectedVideo.titleEn}</p>
                  <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LandingWrapper>
  );
};

export default VideoSeries;
