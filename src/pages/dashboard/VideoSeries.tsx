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

// Platform logo
import logoImg from '@/assets/irecycle-logo-premium-3d.webp';

// Banners loaded lazily via dynamic imports to avoid bundling 2MB+ upfront
const bannerModules = import.meta.glob('@/assets/banners/season*-banner.webp', { eager: false, query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;
const getBannerUrl = (seasonNum: number): (() => Promise<string>) | undefined => {
  const key = Object.keys(bannerModules).find(k => k.includes(`season${seasonNum}-banner.webp`));
  return key ? bannerModules[key] : undefined;
};

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
}

const seasons: SeasonInfo[] = [
  { number: 1, title: 'أساسيات المنصة', titleEn: 'Platform Essentials', style: 'Cinematic Minimal', color: 'from-emerald-500 to-teal-600', gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent', icon: '🌱' },
  { number: 2, title: 'الميزات المتقدمة', titleEn: 'Advanced Features', style: 'Tech Product', color: 'from-cyan-500 to-blue-600', gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent', icon: '⚡' },
  { number: 3, title: 'الأنظمة المتكاملة', titleEn: 'Integrated Systems', style: 'Clean Futuristic', color: 'from-indigo-500 to-purple-600', gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent', icon: '🔗' },
  { number: 4, title: 'عالم الشحنات', titleEn: 'Shipments Deep Dive', style: 'Warm Cinematic', color: 'from-amber-500 to-orange-600', gradient: 'from-amber-500/20 via-orange-500/10 to-transparent', icon: '🚛' },
  { number: 5, title: 'ذكاء المخلفات', titleEn: 'Waste Intelligence AI', style: 'Neural Digital', color: 'from-violet-500 to-fuchsia-600', gradient: 'from-violet-500/20 via-fuchsia-500/10 to-transparent', icon: '🧠' },
  { number: 6, title: 'العمليات والأتمتة', titleEn: 'Operations & Automation', style: 'Cyber Industrial', color: 'from-orange-500 to-red-600', gradient: 'from-orange-500/20 via-red-500/10 to-transparent', icon: '⚙️' },
  { number: 7, title: 'إنترنت الأشياء والمستشعرات', titleEn: 'IoT & Smart Sensors', style: 'Neon Matrix', color: 'from-green-400 to-cyan-500', gradient: 'from-green-400/20 via-cyan-500/10 to-transparent', icon: '📡' },
  { number: 8, title: 'الإدارة المالية', titleEn: 'Financial Management', style: 'Gold Luxe', color: 'from-yellow-500 to-amber-600', gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent', icon: '💰' },
  { number: 9, title: 'الموارد البشرية', titleEn: 'HR & Workforce', style: 'Military Tactical', color: 'from-lime-600 to-green-700', gradient: 'from-lime-600/20 via-green-700/10 to-transparent', icon: '🎖️' },
  { number: 10, title: 'القانون والامتثال', titleEn: 'Legal & Compliance', style: 'Legal Blueprint', color: 'from-blue-700 to-indigo-800', gradient: 'from-blue-700/20 via-indigo-800/10 to-transparent', icon: '⚖️' },
  { number: 11, title: 'التكامل والربط', titleEn: 'Integration & Connectivity', style: 'Cosmic Network', color: 'from-purple-500 to-violet-600', gradient: 'from-purple-500/20 via-violet-600/10 to-transparent', icon: '🌌' },
  { number: 12, title: 'الرؤية المستقبلية', titleEn: 'Future Vision — Grand Finale', style: 'Holographic', color: 'from-cyan-500 to-rose-500', gradient: 'from-cyan-500/20 via-rose-500/10 to-transparent', icon: '🚀' },
  { number: 13, title: 'رحلة المنصة وتاريخها', titleEn: 'Platform Journey & History', style: 'Warm Chronicle', color: 'from-amber-500 to-yellow-600', gradient: 'from-amber-500/20 via-yellow-600/10 to-transparent', icon: '📖' },
  { number: 14, title: 'تاريخ التدوير عالمياً', titleEn: 'Global Recycling History', style: 'Vintage Earth', color: 'from-green-600 to-emerald-700', gradient: 'from-green-600/20 via-emerald-700/10 to-transparent', icon: '🌍' },
  { number: 15, title: 'الميزات الداخلية المتقدمة', titleEn: 'Advanced Internal Features', style: 'Electric Blueprint', color: 'from-blue-500 to-indigo-600', gradient: 'from-blue-500/20 via-indigo-600/10 to-transparent', icon: '⚡' },
  { number: 16, title: 'قصص نجاح وتأثير بيئي', titleEn: 'Success Stories & Impact', style: 'Green Gold', color: 'from-green-500 to-yellow-500', gradient: 'from-green-500/20 via-yellow-500/10 to-transparent', icon: '🏆' },
  { number: 17, title: 'اليوم العالمي للبيئة', titleEn: 'World Environment Day', style: 'Earth Celebration', color: 'from-teal-500 to-green-600', gradient: 'from-teal-500/20 via-green-600/10 to-transparent', icon: '🌎' },
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
  // === Season 7 ===
  { id: '34', title: 'الحاويات الذكية', titleEn: 'Smart Bins & IoT Sensors', description: 'حاويات متصلة بالإنترنت تراقب المستوى والحرارة والوزن لحظياً عبر مستشعرات LoRaWAN وطاقة شمسية.', duration: '1:50', thumbnail: '/thumbnails/ep34-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep34-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep34-light.mp4`, status: 'available', episode: 34, season: 7, tags: ['IoT', 'مستشعرات', 'حاويات'] },
  { id: '35', title: 'تتبع الأسطول الذكي', titleEn: 'Fleet Telematics & GPS', description: 'نظام متكامل لتتبع المركبات بدقة GPS عالية — تشخيص OBD-II، إدارة الوقود، تنبيهات القيادة.', duration: '1:50', thumbnail: '/thumbnails/ep35-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep35-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep35-light.mp4`, status: 'available', episode: 35, season: 7, tags: ['GPS', 'أسطول', 'تتبع'] },
  { id: '36', title: 'المستشعرات البيئية', titleEn: 'Environmental Monitoring', description: 'مراقبة جودة الهواء والمياه والتربة حول مواقع إدارة المخلفات بمستشعرات ذكية ٢٤/٧.', duration: '1:50', thumbnail: '/thumbnails/ep36-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep36-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep36-light.mp4`, status: 'available', episode: 36, season: 7, tags: ['بيئة', 'مراقبة', 'هواء'] },
  { id: '37', title: 'التحليلات التنبؤية', titleEn: 'Predictive IoT Analytics', description: 'خوارزميات تعلم الآلة تتنبأ بالصيانة والامتلاء — نماذج متقدمة بدقة ٩٥٪ لمدة ٧ أيام قادمة.', duration: '1:50', thumbnail: '/thumbnails/ep37-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep37-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep37-light.mp4`, status: 'available', episode: 37, season: 7, tags: ['تنبؤ', 'ML', 'صيانة'] },
  { id: '38', title: 'الحوسبة الطرفية', titleEn: 'Edge Computing & Local AI', description: 'معالجة البيانات محلياً على الأجهزة لقرارات فورية بدون تأخير الشبكة — عمل بلا إنترنت.', duration: '1:50', thumbnail: '/thumbnails/ep38-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep38-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep38-light.mp4`, status: 'available', episode: 38, season: 7, tags: ['Edge', 'حوسبة', 'محلي'] },
  { id: '39', title: 'التوائم الرقمية', titleEn: 'Digital Twins & Simulation', description: 'نسخة رقمية حية من كل أصل مادي — محاكاة سيناريوهات، صيانة افتراضية، تحسين مستمر.', duration: '1:50', thumbnail: '/thumbnails/ep39-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep39-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep39-light.mp4`, status: 'available', episode: 39, season: 7, tags: ['توأم رقمي', 'محاكاة', '3D'] },
  // === Season 8 ===
  { id: '40', title: 'الفوترة الذكية', titleEn: 'Smart Invoicing & Billing', description: 'نظام فوترة آلي متكامل مع بوابات الدفع الإلكتروني — ضريبة، خصومات، شروط دفع.', duration: '1:50', thumbnail: '/thumbnails/ep40-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep40-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep40-light.mp4`, status: 'available', episode: 40, season: 8, tags: ['فوترة', 'دفع', 'مالية'] },
  { id: '41', title: 'تحليل التكاليف', titleEn: 'Cost Analysis & Budgeting', description: 'أدوات متقدمة لتحليل التكاليف التشغيلية وتخطيط الميزانيات مع تنبؤ AI.', duration: '1:50', thumbnail: '/thumbnails/ep41-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep41-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep41-light.mp4`, status: 'available', episode: 41, season: 8, tags: ['تكاليف', 'ميزانية', 'تحليل'] },
  { id: '42', title: 'الضرائب والامتثال المالي', titleEn: 'Tax & Financial Compliance', description: 'نظام ضريبي متكامل يدعم الفاتورة الإلكترونية ومعايير المحاسبة الدولية IFRS.', duration: '1:50', thumbnail: '/thumbnails/ep42-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep42-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep42-light.mp4`, status: 'available', episode: 42, season: 8, tags: ['ضرائب', 'فاتورة إلكترونية', 'IFRS'] },
  { id: '43', title: 'حسابات الشركاء', titleEn: 'Partner Accounts & Settlements', description: 'إدارة مالية شاملة لحسابات الشركاء — كشوف حساب، تسويات آلية، عقود.', duration: '1:50', thumbnail: '/thumbnails/ep43-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep43-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep43-light.mp4`, status: 'available', episode: 43, season: 8, tags: ['شركاء', 'تسويات', 'حسابات'] },
  { id: '44', title: 'المحفظة الرقمية', titleEn: 'Digital Wallet & Payments', description: 'محفظة إلكترونية متكاملة للسائقين والعملاء — رصيد فوري، تحويلات، سحب للبنك.', duration: '1:50', thumbnail: '/thumbnails/ep44-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep44-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep44-light.mp4`, status: 'available', episode: 44, season: 8, tags: ['محفظة', 'دفع', 'تحويل'] },
  { id: '45', title: 'التقارير المالية المتقدمة', titleEn: 'Advanced Financial Reports', description: 'تقارير مالية شاملة بصيغ متعددة — لوحة حية، تقارير دورية، مقارنات مالية.', duration: '1:50', thumbnail: '/thumbnails/ep45-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep45-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep45-light.mp4`, status: 'available', episode: 45, season: 8, tags: ['تقارير', 'مالية', 'تحليل'] },
  // === Season 9 ===
  { id: '46', title: 'التوظيف الذكي', titleEn: 'Smart Recruitment', description: 'نظام توظيف متكامل يربط المنشآت بالكفاءات المتخصصة في إدارة المخلفات.', duration: '1:50', thumbnail: '/thumbnails/ep46-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep46-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep46-light.mp4`, status: 'available', episode: 46, season: 9, tags: ['توظيف', 'مرشحين', 'عقود'] },
  { id: '47', title: 'أكاديمية التدريب', titleEn: 'Training Academy', description: 'منصة تعليمية متكاملة لتأهيل العاملين — دورات، شهادات، تعلم متنقل.', duration: '1:50', thumbnail: '/thumbnails/ep47-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep47-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep47-light.mp4`, status: 'available', episode: 47, season: 9, tags: ['تدريب', 'شهادات', 'تعلم'] },
  { id: '48', title: 'إدارة الورديات', titleEn: 'Shift Management', description: 'تنظيم ذكي للورديات مع حضور وانصراف وإدارة الإجازات.', duration: '1:50', thumbnail: '/thumbnails/ep48-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep48-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep48-light.mp4`, status: 'available', episode: 48, season: 9, tags: ['ورديات', 'حضور', 'إجازات'] },
  { id: '49', title: 'السلامة المهنية', titleEn: 'Safety & HSE', description: 'منظومة شاملة لإدارة الصحة والسلامة والبيئة في مواقع العمل.', duration: '1:50', thumbnail: '/thumbnails/ep49-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep49-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep49-light.mp4`, status: 'available', episode: 49, season: 9, tags: ['سلامة', 'HSE', 'حوادث'] },
  { id: '50', title: 'الرواتب والمزايا', titleEn: 'Payroll & Benefits', description: 'نظام رواتب آلي متكامل مع حساب المكافآت والخصومات والتأمينات.', duration: '1:50', thumbnail: '/thumbnails/ep50-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep50-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep50-light.mp4`, status: 'available', episode: 50, season: 9, tags: ['رواتب', 'تأمينات', 'مكافآت'] },
  { id: '51', title: 'تحليلات الموارد البشرية', titleEn: 'HR Analytics', description: 'لوحات تحكم ذكية تكشف أنماط الأداء وتساعد في اتخاذ القرارات.', duration: '1:50', thumbnail: '/thumbnails/ep51-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep51-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep51-light.mp4`, status: 'available', episode: 51, season: 9, tags: ['تحليلات', 'أداء', 'HR'] },
  // === Season 10 ===
  { id: '52', title: 'العقود الرقمية', titleEn: 'Digital Contracts', description: 'إدارة شاملة لدورة حياة العقود — صياغة، توقيع إلكتروني، تجديد تلقائي.', duration: '1:50', thumbnail: '/thumbnails/ep52-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep52-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep52-light.mp4`, status: 'available', episode: 52, season: 10, tags: ['عقود', 'توقيع', 'قانون'] },
  { id: '53', title: 'الامتثال التنظيمي', titleEn: 'Regulatory Compliance', description: 'ضمان الالتزام بالقوانين البيئية المحلية والدولية تلقائياً.', duration: '1:50', thumbnail: '/thumbnails/ep53-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep53-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep53-light.mp4`, status: 'available', episode: 53, season: 10, tags: ['امتثال', 'قوانين', 'تراخيص'] },
  { id: '54', title: 'سجل التدقيق', titleEn: 'Audit Trail', description: 'سجل رقمي غير قابل للتلاعب لكل عملية ومعاملة في النظام.', duration: '1:50', thumbnail: '/thumbnails/ep54-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep54-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep54-light.mp4`, status: 'available', episode: 54, season: 10, tags: ['تدقيق', 'أدلة', 'سجلات'] },
  { id: '55', title: 'حماية البيانات', titleEn: 'Data Privacy & GDPR', description: 'حماية شاملة للبيانات الشخصية وفقاً للمعايير الدولية.', duration: '1:50', thumbnail: '/thumbnails/ep55-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep55-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep55-light.mp4`, status: 'available', episode: 55, season: 10, tags: ['خصوصية', 'GDPR', 'تشفير'] },
  { id: '56', title: 'التأمين والمسؤولية', titleEn: 'Insurance & Liability', description: 'إدارة شاملة لبوالص التأمين والمسؤولية القانونية.', duration: '1:50', thumbnail: '/thumbnails/ep56-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep56-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep56-light.mp4`, status: 'available', episode: 56, season: 10, tags: ['تأمين', 'مسؤولية', 'مطالبات'] },
  { id: '57', title: 'حل النزاعات', titleEn: 'Dispute Resolution', description: 'نظام ذكي لإدارة النزاعات التجارية والتحكيم الإلكتروني.', duration: '1:50', thumbnail: '/thumbnails/ep57-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep57-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep57-light.mp4`, status: 'available', episode: 57, season: 10, tags: ['نزاعات', 'تحكيم', 'وساطة'] },
  // === Season 11 ===
  { id: '58', title: 'تكامل ERP', titleEn: 'ERP Integration', description: 'ربط سلس مع أنظمة SAP وOracle وMicrosoft Dynamics.', duration: '1:50', thumbnail: '/thumbnails/ep58-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep58-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep58-light.mp4`, status: 'available', episode: 58, season: 11, tags: ['ERP', 'SAP', 'تكامل'] },
  { id: '59', title: 'البوابات الحكومية', titleEn: 'Government Portals', description: 'ربط مباشر مع الأنظمة الحكومية والبيئية الرقابية.', duration: '1:50', thumbnail: '/thumbnails/ep59-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep59-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep59-light.mp4`, status: 'available', episode: 59, season: 11, tags: ['حكومي', 'تصاريح', 'تقارير'] },
  { id: '60', title: 'الخرائط ونظم GIS', titleEn: 'Maps & GIS', description: 'نظام معلومات جغرافية متكامل لإدارة المواقع والمسارات.', duration: '1:50', thumbnail: '/thumbnails/ep60-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep60-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep60-light.mp4`, status: 'available', episode: 60, season: 11, tags: ['خرائط', 'GIS', 'مواقع'] },
  { id: '61', title: 'محرك Webhooks', titleEn: 'Webhook Engine', description: 'نظام أحداث قوي يربط iRecycle بأي نظام خارجي تلقائياً.', duration: '1:50', thumbnail: '/thumbnails/ep61-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep61-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep61-light.mp4`, status: 'available', episode: 61, season: 11, tags: ['Webhooks', 'أحداث', 'ربط'] },
  { id: '62', title: 'سوق التطبيقات', titleEn: 'API Marketplace', description: 'سوق تطبيقات مفتوح يتيح للمطورين بناء حلول متكاملة.', duration: '1:50', thumbnail: '/thumbnails/ep62-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep62-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep62-light.mp4`, status: 'available', episode: 62, season: 11, tags: ['API', 'مطورين', 'تطبيقات'] },
  { id: '63', title: 'البنية متعددة المستأجرين', titleEn: 'Multi-Tenant Architecture', description: 'بنية سحابية قابلة للتوسع تخدم آلاف المنشآت بعزل كامل.', duration: '1:50', thumbnail: '/thumbnails/ep63-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep63-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep63-light.mp4`, status: 'available', episode: 63, season: 11, tags: ['سحابة', 'بنية', 'توسع'] },
  // === Season 12 ===
  { id: '64', title: 'الروبوتات والأتمتة', titleEn: 'Robotics & Automation', description: 'روبوتات ذكية تعمل بشكل مستقل في فرز ومعالجة المخلفات.', duration: '1:50', thumbnail: '/thumbnails/ep64-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep64-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep64-light.mp4`, status: 'available', episode: 64, season: 12, tags: ['روبوتات', 'أتمتة', 'فرز'] },
  { id: '65', title: 'البلوكشين وكربون كريدت', titleEn: 'Blockchain & Carbon Credits', description: 'تتبع شفاف وغير قابل للتلاعب لدورة حياة كل طن مخلفات.', duration: '1:50', thumbnail: '/thumbnails/ep65-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep65-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep65-light.mp4`, status: 'available', episode: 65, season: 12, tags: ['بلوكشين', 'كربون', 'شفافية'] },
  { id: '66', title: 'الاقتصاد الدائري', titleEn: 'Circular Economy', description: 'تحويل المخلفات من مشكلة إلى مورد اقتصادي بقيمة تريليون دولار.', duration: '1:50', thumbnail: '/thumbnails/ep66-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep66-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep66-light.mp4`, status: 'available', episode: 66, season: 12, tags: ['اقتصاد دائري', 'صفر نفايات', 'تدوير'] },
  { id: '67', title: 'المدن الذكية', titleEn: 'Smart Cities', description: 'iRecycle كعمود فقري لإدارة المخلفات في مدن المستقبل.', duration: '1:50', thumbnail: '/thumbnails/ep67-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep67-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep67-light.mp4`, status: 'available', episode: 67, season: 12, tags: ['مدن ذكية', 'مواطنين', 'بيئة'] },
  { id: '68', title: 'الحوسبة الكمية', titleEn: 'Quantum Computing', description: 'استخدام قوة الحوسبة الكمية لحل أعقد مشاكل إدارة المخلفات.', duration: '1:50', thumbnail: '/thumbnails/ep68-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep68-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep68-light.mp4`, status: 'available', episode: 68, season: 12, tags: ['كمي', 'تحسين', 'مستقبل'] },
  { id: '69', title: 'الختام الكبير', titleEn: 'The Grand Finale', description: '١٢ موسم • ٦٩ حلقة • رحلة شاملة في مستقبل إدارة المخلفات الذكية.', duration: '2:00', thumbnail: '/thumbnails/ep69-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep69-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep69-light.mp4`, status: 'available', episode: 69, season: 12, tags: ['ختام', 'رؤية 2030', 'مستقبل'] },
  // === Season 13: Platform Journey ===
  { id: '70', title: 'ولادة المنصة', titleEn: 'The Birth of iRecycle', description: 'كيف بدأت فكرة iRecycle من مشكلة حقيقية — أول سطر كود، الرؤية الأولى، ومن فكرة إلى منتج.', duration: '1:50', thumbnail: '/thumbnails/ep70-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep70-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep70-light.mp4`, status: 'available', episode: 70, season: 13, tags: ['تأسيس', 'رؤية', 'بداية'] },
  { id: '71', title: 'محطات النمو', titleEn: 'Growth Milestones', description: 'من أول عميل إلى آلاف الشحنات — محطات النمو والتوسع الإقليمي والجوائز.', duration: '1:50', thumbnail: '/thumbnails/ep71-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep71-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep71-light.mp4`, status: 'available', episode: 71, season: 13, tags: ['نمو', 'عملاء', 'توسع'] },
  { id: '72', title: 'فريق العمل', titleEn: 'The Team Behind iRecycle', description: 'المؤسسون، فريق التطوير، فريق الدعم، وثقافة العمل في iRecycle.', duration: '1:50', thumbnail: '/thumbnails/ep72-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep72-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep72-light.mp4`, status: 'available', episode: 72, season: 13, tags: ['فريق', 'ثقافة', 'قيادة'] },
  { id: '73', title: 'التطور التقني', titleEn: 'Technical Evolution', description: 'من ويب بسيط إلى PWA متكامل — دمج AI، البنية السحابية، والأمان المتقدم.', duration: '1:50', thumbnail: '/thumbnails/ep73-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep73-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep73-light.mp4`, status: 'available', episode: 73, season: 13, tags: ['تطوير', 'PWA', 'سحابة'] },
  { id: '74', title: 'سجل الإصدارات', titleEn: 'Version History & Changelog', description: 'رحلة من v1 الأساسي إلى v5 الذكاء السيادي — كل قفزة وتطور.', duration: '1:50', thumbnail: '/thumbnails/ep74-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep74-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep74-light.mp4`, status: 'available', episode: 74, season: 13, tags: ['إصدارات', 'تغييرات', 'تطوير'] },
  { id: '75', title: 'خارطة المستقبل', titleEn: 'Future Roadmap 2025-2030', description: 'التوسع العالمي، الأتمتة الكاملة، صفر نفايات، وشراكات المدن الذكية.', duration: '1:50', thumbnail: '/thumbnails/ep75-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep75-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep75-light.mp4`, status: 'available', episode: 75, season: 13, tags: ['مستقبل', 'خطة', '2030'] },
  // === Season 14: Global Recycling History ===
  { id: '76', title: 'التدوير عبر التاريخ', titleEn: 'Recycling Through the Ages', description: 'من الحضارات القديمة إلى إعادة صهر المعادن — كيف كان التدوير جزءاً من الحياة.', duration: '1:50', thumbnail: '/thumbnails/ep76-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep76-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep76-light.mp4`, status: 'available', episode: 76, season: 14, tags: ['تاريخ', 'حضارات', 'معادن'] },
  { id: '77', title: 'الثورة الصناعية', titleEn: 'Industrial Revolution & Waste', description: 'انفجار النفايات مع التصنيع — أول أنظمة الجمع وتدوير الورق.', duration: '1:50', thumbnail: '/thumbnails/ep77-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep77-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep77-light.mp4`, status: 'available', episode: 77, season: 14, tags: ['صناعة', 'ورق', 'جمع'] },
  { id: '78', title: 'التدوير الحديث', titleEn: 'Modern Recycling Movement', description: 'رمز التدوير ١٩٧٠، يوم الأرض، فرز المواد، والتشريعات البيئية.', duration: '1:50', thumbnail: '/thumbnails/ep78-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep78-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep78-light.mp4`, status: 'available', episode: 78, season: 14, tags: ['حديث', 'تشريعات', 'فرز'] },
  { id: '79', title: 'التحول الرقمي', titleEn: 'Digital Transformation in Waste', description: 'تطبيقات ذكية، مستشعرات IoT، فرز آلي، وبيانات ضخمة.', duration: '1:50', thumbnail: '/thumbnails/ep79-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep79-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep79-light.mp4`, status: 'available', episode: 79, season: 14, tags: ['رقمي', 'IoT', 'بيانات'] },
  { id: '80', title: 'رواد التدوير عالمياً', titleEn: 'Global Recycling Leaders', description: 'ألمانيا ٦٥٪، اليابان صفر نفايات، السويد طاقة من النفايات، ومصر الفرصة الكبرى.', duration: '1:50', thumbnail: '/thumbnails/ep80-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep80-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep80-light.mp4`, status: 'available', episode: 80, season: 14, tags: ['عالمي', 'قادة', 'إحصائيات'] },
  { id: '81', title: 'مستقبل الاقتصاد الدائري', titleEn: 'The Circular Future', description: 'من خطي إلى دائري — اقتصاد التريليون، مواد حيوية، وكوكب خالٍ من النفايات.', duration: '1:50', thumbnail: '/thumbnails/ep81-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep81-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep81-light.mp4`, status: 'available', episode: 81, season: 14, tags: ['اقتصاد دائري', 'مواد حيوية', 'مستقبل'] },
  // === Season 15: Advanced Internal Features ===
  { id: '82', title: 'مركز قيادة الذكاء', titleEn: 'AI Command Center', description: 'تصنيف ذكي بالصور، تنبؤ بالطلب، الوكيل المحادثاتي، وتوليد المستندات.', duration: '1:50', thumbnail: '/thumbnails/ep82-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep82-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep82-light.mp4`, status: 'available', episode: 82, season: 15, tags: ['AI', 'تصنيف', 'تنبؤ'] },
  { id: '83', title: 'التقارير المتقدمة', titleEn: 'Advanced Reporting Suite', description: 'تقارير PDF/Excel، تحليلات تفاعلية، تقارير دورية آلية، مشاركة وتصدير.', duration: '1:50', thumbnail: '/thumbnails/ep83-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep83-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep83-light.mp4`, status: 'available', episode: 83, season: 15, tags: ['تقارير', 'PDF', 'تحليلات'] },
  { id: '84', title: 'ذكاء الأسطول', titleEn: 'Fleet Intelligence System', description: 'تتبع GPS حي، إدارة الوقود، الصيانة التنبؤية، ورادار القرب.', duration: '1:50', thumbnail: '/thumbnails/ep84-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep84-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep84-light.mp4`, status: 'available', episode: 84, season: 15, tags: ['أسطول', 'GPS', 'صيانة'] },
  { id: '85', title: 'محرك المحاسبة', titleEn: 'Accounting Engine', description: 'دفتر الأستاذ الذكي، الفاتورة الإلكترونية، بوابات الدفع، ولوحة مالية حية.', duration: '1:50', thumbnail: '/thumbnails/ep85-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep85-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep85-light.mp4`, status: 'available', episode: 85, season: 15, tags: ['محاسبة', 'فواتير', 'دفع'] },
  { id: '86', title: 'مركز الإشعارات', titleEn: 'Notification Hub', description: 'إشعارات فورية، بريد تلقائي، تنبيهات صوتية، وأولويات ذكية.', duration: '1:50', thumbnail: '/thumbnails/ep86-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep86-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep86-light.mp4`, status: 'available', episode: 86, season: 15, tags: ['إشعارات', 'تنبيهات', 'بريد'] },
  { id: '87', title: 'أمان المنصة', titleEn: 'Platform Security Deep Dive', description: 'تشفير شامل، مصادقة متعددة، سجل التدقيق، والصلاحيات المتقدمة.', duration: '1:50', thumbnail: '/thumbnails/ep87-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep87-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep87-light.mp4`, status: 'available', episode: 87, season: 15, tags: ['أمان', 'تشفير', 'صلاحيات'] },
  // === Season 16: Success Stories & Impact ===
  { id: '88', title: 'قصة مصنع ناجح', titleEn: 'Factory Success Story', description: 'تقليل التكاليف ٤٠٪، توفير الوقت ٦٠٪، صفر أوراق، وشهادة ISO.', duration: '1:50', thumbnail: '/thumbnails/ep88-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep88-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep88-light.mp4`, status: 'available', episode: 88, season: 16, tags: ['مصنع', 'توفير', 'نجاح'] },
  { id: '89', title: 'رحلة ناقل', titleEn: "Transporter's Digital Journey", description: 'من الورقة للشاشة — تحسين المسارات، زيادة الأرباح، وتقييم ٥ نجوم.', duration: '1:50', thumbnail: '/thumbnails/ep89-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep89-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep89-light.mp4`, status: 'available', episode: 89, season: 16, tags: ['ناقل', 'رقمنة', 'أرباح'] },
  { id: '90', title: 'أثر المُدوِّر', titleEn: "Recycler's Environmental Impact", description: '١٠٠٠ طن مدورة، ٥٠٠ شجرة محفوظة، مليون لتر مياه، وتقرير ESG معتمد.', duration: '1:50', thumbnail: '/thumbnails/ep90-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep90-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep90-light.mp4`, status: 'available', episode: 90, season: 16, tags: ['تدوير', 'بيئة', 'أثر'] },
  { id: '91', title: 'خفض الكربون', titleEn: 'Carbon Footprint Reduction', description: 'خفض CO2 بنسبة ٣٥٪، طاقة متجددة، مصانع خضراء، وأرصدة كربونية.', duration: '1:50', thumbnail: '/thumbnails/ep91-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep91-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep91-light.mp4`, status: 'available', episode: 91, season: 16, tags: ['كربون', 'طاقة', 'أخضر'] },
  { id: '92', title: 'الأثر المجتمعي', titleEn: 'Community & Social Impact', description: '١٠٠٠ وظيفة جديدة، برامج تدريبية، أحياء نظيفة، ووعي بيئي.', duration: '1:50', thumbnail: '/thumbnails/ep92-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep92-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep92-light.mp4`, status: 'available', episode: 92, season: 16, tags: ['مجتمع', 'وظائف', 'وعي'] },
  { id: '93', title: 'رؤية ٢٠٣٠', titleEn: 'Vision 2030 — A Greener World', description: 'أهداف التنمية المستدامة، شراكات عالمية، التوسع القادم، وعالم أنظف.', duration: '2:00', thumbnail: '/thumbnails/ep93-cover.jpg', videoUrlDark: `${STORAGE_BASE}/ep93-dark.mp4`, videoUrlLight: `${STORAGE_BASE}/ep93-light.mp4`, status: 'available', episode: 93, season: 16, tags: ['2030', 'SDGs', 'عالمي'] },
  // === Season 17: World Environment Day ===
  { id: '94', title: 'يوم البيئة ٢٠٢٢ — أرض واحدة', titleEn: 'WED 2022 — Only One Earth', description: 'اليوم العالمي للبيئة ٢٠٢٢ بعنوان "أرض واحدة فقط" من السويد — استضافة مصر لمؤتمر COP27 وإطلاق خطة الاستثمار المناخي.', duration: '1:00', thumbnail: '/thumbnails/ep94-cover.jpg', videoUrl: `${STORAGE_BASE}/wed/wed-2022.mp4`, status: 'available', episode: 94, season: 17, tags: ['بيئة', 'COP27', '2022'] },
  { id: '95', title: 'يوم البيئة ٢٠٢٣ — تلوث البلاستيك', titleEn: 'WED 2023 — Beat Plastic Pollution', description: 'اليوم العالمي للبيئة ٢٠٢٣ بعنوان "القضاء على التلوث البلاستيكي" — استراتيجية مصر لإدارة المخلفات ومنصة NWFE.', duration: '1:00', thumbnail: '/thumbnails/ep95-cover.jpg', videoUrl: `${STORAGE_BASE}/wed/wed-2023.mp4`, status: 'available', episode: 95, season: 17, tags: ['بلاستيك', 'بيئة', '2023'] },
  { id: '96', title: 'يوم البيئة ٢٠٢٤ — استعادة الأراضي', titleEn: 'WED 2024 — Land Restoration', description: 'اليوم العالمي للبيئة ٢٠٢٤ بعنوان "استعادة الأراضي" — مشروع الدلتا الجديدة ومبادرة ١٠٠ مليون شجرة في مصر.', duration: '1:00', thumbnail: '/thumbnails/ep96-cover.jpg', videoUrl: `${STORAGE_BASE}/wed/wed-2024.mp4`, status: 'available', episode: 96, season: 17, tags: ['أراضي', 'تشجير', '2024'] },
  { id: '97', title: 'يوم البيئة ٢٠٢٥ — الاقتصاد الدائري', titleEn: 'WED 2025 — Circular Economy', description: 'اليوم العالمي للبيئة ٢٠٢٥ بعنوان "الاقتصاد الدائري" من كوريا الجنوبية — التحول الرقمي الأخضر ومنصة iRecycle.', duration: '1:00', thumbnail: '/thumbnails/ep97-cover.jpg', videoUrl: `${STORAGE_BASE}/wed/wed-2025.mp4`, status: 'available', episode: 97, season: 17, tags: ['اقتصاد دائري', 'رقمي', '2025'] },
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

/* ─── Season Banner (generated, no image download) ─── */
const LazyBanner = ({ seasonNum, alt }: { seasonNum: number; alt: string }) => {
  const season = seasons.find(s => s.number === seasonNum);
  if (!season) return null;
  return (
    <div className="mb-5 rounded-xl overflow-hidden border border-border/30 shadow-lg relative" style={{ aspectRatio: '3/1' }}>
      <div className={`absolute inset-0 bg-gradient-to-br ${season.color}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      <div className="absolute inset-0 flex items-center justify-between px-6 sm:px-10">
        <div className="text-white text-right">
          <p className="text-[10px] sm:text-xs uppercase tracking-widest opacity-70">الموسم {season.number}</p>
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mt-1">{season.title}</h3>
          <p className="text-xs sm:text-sm opacity-80 mt-0.5">{season.titleEn}</p>
        </div>
        <span className="text-5xl sm:text-7xl opacity-25 select-none">{season.icon}</span>
      </div>
      <img src={logoImg} alt="" className="absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full opacity-80 shadow-md pointer-events-none" loading="lazy" />
    </div>
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
  const [collapsedSeasons, setCollapsedSeasons] = useState<number[]>([2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
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
                    {/* Season Banner - Lazy loaded */}
                    <LazyBanner seasonNum={season.number} alt={`${season.titleEn} - Season ${season.number}`} />

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
const SEASON_GRADIENTS: Record<number, string> = {
  1: 'from-emerald-600 to-teal-700', 2: 'from-cyan-600 to-blue-700', 3: 'from-indigo-600 to-purple-700',
  4: 'from-amber-600 to-orange-700', 5: 'from-violet-600 to-fuchsia-700', 6: 'from-orange-600 to-red-700',
  7: 'from-green-500 to-cyan-600', 8: 'from-yellow-600 to-amber-700', 9: 'from-lime-600 to-green-700',
  10: 'from-blue-700 to-indigo-800', 11: 'from-purple-600 to-violet-700', 12: 'from-cyan-500 to-rose-600',
  13: 'from-amber-500 to-yellow-600', 14: 'from-green-600 to-emerald-700', 15: 'from-blue-500 to-indigo-600',
  16: 'from-green-500 to-yellow-600', 17: 'from-teal-500 to-green-600',
};
const SEASON_ICONS: Record<number, string> = {
  1: '🌱', 2: '⚡', 3: '🔗', 4: '🚛', 5: '🧠', 6: '⚙️', 7: '📡', 8: '💰',
  9: '🎖️', 10: '⚖️', 11: '🌌', 12: '🚀', 13: '📖', 14: '🌍', 15: '⚡', 16: '🏆', 17: '🌎',
};

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
    {/* Thumbnail — generated gradient, no image download */}
    <div className="relative aspect-video overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${SEASON_GRADIENTS[video.season] || 'from-primary to-primary/60'}`} />
      {/* Season icon + episode number overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl opacity-20 select-none">{SEASON_ICONS[video.season] || '🎬'}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      
      {video.status === 'available' ? (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center opacity-70 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg">
            <Play className="w-5 h-5 text-gray-900 ml-0.5" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
          <Clock className="w-6 h-6 text-white/70" />
          <span className="text-[10px] text-white/70">قريباً</span>
        </div>
      )}

      {/* iRecycle Logo Watermark */}
      <img src={logoImg} alt="" className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full opacity-75 shadow pointer-events-none z-10" loading="lazy" />

      {/* Episode number */}
      <div className="absolute top-2 left-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white/90">
          EP{video.episode}
        </span>
      </div>

      {/* Duration */}
      <div className="absolute bottom-2 right-2">
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white/90">
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
