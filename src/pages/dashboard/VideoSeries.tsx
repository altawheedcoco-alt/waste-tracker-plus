import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Eye, Film, ChevronLeft } from 'lucide-react';
import LandingWrapper from '@/components/LandingWrapper';
import BackButton from '@/components/ui/back-button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl?: string;
  status: 'available' | 'coming_soon';
  episode: number;
  tags: string[];
}

const videos: VideoItem[] = [
  {
    id: '1',
    title: 'تعرّف على iRecycle',
    description: 'فيديو تعريفي شامل بالمنصة — واجهة المستخدم على اللابتوب والهاتف، لوحة التحكم، التقارير، تتبع الشاحنات، والأرقام والإحصائيات الحية. رحلة التحول الرقمي من الورق إلى الذكاء الاصطناعي.',
    duration: '0:45',
    thumbnail: '',
    videoUrl: '/videos/irecycle-series-ep1.mp4',
    status: 'available',
    episode: 1,
    tags: ['تعريف', 'المنصة', 'رقمنة'],
  },
  {
    id: '2',
    title: 'كيف تعمل الشحنات؟',
    description: 'شرح تفصيلي لدورة حياة الشحنة من الإنشاء حتى التسليم — التتبع المباشر، الإشعارات، وإصدار الفواتير الإلكترونية.',
    duration: 'قريباً',
    thumbnail: '',
    status: 'coming_soon',
    episode: 2,
    tags: ['شحنات', 'تتبع', 'فواتير'],
  },
  {
    id: '3',
    title: 'الذكاء الاصطناعي في iRecycle',
    description: 'كيف يساعدك الذكاء الاصطناعي في تحليل البيانات، التنبؤ بالطلب، وأتمتة العمليات اليومية.',
    duration: 'قريباً',
    thumbnail: '',
    status: 'coming_soon',
    episode: 3,
    tags: ['AI', 'تحليل', 'أتمتة'],
  },
  {
    id: '4',
    title: 'إدارة الأسطول والسائقين',
    description: 'نظام GPS المتقدم لتتبع الشاحنات، إدارة السائقين، وتحسين المسارات.',
    duration: 'قريباً',
    thumbnail: '',
    status: 'coming_soon',
    episode: 4,
    tags: ['أسطول', 'GPS', 'سائقين'],
  },
  {
    id: '5',
    title: 'التقارير ولوحة التحكم',
    description: 'استعراض لوحات التحكم التفاعلية والتقارير التلقائية — تحليل الأداء واتخاذ قرارات مبنية على البيانات.',
    duration: 'قريباً',
    thumbnail: '',
    status: 'coming_soon',
    episode: 5,
    tags: ['تقارير', 'داشبورد', 'بيانات'],
  },
];

const VideoSeries = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  return (
    <LandingWrapper>
      <div className="space-y-6 p-4 sm:p-6">
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
        </motion.div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((video, idx) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`group rounded-xl border overflow-hidden transition-all duration-300 ${
                video.status === 'available'
                  ? 'border-primary/30 bg-card hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 cursor-pointer'
                  : 'border-border/50 bg-muted/20 opacity-70'
              }`}
              onClick={() => video.status === 'available' && setSelectedVideo(video)}
            >
              {/* Thumbnail / Placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {video.status === 'available' ? (
                  <div className="relative z-10 w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-primary-foreground mr-[-2px]" />
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">قريباً</span>
                  </div>
                )}

                {/* Episode badge */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0">
                    الحلقة {video.episode}
                  </Badge>
                </div>

                {/* Duration */}
                {video.status === 'available' && (
                  <div className="absolute bottom-3 left-3 z-10">
                    <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0">
                      {video.duration}
                    </Badge>
                  </div>
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

        {/* Video Player Dialog */}
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            {selectedVideo && (
              <div>
                <div className="aspect-video bg-black flex items-center justify-center">
                  {selectedVideo.videoUrl ? (
                    <video src={selectedVideo.videoUrl} controls autoPlay className="w-full h-full" />
                  ) : (
                    <div className="text-center text-white/60 flex flex-col items-center gap-3">
                      <Film className="w-16 h-16" />
                      <p className="text-sm">الفيديو جاري التحضير...</p>
                      <p className="text-xs text-white/40">سيتم إضافة الفيديو هنا بعد الرندر</p>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold mb-1">{selectedVideo.title}</h2>
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
