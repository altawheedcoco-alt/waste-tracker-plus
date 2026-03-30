import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Film, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SkipBack, SkipForward, Pause, Volume2, VolumeX, Maximize, X, Search, Eye, CheckCircle2, Trophy, Sparkles, Tv, ListVideo } from 'lucide-react';
import { useTheme } from 'next-themes';
import LandingWrapper from '@/components/LandingWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

// Platform logo & Season banner images
import logoImg from '@/assets/irecycle-logo-premium-3d.webp';
import season1Banner from '@/assets/banners/season1-banner.jpg';
import season2Banner from '@/assets/banners/season2-banner.jpg';
import season3Banner from '@/assets/banners/season3-banner.jpg';
import season4Banner from '@/assets/banners/season4-banner.jpg';
import season5Banner from '@/assets/banners/season5-banner.jpg';
import season6Banner from '@/assets/banners/season6-banner.jpg';

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
  gradient: string;
  icon: string;
  bannerImage: string;
}

const seasonBanners: Record<number, string> = {
  1: season1Banner,
  2: season2Banner,
  3: season3Banner,
  4: season4Banner,
  5: season5Banner,
  6: season6Banner,
};

const seasons: SeasonInfo[] = [
  { number: 1, title: 'أساسيات المنصة', titleEn: 'Platform Essentials', style: 'Cinematic Minimal', color: 'from-emerald-500 to-teal-600', gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent', icon: '🌱', bannerImage: seasonBanners[1] },
  { number: 2, title: 'الميزات المتقدمة', titleEn: 'Advanced Features', style: 'Tech Product', color: 'from-cyan-500 to-blue-600', gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent', icon: '⚡', bannerImage: seasonBanners[2] },
  { number: 3, title: 'الأنظمة المتكاملة', titleEn: 'Integrated Systems', style: 'Clean Futuristic', color: 'from-indigo-500 to-purple-600', gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent', icon: '🔗', bannerImage: seasonBanners[3] },
  { number: 4, title: 'عالم الشحنات', titleEn: 'Shipments Deep Dive', style: 'Warm Cinematic', color: 'from-amber-500 to-orange-600', gradient: 'from-amber-500/20 via-orange-500/10 to-transparent', icon: '🚛', bannerImage: seasonBanners[4] },
  { number: 5, title: 'ذكاء المخلفات', titleEn: 'Waste Intelligence AI', style: 'Neural Digital', color: 'from-violet-500 to-fuchsia-600', gradient: 'from-violet-500/20 via-fuchsia-500/10 to-transparent', icon: '🧠', bannerImage: seasonBanners[5] },
  { number: 6, title: 'العمليات والأتمتة', titleEn: 'Operations & Automation', style: 'Cyber Industrial', color: 'from-orange-500 to-red-600', gradient: 'from-orange-500/20 via-red-500/10 to-transparent', icon: '⚙️', bannerImage: seasonBanners[6] },
];

const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/series-videos`;

const videos: VideoItem[] = [
  // === Season 1 ===
  { id: '1', title: 'تعرّف على iRecycle', titleEn: 'Meet iRecycle', description: 'فيديو تعريفي شامل بالمنصة — واجهة المستخدم، لوحة التحكم، التقارير، تتبع الشاحنات، والإحصائيات الحية.', duration: '0:45', thumbnail: '/thumbnails/ep1-cover.jpg', videoUrl: `${STORAGE_BASE}/irecycle-series-ep1.mp4`, status: 'available', episode: 1, season: 1, tags: ['تعريف', 'المنصة', 'رقمنة'] },
  { id: '2', title: 'كيف تعمل الشحنات؟', titleEn: 'How Shipments Work', description: 'دورة حياة الشحنة من الإنشاء حتى التسليم — التتبع المباشر، الإشعارات، الفوترة التلقائية وشهادات التخلص الآمن.', duration: '0:38', thumbnail: '/thumbnails/ep2-cover.jpg', videoUrlDark: `${STORAGE_BASE}/irecycle-series-ep2-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/irecycle-series-ep2-light.mp4`, status: 'available', episode: 2, season: 1, tags: ['شحنات', 'تتبع', 'فواتير'] },
  { id: '3', title: 'الذكاء الاصطناعي في iRecycle', titleEn: 'AI in iRecycle', description: 'تصنيف المخلفات، توليد المستندات، الوكيل الذكي، تحليل البيانات والتنبؤ بالطلب.', duration: '0:39', thumbnail: '/thumbnails/ep3-cover.jpg', videoUrlDark: `${STORAGE_BASE}/irecycle-series-ep3-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/irecycle-series-ep3-light.mp4`, status: 'available', episode: 3, season: 1, tags: ['AI', 'تحليل', 'أتمتة'] },
  { id: '4', title: 'إدارة الأسطول والسائقين', titleEn: 'Fleet Management', description: 'نظام GPS المتقدم لتتبع الشاحنات، إدارة السائقين، الخريطة الحية وصيانة الأسطول.', duration: '0:39', thumbnail: '/thumbnails/ep4-cover.jpg', videoUrlDark: `${STORAGE_BASE}/irecycle-series-ep4-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/irecycle-series-ep4-light.mp4`, status: 'available', episode: 4, season: 1, tags: ['أسطول', 'GPS', 'سائقين'] },
  { id: '5', title: 'التقارير ولوحة التحكم', titleEn: 'Reports & Dashboard', description: 'لوحات تحكم تفاعلية، تقارير شاملة PDF وExcel، تحليلات متقدمة، تصدير ومشاركة.', duration: '0:39', thumbnail: '/thumbnails/ep5-cover.jpg', videoUrlDark: `${STORAGE_BASE}/irecycle-series-ep5-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/irecycle-series-ep5-light.mp4`, status: 'available', episode: 5, season: 1, tags: ['تقارير', 'داشبورد', 'بيانات'] },
  // === Season 2 ===
  { id: '6', title: 'البورصة الرقمية للمخلفات', titleEn: 'Digital Waste Marketplace', description: 'سوق رقمي ذكي يربط المنشآت المولدة للمخلفات بالمصانع المعالجة — مطابقة ذكية، عروض أسعار فورية، عقود رقمية وتقييمات.', duration: '1:09', thumbnail: '/thumbnails/ep6-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep6-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep6-light.mp4`, status: 'available', episode: 6, season: 2, tags: ['بورصة', 'سوق رقمي', 'مطابقة'] },
  { id: '7', title: 'ضبط الجودة والفحص', titleEn: 'Quality Control & Inspection', description: 'نظام شامل لضبط جودة المخلفات — فحص بالذكاء الاصطناعي، معايير ISO، تصنيف آلي وشهادات جودة معتمدة.', duration: '1:06', thumbnail: '/thumbnails/ep7-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep7-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep7-light.mp4`, status: 'available', episode: 7, season: 2, tags: ['جودة', 'فحص', 'ISO'] },
  { id: '8', title: 'بوابة العملاء', titleEn: 'Customer Portal', description: 'بوابة مخصصة للعملاء لمتابعة الشحنات، الفواتير، التقارير والشهادات مع لوحة تحكم شخصية.', duration: '1:08', thumbnail: '/thumbnails/ep8-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep8-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep8-light.mp4`, status: 'available', episode: 8, season: 2, tags: ['عملاء', 'بوابة', 'خدمة ذاتية'] },
  { id: '9', title: 'تكامل الأنظمة والـ API', titleEn: 'API & System Integration', description: 'ربط iRecycle مع أنظمتك الحالية — ERP، المحاسبة، الخرائط وأنظمة إدارة الأسطول عبر API متكامل.', duration: '1:08', thumbnail: '/thumbnails/ep9-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep9-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep9-light.mp4`, status: 'available', episode: 9, season: 2, tags: ['API', 'تكامل', 'ERP'] },
  { id: '10', title: 'أثر الاستدامة والـ ESG', titleEn: 'Sustainability & ESG Impact', description: 'قياس الأثر البيئي — تقارير ESG، البصمة الكربونية، شهادات الاستدامة ومعايير الاقتصاد الدائري.', duration: '1:15', thumbnail: '/thumbnails/ep10-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep10-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep10-light.mp4`, status: 'available', episode: 10, season: 2, tags: ['استدامة', 'ESG', 'بيئة'] },
  // === Season 3 ===
  { id: '11', title: 'الإشعارات الذكية', titleEn: 'Smart Notifications', description: 'نظام تنبيهات متقدم يبقيك على اطلاع بكل تفاصيل عملياتك — إشعارات فورية، فلترة ذكية، أولويات تلقائية.', duration: '1:38', thumbnail: '/thumbnails/ep11-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep11-dark.mp4`, status: 'available', episode: 11, season: 3, tags: ['إشعارات', 'تنبيهات', 'AI'] },
  { id: '12', title: 'الإدارة المالية', titleEn: 'Financial Management', description: 'إدارة شاملة للفواتير والمدفوعات والتسويات المالية — فوترة تلقائية، تحليلات مالية، أمان متقدم.', duration: '1:39', thumbnail: '/thumbnails/ep12-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep12-dark.mp4`, status: 'available', episode: 12, season: 3, tags: ['مالية', 'فواتير', 'تحليلات'] },
  { id: '13', title: 'إدارة القوى العاملة', titleEn: 'Workforce Management', description: 'نظام شامل لإدارة فريق العمل والمهام والأداء — توزيع ذكي، تتبع جغرافي، تدريب وتطوير.', duration: '1:39', thumbnail: '/thumbnails/ep13-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep13-dark.mp4`, status: 'available', episode: 13, season: 3, tags: ['موظفين', 'مهام', 'أداء'] },
  { id: '14', title: 'مركز الاتصال الذكي', titleEn: 'Smart Call Center', description: 'إدارة متكاملة لخدمة العملاء — رد آلي بالذكاء الاصطناعي، CRM، دعم متعدد القنوات.', duration: '1:40', thumbnail: '/thumbnails/ep14-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep14-dark.mp4`, status: 'available', episode: 14, season: 3, tags: ['اتصالات', 'CRM', 'دعم'] },
  { id: '15', title: 'الامتثال والحوكمة', titleEn: 'Compliance & Governance', description: 'ضمان الالتزام بالمعايير الدولية — تدقيق رقمي، شهادات ISO، نظام إنذار مبكر.', duration: '1:40', thumbnail: '/thumbnails/ep15-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep15-dark.mp4`, status: 'available', episode: 15, season: 3, tags: ['امتثال', 'ISO', 'حوكمة'] },
  // === Season 4 ===
  { id: '16', title: 'دورة حياة الشحنة', titleEn: 'Shipment Lifecycle', description: 'رحلة الشحنة الكاملة من لحظة إنشائها حتى التسليم النهائي — المراحل، التتبع، التوثيق والتأكيد.', duration: '1:45', thumbnail: '/thumbnails/ep16-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep16-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep16-light.mp4`, status: 'available', episode: 16, season: 4, tags: ['شحنات', 'دورة حياة', 'تتبع'] },
  { id: '17', title: 'أنواع المخلفات', titleEn: 'Waste Types & Classification', description: 'تصنيف شامل لأنواع المخلفات — صناعية، عضوية، خطرة، إلكترونية — مع معايير الفرز والمعالجة.', duration: '1:45', thumbnail: '/thumbnails/ep17-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep17-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep17-light.mp4`, status: 'available', episode: 17, season: 4, tags: ['مخلفات', 'تصنيف', 'فرز'] },
  { id: '18', title: 'التوثيق الرقمي', titleEn: 'Digital Documentation', description: 'منظومة التوثيق الذكي — بوليصات الشحن، شهادات التخلص الآمن، صور الميزان والتوقيع الإلكتروني.', duration: '1:45', thumbnail: '/thumbnails/ep18-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep18-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep18-light.mp4`, status: 'available', episode: 18, season: 4, tags: ['توثيق', 'شهادات', 'بوليصة'] },
  { id: '19', title: 'الميزان الرقمي', titleEn: 'Digital Weighbridge', description: 'نظام الوزن الذكي المتكامل — ربط الميزان الإلكتروني، التحقق التلقائي، صور التوثيق والتقارير.', duration: '1:45', thumbnail: '/thumbnails/ep19-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep19-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep19-light.mp4`, status: 'available', episode: 19, season: 4, tags: ['ميزان', 'وزن', 'تحقق'] },
  { id: '20', title: 'التسعير الديناميكي', titleEn: 'Dynamic Pricing', description: 'محرك التسعير الذكي — أسعار حسب النوع والوزن والمسافة، عروض خاصة، فوترة تلقائية ومقارنة أسعار السوق.', duration: '1:45', thumbnail: '/thumbnails/ep20-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep20-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep20-light.mp4`, status: 'available', episode: 20, season: 4, tags: ['تسعير', 'فوترة', 'أسعار'] },
  { id: '21', title: 'التخلص الآمن', titleEn: 'Safe Disposal & Compliance', description: 'ضمان التخلص الآمن من المخلفات — شهادات بيئية، تتبع نهاية الدورة، تقارير الامتثال والأثر البيئي.', duration: '1:45', thumbnail: '/thumbnails/ep21-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep21-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep21-light.mp4`, status: 'available', episode: 21, season: 4, tags: ['تخلص آمن', 'بيئة', 'امتثال'] },
  // === Season 5 ===
  { id: '22', title: 'محرك الذكاء الاصطناعي', titleEn: 'AI Engine Overview', description: 'نظرة شاملة على محرك الذكاء الاصطناعي — النماذج المستخدمة، التدريب المستمر، والتكامل مع كافة أنظمة المنصة.', duration: '1:50', thumbnail: '/thumbnails/ep22-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep22-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep22-light.mp4`, status: 'available', episode: 22, season: 5, tags: ['AI', 'محرك ذكي', 'نماذج'] },
  { id: '23', title: 'التصنيف الذكي للمخلفات', titleEn: 'AI Waste Classification', description: 'تصنيف المخلفات بالرؤية الحاسوبية — تحليل الصور، التعرف على الأنواع، تحديد درجة الخطورة والتوصيات التلقائية.', duration: '1:50', thumbnail: '/thumbnails/ep23-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep23-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep23-light.mp4`, status: 'available', episode: 23, season: 5, tags: ['تصنيف', 'رؤية حاسوبية', 'خطورة'] },
  { id: '24', title: 'التنبؤ بالطلب', titleEn: 'Demand Forecasting', description: 'نظام التنبؤ الذكي — تحليل الاتجاهات، توقع كميات المخلفات، تحسين المسارات وتخطيط الموارد.', duration: '1:50', thumbnail: '/thumbnails/ep24-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep24-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep24-light.mp4`, status: 'available', episode: 24, season: 5, tags: ['تنبؤ', 'تخطيط', 'تحليل'] },
  { id: '25', title: 'الوكيل الذكي المحادثاتي', titleEn: 'Conversational AI Agent', description: 'وكيل ذكي يتحدث مع العملاء عبر واتساب وتليجرام — يأخذ الطلبات، يجيب الاستفسارات، ويصعّد للفريق البشري.', duration: '1:50', thumbnail: '/thumbnails/ep25-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep25-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep25-light.mp4`, status: 'available', episode: 25, season: 5, tags: ['وكيل ذكي', 'محادثات', 'واتساب'] },
  { id: '26', title: 'تحليلات ESG الذكية', titleEn: 'AI-Powered ESG Analytics', description: 'تقارير الاستدامة المدعومة بالذكاء الاصطناعي — حساب البصمة الكربونية، مقارنات السوق، وتوصيات التحسين.', duration: '1:50', thumbnail: '/thumbnails/ep26-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep26-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep26-light.mp4`, status: 'available', episode: 26, season: 5, tags: ['ESG', 'استدامة', 'كربون'] },
  { id: '27', title: 'مستقبل إدارة المخلفات', titleEn: 'Future of Waste Management', description: 'رؤية iRecycle للمستقبل — الروبوتات، IoT، الاقتصاد الدائري الكامل، وكيف ستتحول الصناعة بالتقنية.', duration: '1:50', thumbnail: '/thumbnails/ep27-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep27-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep27-light.mp4`, status: 'available', episode: 27, season: 5, tags: ['مستقبل', 'IoT', 'اقتصاد دائري'] },
  // === Season 6 ===
  { id: '28', title: 'أتمتة سير العمل', titleEn: 'Workflow Automation', description: 'قواعد ذكية تنفذ المهام تلقائياً — موافقات متسلسلة، إشعارات ذكية، تقارير دورية دون تدخل بشري.', duration: '1:50', thumbnail: '/thumbnails/ep28-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep28-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep28-light.mp4`, status: 'available', episode: 28, season: 6, tags: ['أتمتة', 'قواعد', 'موافقات'] },
  { id: '29', title: 'تحسين المسارات', titleEn: 'Route Optimization', description: 'خوارزميات ذكية لتحسين مسارات الجمع والنقل — توفير الوقود، تقليل الانبعاثات، تتبع حي.', duration: '1:50', thumbnail: '/thumbnails/ep29-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep29-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep29-light.mp4`, status: 'available', episode: 29, season: 6, tags: ['مسارات', 'GPS', 'وقود'] },
  { id: '30', title: 'الجدولة والتخطيط', titleEn: 'Scheduling & Planning', description: 'تخطيط ذكي لعمليات الجمع — جدولة تلقائية، تعيين الفرق، تذكيرات مسبقة وتحسين الموارد.', duration: '1:50', thumbnail: '/thumbnails/ep30-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep30-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep30-light.mp4`, status: 'available', episode: 30, season: 6, tags: ['جدولة', 'تخطيط', 'موارد'] },
  { id: '31', title: 'الأمان والصلاحيات', titleEn: 'Security & Access Control', description: 'حماية شاملة — مصادقة متعددة، أدوار وصلاحيات دقيقة، تشفير البيانات وسجل تدقيق كامل.', duration: '1:50', thumbnail: '/thumbnails/ep31-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep31-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep31-light.mp4`, status: 'available', episode: 31, season: 6, tags: ['أمان', 'صلاحيات', 'تشفير'] },
  { id: '32', title: 'العمليات الميدانية', titleEn: 'Mobile Field Operations', description: 'تطبيق PWA متكامل — توثيق بالكاميرا، تحديد الموقع، عمل بدون إنترنت ومزامنة تلقائية.', duration: '1:50', thumbnail: '/thumbnails/ep32-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep32-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep32-light.mp4`, status: 'available', episode: 32, season: 6, tags: ['ميداني', 'PWA', 'موبايل'] },
  { id: '33', title: 'تحليلات الأعمال', titleEn: 'Business Intelligence', description: 'لوحات تحكم حية، تحليل تنبؤي بالذكاء الاصطناعي، مقارنات أداء وتصدير تقارير متعددة الصيغ.', duration: '1:50', thumbnail: '/thumbnails/ep33-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep33-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep33-light.mp4`, status: 'available', episode: 33, season: 6, tags: ['تحليلات', 'BI', 'تقارير'] },
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

// Watched episodes from localStorage
const WATCHED_KEY = 'irecycle-watched-episodes';
const getWatchedEpisodes = (): Set<string> => {
  try {
    const stored = localStorage.getItem(WATCHED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
};
const markAsWatched = (id: string) => {
  const watched = getWatchedEpisodes();
  watched.add(id);
  localStorage.setItem(WATCHED_KEY, JSON.stringify([...watched]));
};

/* ─── Auto-play countdown ─── */
const CountdownTimer = ({ seconds, onComplete, onCancel }: { seconds: number; onComplete: () => void; onCancel: () => void }) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onComplete(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onComplete]);

  const progress = ((seconds - remaining) / seconds) * 100;

  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/20" />
        <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`} strokeLinecap="round" />
      </svg>
      <button onClick={onCancel} className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold hover:scale-110 transition-transform">
        {remaining}
      </button>
    </div>
  );
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
  onWatched,
}: {
  video: VideoItem;
  isDark: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  nextVideo: VideoItem | null;
  onWatched: (id: string) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [autoPlayCancelled, setAutoPlayCancelled] = useState(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const [isLoading, setIsLoading] = useState(true);
  const [buffered, setBuffered] = useState(0);

  const url = getVideoUrl(video, isDark);

  useEffect(() => {
    setShowEndScreen(false);
    setCurrentTime(0);
    setIsPlaying(true);
    setIsLoading(true);
    setAutoPlayCancelled(false);
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
    // Track buffered
    if (v.buffered.length > 0) {
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    }
    // Mark as watched at 80%
    if (v.duration > 0 && v.currentTime / v.duration > 0.8) {
      onWatched(video.id);
    }
  }, [video.id, onWatched]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setShowEndScreen(true);
    setShowControls(true);
    onWatched(video.id);
  }, [video.id, onWatched]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') skipForward();
      else if (e.key === 'ArrowLeft') skipBackward();
      else if (e.key === 'm') setIsMuted(m => !m);
      else if (e.key === 'f') toggleFullscreen();
      else if (e.key === 'Escape') onClose();
      else if (e.key === 'n' && hasNext) onNext();
      else if (e.key === 'p' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, skipForward, skipBackward, toggleFullscreen, onClose, onNext, onPrev, hasNext, hasPrev]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
        onMouseMove={handleMouseMove}
        onTouchStart={() => { setShowControls(true); hideControlsDelayed(); }}
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

          {/* End screen */}
          <AnimatePresence>
            {showEndScreen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-black/90 z-30 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center space-y-6 max-w-lg px-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                    <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
                  </motion.div>
                  <p className="text-white/60 text-sm">🎉 أحسنت! انتهت الحلقة {video.episode}</p>
                  
                  {nextVideo && !autoPlayCancelled ? (
                    <div className="space-y-4">
                      <h3 className="text-white text-xl font-bold">الحلقة التالية تبدأ خلال...</h3>
                      <div className="flex justify-center">
                        <CountdownTimer
                          seconds={8}
                          onComplete={onNext}
                          onCancel={() => setAutoPlayCancelled(true)}
                        />
                      </div>
                      
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
                    </div>
                  ) : nextVideo && autoPlayCancelled ? (
                    <div className="space-y-4">
                      <button
                        onClick={onNext}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                      >
                        <Play className="w-4 h-4 inline ml-2" />
                        تشغيل الحلقة التالية: {nextVideo.title}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
                      <h3 className="text-white text-xl font-bold">🎊 أنهيت السلسلة كاملة!</h3>
                      <p className="text-white/50 text-sm">شاهدت جميع الحلقات المتاحة</p>
                    </div>
                  )}

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
              {/* Progress bar with buffer */}
              <div
                className="group w-full h-2 bg-white/20 rounded-full cursor-pointer mb-3 relative hover:h-3 transition-all"
                onClick={handleSeek}
              >
                {/* Buffered */}
                <div className="absolute h-full bg-white/15 rounded-full" style={{ width: `${buffered}%` }} />
                {/* Progress */}
                <div className="h-full bg-primary rounded-full relative z-10" style={{ width: `${progress}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); skipBackward(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" title="رجوع 10 ثوانٍ">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); skipForward(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" title="تقديم 10 ثوانٍ">
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-white/70 text-xs font-mono min-w-[80px]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

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

/* ─── Stats Card ─── */
const StatCard = ({ icon: Icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  </div>
);

/* ─── Main Page ─── */
const VideoSeries = () => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [collapsedSeasons, setCollapsedSeasons] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(getWatchedEpisodes);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleWatched = useCallback((id: string) => {
    markAsWatched(id);
    setWatchedEpisodes(prev => new Set([...prev, id]));
  }, []);

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

  // Search filter
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return videos.filter(v =>
      v.title.includes(q) || v.titleEn.toLowerCase().includes(q) ||
      v.description.includes(q) || v.tags.some(t => t.includes(q))
    );
  }, [searchQuery]);

  // Calculate total duration
  const totalMinutes = useMemo(() => {
    let total = 0;
    videos.forEach(v => {
      const parts = v.duration.split(':');
      total += parseInt(parts[0]) * 60 + parseInt(parts[1]);
    });
    return total;
  }, []);

  const overallProgress = availableVideos.length > 0 ? (watchedEpisodes.size / availableVideos.length) * 100 : 0;

  return (
    <LandingWrapper>
      <Header />
      <div className="space-y-6 p-4 sm:p-6 pt-24 sm:pt-28 max-w-7xl mx-auto pb-20">
        <BackButton />

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-border/50 p-6 sm:p-8">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-2xl translate-x-1/4 translate-y-1/4" />
            
            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                  <Tv className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">سلسلة iRecycle</h1>
                  <p className="text-muted-foreground text-sm mt-1">تعرّف على المنصة خطوة بخطوة عبر سلسلة فيديوهات احترافية</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <StatCard icon={Film} value={availableVideos.length} label="حلقة متاحة" color="from-primary to-primary/60" />
                <StatCard icon={ListVideo} value={seasons.length} label="مواسم" color="from-violet-500 to-purple-600" />
                <StatCard icon={Clock} value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} label="إجمالي المدة" color="from-amber-500 to-orange-600" />
                <StatCard icon={Eye} value={watchedEpisodes.size} label="حلقة شاهدتها" color="from-emerald-500 to-teal-600" />
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">تقدمك في السلسلة</span>
                  <span className="font-bold text-primary">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-2.5" />
                {overallProgress === 100 && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs text-primary">
                    <Trophy className="w-4 h-4" />
                    <span className="font-bold">🎊 أحسنت! أنهيت السلسلة كاملة</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في الحلقات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-card border-border/50"
            />
          </div>
        </motion.div>

        {/* Search Results */}
        {filteredBySearch && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {filteredBySearch.length > 0 ? `${filteredBySearch.length} نتيجة` : 'لا توجد نتائج'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredBySearch.map((video, idx) => (
                <VideoCard key={video.id} video={video} idx={idx} openVideo={openVideo} isWatched={watchedEpisodes.has(video.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Seasons */}
        {!filteredBySearch && seasons.map((season) => {
          const seasonVideos = videos.filter(v => v.season === season.number);
          const isCollapsed = collapsedSeasons.includes(season.number);
          const watchedInSeason = seasonVideos.filter(v => watchedEpisodes.has(v.id)).length;
          const seasonProgress = (watchedInSeason / seasonVideos.length) * 100;

          return (
            <motion.div
              key={season.number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: season.number * 0.08 }}
            >
              <button
                onClick={() => toggleSeason(season.number)}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all mb-4 relative overflow-hidden"
              >
                {/* Season gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-l ${season.gradient} opacity-50`} />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${season.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <span className="text-2xl">{season.icon}</span>
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold text-base sm:text-lg">الموسم {season.number}: {season.title}</h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">{season.titleEn}</span>
                      <Badge variant="outline" className="text-[9px] h-5 px-1.5 border-primary/30 text-primary">
                        <Sparkles className="w-2.5 h-2.5 ml-1" />
                        {season.style}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{seasonVideos.length} حلقات</span>
                    </div>
                    {/* Season progress */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-l ${season.color} rounded-full transition-all`} style={{ width: `${seasonProgress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{watchedInSeason}/{seasonVideos.length}</span>
                      {seasonProgress === 100 && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                    </div>
                  </div>
                </div>
                <div className="relative z-10">
                  {isCollapsed ? <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                </div>
              </button>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    {/* Season Banner */}
                    <div className="mb-5 rounded-xl overflow-hidden border border-border/30 shadow-lg relative">
                      <img
                        src={season.bannerImage}
                        alt={`${season.titleEn} - Season ${season.number}`}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                        decoding="async"
                        width={1920}
                        height={640}
                        style={{ aspectRatio: '3/1' }}
                      />
                      <img src={logoImg} alt="" className="absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full opacity-80 shadow-md pointer-events-none" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
                      {seasonVideos.map((video, idx) => (
                        <VideoCard key={video.id} video={video} idx={idx} openVideo={openVideo} isWatched={watchedEpisodes.has(video.id)} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
          onWatched={handleWatched}
        />
      )}
    </LandingWrapper>
  );
};

/* ─── Video Card Component ─── */
const VideoCard = ({ video, idx, openVideo, isWatched }: { video: VideoItem; idx: number; openVideo: (v: VideoItem) => void; isWatched: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.04 }}
    className={`group rounded-xl border overflow-hidden transition-all ${
      video.status === 'available'
        ? 'border-border/50 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'
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
          width={320}
          height={180}
        />
      )}
      
      {video.status === 'available' ? (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg">
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
          <Clock className="w-6 h-6 text-white/70" />
          <span className="text-[10px] text-white/70">قريباً</span>
        </div>
      )}

      {/* iRecycle Logo Watermark */}
      <img src={logoImg} alt="" className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full opacity-75 shadow pointer-events-none z-10" />

      {/* Episode number */}
      <div className="absolute top-2 left-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white/90 backdrop-blur-sm">
          EP{video.episode}
        </span>
      </div>

      {/* Duration */}
      <div className="absolute bottom-2 right-2">
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white/90 backdrop-blur-sm">
          {video.duration}
        </span>
      </div>

      {/* Watched indicator */}
      {isWatched && (
        <div className="absolute bottom-2 left-2">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>

    {/* Info */}
    <div className="p-3">
      <h3 className="font-bold text-xs sm:text-sm line-clamp-1">{video.title}</h3>
      <p className="text-[10px] text-muted-foreground/80 mt-0.5">{video.titleEn}</p>
      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-1">{video.description}</p>
      <div className="flex gap-1 mt-2 flex-wrap">
        {video.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10">
            {tag}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
);

export default VideoSeries;
