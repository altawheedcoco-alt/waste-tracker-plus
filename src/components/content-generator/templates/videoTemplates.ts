import { 
  Video, Sparkles, Leaf, Play, Recycle, Film, Award, Users, 
  Mic, BookOpen, TrendingUp, Building, Heart, Globe, Zap,
  Camera, Star, MessageSquare, Target, Clock, Gift
} from 'lucide-react';

export interface VideoTemplate {
  id: string;
  title: string;
  description: string;
  icon: any;
  prompt: string;
}

export interface VideoCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  templates: VideoTemplate[];
}

export const videoCategories: VideoCategory[] = [
  {
    id: 'promotional',
    title: 'ترويجي ودعائي',
    description: 'فيديوهات ترويجية للخدمات',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    templates: [
      { id: 'platform-promo', title: 'فيديو ترويجي للمنصة', description: 'تعريف بمنصة آي ريسايكل', icon: Sparkles, prompt: 'أنشئ سيناريو فيديو ترويجي احترافي لمنصة آي ريسايكل لإدارة النفايات والتدوير' },
      { id: 'services-overview', title: 'نظرة على الخدمات', description: 'عرض شامل للخدمات', icon: Video, prompt: 'أنشئ سيناريو فيديو يعرض جميع خدمات الجهة في مجال إدارة النفايات' },
      { id: 'why-choose-us', title: 'لماذا تختارنا', description: 'مميزات الجهة', icon: Star, prompt: 'أنشئ سيناريو فيديو يوضح لماذا يجب على العملاء اختيار خدماتنا' },
      { id: 'brand-story', title: 'قصة العلامة', description: 'رحلة الجهة', icon: Film, prompt: 'أنشئ سيناريو فيديو يروي قصة تأسيس الجهة ورحلتها' },
      { id: 'call-to-action', title: 'دعوة للتواصل', description: 'تشجيع على التواصل', icon: MessageSquare, prompt: 'أنشئ سيناريو فيديو قصير يدعو العملاء للتواصل والتعاقد' },
      { id: 'special-offer', title: 'عرض خاص', description: 'عرض ترويجي', icon: Gift, prompt: 'أنشئ سيناريو فيديو للإعلان عن عرض خاص أو خصم' },
      { id: 'testimonials', title: 'آراء العملاء', description: 'شهادات العملاء', icon: Users, prompt: 'أنشئ سيناريو فيديو يعرض شهادات وآراء العملاء الراضين' },
      { id: 'comparison', title: 'مقارنة', description: 'قبل وبعد الخدمة', icon: TrendingUp, prompt: 'أنشئ سيناريو فيديو يقارن الوضع قبل وبعد استخدام خدماتنا' },
    ]
  },
  {
    id: 'educational',
    title: 'تعليمي وتوعوي',
    description: 'محتوى تعليمي وتوعوي',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500',
    templates: [
      { id: 'recycling-importance', title: 'أهمية التدوير', description: 'لماذا نُدوّر؟', icon: Leaf, prompt: 'أنشئ سيناريو فيديو توعوي يشرح أهمية إعادة التدوير للبيئة والمجتمع' },
      { id: 'how-to-sort', title: 'كيفية الفرز', description: 'دليل فرز النفايات', icon: Recycle, prompt: 'أنشئ سيناريو فيديو تعليمي يشرح كيفية فرز النفايات بشكل صحيح' },
      { id: 'waste-types', title: 'أنواع النفايات', description: 'تصنيف النفايات', icon: BookOpen, prompt: 'أنشئ سيناريو فيديو تعليمي عن أنواع النفايات المختلفة' },
      { id: 'climate-impact', title: 'التأثير المناخي', description: 'دور التدوير في المناخ', icon: Globe, prompt: 'أنشئ سيناريو فيديو عن دور إعادة التدوير في مكافحة تغير المناخ' },
      { id: 'e-waste', title: 'النفايات الإلكترونية', description: 'التخلص من الإلكترونيات', icon: Zap, prompt: 'أنشئ سيناريو فيديو توعوي عن مخاطر النفايات الإلكترونية وكيفية التخلص منها' },
      { id: 'plastic-facts', title: 'حقائق عن البلاستيك', description: 'معلومات مهمة', icon: MessageSquare, prompt: 'أنشئ سيناريو فيديو يعرض حقائق صادمة عن التلوث البلاستيكي' },
      { id: 'composting', title: 'التسميد العضوي', description: 'كيفية التسميد', icon: Leaf, prompt: 'أنشئ سيناريو فيديو تعليمي عن تحويل النفايات العضوية إلى سماد' },
      { id: 'reduce-reuse', title: 'قلل وأعد الاستخدام', description: 'ما قبل التدوير', icon: Target, prompt: 'أنشئ سيناريو فيديو عن أهمية تقليل الاستهلاك وإعادة الاستخدام قبل التدوير' },
      { id: 'ocean-pollution', title: 'تلوث المحيطات', description: 'حماية البحار', icon: Globe, prompt: 'أنشئ سيناريو فيديو توعوي عن تأثير النفايات على المحيطات' },
      { id: 'zero-waste-tips', title: 'نصائح صفر نفايات', description: 'حياة بدون نفايات', icon: Star, prompt: 'أنشئ سيناريو فيديو يقدم نصائح عملية لحياة صفر نفايات' },
    ]
  },
  {
    id: 'tutorials',
    title: 'شروحات وأدلة',
    description: 'فيديوهات شرح الاستخدام',
    icon: Play,
    color: 'from-blue-500 to-cyan-500',
    templates: [
      { id: 'platform-tutorial', title: 'شرح المنصة', description: 'كيفية استخدام المنصة', icon: Play, prompt: 'أنشئ سيناريو فيديو تعليمي يشرح كيفية استخدام منصة آي ريسايكل' },
      { id: 'create-shipment', title: 'إنشاء شحنة', description: 'خطوات إنشاء شحنة', icon: Video, prompt: 'أنشئ سيناريو فيديو يشرح خطوات إنشاء شحنة جديدة في النظام' },
      { id: 'track-shipment', title: 'تتبع الشحنات', description: 'كيفية التتبع', icon: Target, prompt: 'أنشئ سيناريو فيديو يشرح كيفية تتبع الشحنات في الوقت الفعلي' },
      { id: 'reports-guide', title: 'دليل التقارير', description: 'فهم التقارير', icon: BookOpen, prompt: 'أنشئ سيناريو فيديو يشرح كيفية قراءة واستخدام التقارير' },
      { id: 'mobile-app', title: 'التطبيق الجوال', description: 'استخدام التطبيق', icon: Camera, prompt: 'أنشئ سيناريو فيديو يشرح استخدام التطبيق الجوال' },
      { id: 'driver-guide', title: 'دليل السائق', description: 'للسائقين', icon: Users, prompt: 'أنشئ سيناريو فيديو دليل للسائقين لاستخدام النظام' },
      { id: 'quick-start', title: 'البداية السريعة', description: 'للمستخدمين الجدد', icon: Zap, prompt: 'أنشئ سيناريو فيديو سريع للمستخدمين الجدد للبدء' },
      { id: 'faq-video', title: 'الأسئلة الشائعة', description: 'إجابات بالفيديو', icon: MessageSquare, prompt: 'أنشئ سيناريو فيديو يجيب على الأسئلة الشائعة' },
    ]
  },
  {
    id: 'success-stories',
    title: 'قصص نجاح',
    description: 'إنجازات ونتائج',
    icon: Award,
    color: 'from-amber-500 to-orange-500',
    templates: [
      { id: 'client-success', title: 'قصة نجاح عميل', description: 'تجربة عميل ناجحة', icon: Star, prompt: 'أنشئ سيناريو فيديو يروي قصة نجاح أحد العملاء مع خدماتنا' },
      { id: 'impact-story', title: 'قصة تأثير', description: 'أثرنا على البيئة', icon: Heart, prompt: 'أنشئ سيناريو فيديو يعرض تأثيرنا الإيجابي على البيئة' },
      { id: 'transformation', title: 'قصة تحول', description: 'رحلة التحول الأخضر', icon: TrendingUp, prompt: 'أنشئ سيناريو فيديو يروي رحلة تحول شركة نحو الاستدامة معنا' },
      { id: 'community-impact', title: 'أثر مجتمعي', description: 'تأثيرنا على المجتمع', icon: Users, prompt: 'أنشئ سيناريو فيديو عن تأثيرنا الإيجابي على المجتمع المحلي' },
      { id: 'partnership-story', title: 'قصة شراكة', description: 'شراكة ناجحة', icon: Award, prompt: 'أنشئ سيناريو فيديو يروي قصة شراكة ناجحة' },
      { id: 'milestone', title: 'إنجاز مهم', description: 'الاحتفال بإنجاز', icon: Sparkles, prompt: 'أنشئ سيناريو فيديو للاحتفال بتحقيق إنجاز كبير' },
      { id: 'year-review', title: 'مراجعة سنوية', description: 'إنجازات العام', icon: Clock, prompt: 'أنشئ سيناريو فيديو يلخص إنجازات العام' },
      { id: 'numbers-story', title: 'قصة بالأرقام', description: 'إنجازاتنا بالأرقام', icon: TrendingUp, prompt: 'أنشئ سيناريو فيديو يعرض إنجازاتنا بالأرقام والإحصائيات' },
    ]
  },
  {
    id: 'corporate',
    title: 'مؤسسي واحترافي',
    description: 'فيديوهات رسمية للشركات',
    icon: Building,
    color: 'from-slate-500 to-gray-600',
    templates: [
      { id: 'about-us', title: 'من نحن', description: 'تعريف بالجهة', icon: Building, prompt: 'أنشئ سيناريو فيديو "من نحن" رسمي واحترافي' },
      { id: 'vision-mission', title: 'الرؤية والرسالة', description: 'رؤيتنا ورسالتنا', icon: Target, prompt: 'أنشئ سيناريو فيديو يعرض رؤية ورسالة الجهة' },
      { id: 'team-intro', title: 'تعريف بالفريق', description: 'فريق العمل', icon: Users, prompt: 'أنشئ سيناريو فيديو تعريفي بفريق العمل والخبرات' },
      { id: 'facilities-tour', title: 'جولة في المرافق', description: 'عرض المرافق', icon: Building, prompt: 'أنشئ سيناريو فيديو جولة افتراضية في مرافق الجهة' },
      { id: 'csr-video', title: 'المسؤولية المجتمعية', description: 'أنشطة المسؤولية المجتمعية', icon: Heart, prompt: 'أنشئ سيناريو فيديو عن أنشطة المسؤولية المجتمعية' },
      { id: 'investor-pitch', title: 'عرض للمستثمرين', description: 'فرص الاستثمار', icon: TrendingUp, prompt: 'أنشئ سيناريو فيديو عرض تقديمي للمستثمرين المحتملين' },
      { id: 'annual-report', title: 'التقرير السنوي', description: 'ملخص العام', icon: BookOpen, prompt: 'أنشئ سيناريو فيديو ملخص للتقرير السنوي' },
      { id: 'partnership-pitch', title: 'عرض للشراكة', description: 'فرص الشراكة', icon: Award, prompt: 'أنشئ سيناريو فيديو عرض لفرص الشراكة' },
    ]
  },
  {
    id: 'social-media',
    title: 'للسوشيال ميديا',
    description: 'فيديوهات قصيرة للتواصل',
    icon: Camera,
    color: 'from-pink-500 to-rose-500',
    templates: [
      { id: 'reels-tip', title: 'ريلز نصيحة', description: 'نصيحة سريعة', icon: Zap, prompt: 'أنشئ سيناريو فيديو قصير (15 ثانية) بنصيحة سريعة عن التدوير' },
      { id: 'tiktok-trend', title: 'تيك توك ترند', description: 'محتوى عصري', icon: Sparkles, prompt: 'أنشئ سيناريو فيديو قصير بأسلوب التيك توك عن التدوير' },
      { id: 'quick-fact', title: 'حقيقة سريعة', description: 'معلومة في ثوانٍ', icon: MessageSquare, prompt: 'أنشئ سيناريو فيديو قصير يعرض حقيقة مدهشة عن التدوير' },
      { id: 'challenge', title: 'تحدي', description: 'تحدي بيئي', icon: Star, prompt: 'أنشئ سيناريو فيديو تحدي بيئي للمتابعين' },
      { id: 'before-after', title: 'قبل وبعد', description: 'التحول المرئي', icon: TrendingUp, prompt: 'أنشئ سيناريو فيديو قبل وبعد التدوير' },
      { id: 'day-in-life', title: 'يوم في حياة', description: 'يوم عمل كامل', icon: Clock, prompt: 'أنشئ سيناريو فيديو "يوم في حياة" أحد العاملين في التدوير' },
      { id: 'myth-buster', title: 'كشف الخرافات', description: 'تصحيح المفاهيم', icon: Zap, prompt: 'أنشئ سيناريو فيديو يكشف خرافة شائعة عن التدوير' },
      { id: 'diy-recycle', title: 'اصنعها بنفسك', description: 'مشاريع تدوير منزلية', icon: Star, prompt: 'أنشئ سيناريو فيديو DIY لإعادة استخدام المواد' },
    ]
  },
  {
    id: 'events',
    title: 'فعاليات ومناسبات',
    description: 'تغطية الفعاليات',
    icon: Film,
    color: 'from-indigo-500 to-purple-500',
    templates: [
      { id: 'event-promo', title: 'إعلان فعالية', description: 'الترويج لفعالية قادمة', icon: Mic, prompt: 'أنشئ سيناريو فيديو ترويجي لفعالية قادمة في مجال التدوير' },
      { id: 'event-recap', title: 'ملخص فعالية', description: 'تلخيص فعالية سابقة', icon: Film, prompt: 'أنشئ سيناريو فيديو ملخص لفعالية بيئية تمت' },
      { id: 'conference-highlight', title: 'أبرز لحظات المؤتمر', description: 'highlights المؤتمر', icon: Star, prompt: 'أنشئ سيناريو فيديو يعرض أبرز لحظات المؤتمر' },
      { id: 'workshop-promo', title: 'ورشة عمل', description: 'الدعوة لورشة', icon: BookOpen, prompt: 'أنشئ سيناريو فيديو للدعوة لحضور ورشة عمل عن التدوير' },
      { id: 'campaign-launch', title: 'إطلاق حملة', description: 'إعلان حملة جديدة', icon: Sparkles, prompt: 'أنشئ سيناريو فيديو لإطلاق حملة توعوية جديدة' },
      { id: 'award-ceremony', title: 'حفل تكريم', description: 'توثيق حفل تكريم', icon: Award, prompt: 'أنشئ سيناريو فيديو لتوثيق حفل تكريم أو جائزة' },
    ]
  },
  {
    id: 'seasonal',
    title: 'موسمي ومناسبات',
    description: 'محتوى موسمي خاص',
    icon: Gift,
    color: 'from-teal-500 to-emerald-500',
    templates: [
      { id: 'earth-day', title: 'يوم الأرض', description: 'احتفال يوم الأرض', icon: Globe, prompt: 'أنشئ سيناريو فيديو بمناسبة يوم الأرض العالمي' },
      { id: 'environment-day', title: 'يوم البيئة', description: 'يوم البيئة العالمي', icon: Leaf, prompt: 'أنشئ سيناريو فيديو بمناسبة يوم البيئة العالمي' },
      { id: 'ramadan-tips', title: 'نصائح رمضانية', description: 'التدوير في رمضان', icon: Star, prompt: 'أنشئ سيناريو فيديو عن تقليل الهدر في رمضان' },
      { id: 'eid-greeting', title: 'تهنئة العيد', description: 'رسالة عيد', icon: Gift, prompt: 'أنشئ سيناريو فيديو تهنئة بالعيد مع رسالة بيئية' },
      { id: 'new-year', title: 'السنة الجديدة', description: 'التزامات السنة الجديدة', icon: Sparkles, prompt: 'أنشئ سيناريو فيديو للسنة الجديدة مع التزامات بيئية' },
      { id: 'summer-campaign', title: 'حملة صيفية', description: 'محتوى صيفي', icon: Clock, prompt: 'أنشئ سيناريو فيديو حملة توعوية صيفية' },
    ]
  },
];

export const getAllVideoTemplates = (): VideoTemplate[] => {
  return videoCategories.flatMap(category => category.templates);
};

export const getVideoTemplateById = (id: string): VideoTemplate | undefined => {
  return getAllVideoTemplates().find(template => template.id === id);
};

export const getVideoCategoryById = (id: string): VideoCategory | undefined => {
  return videoCategories.find(category => category.id === id);
};
