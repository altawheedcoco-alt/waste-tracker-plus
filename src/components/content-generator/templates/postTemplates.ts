import { 
  Megaphone, Leaf, MessageSquare, Sparkles, Calendar, Users, Award, 
  Heart, Globe, Lightbulb, TrendingUp, Shield, Handshake, BookOpen,
  Target, Zap, Clock, Star, Gift, Bell, Flag, Newspaper, Radio,
  Mic, Camera, FileText, PenTool, Briefcase, Building, MapPin
} from 'lucide-react';

export interface PostTemplate {
  id: string;
  title: string;
  description: string;
  icon: any;
  prompt: string;
}

export interface PostCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  templates: PostTemplate[];
}

export const postCategories: PostCategory[] = [
  {
    id: 'announcements',
    title: 'إعلانات وأخبار',
    description: 'منشورات إعلانية وأخبار الجهة',
    icon: Megaphone,
    color: 'from-blue-500 to-cyan-500',
    templates: [
      { id: 'general-announcement', title: 'إعلان عام', description: 'إعلان عن خدمات أو أخبار', icon: Megaphone, prompt: 'أنشئ منشوراً إعلانياً عاماً عن خدمات الجهة في مجال إدارة النفايات' },
      { id: 'new-service', title: 'خدمة جديدة', description: 'الإعلان عن خدمة جديدة', icon: Sparkles, prompt: 'أنشئ منشوراً للإعلان عن إطلاق خدمة جديدة في مجال التدوير' },
      { id: 'working-hours', title: 'مواعيد العمل', description: 'تحديث مواعيد العمل', icon: Clock, prompt: 'أنشئ منشوراً لإعلان مواعيد العمل الجديدة أو تغييرات في أوقات الخدمة' },
      { id: 'urgent-notice', title: 'إشعار عاجل', description: 'إعلان عاجل ومهم', icon: Bell, prompt: 'أنشئ منشوراً عاجلاً لإعلام العملاء بأمر مهم' },
      { id: 'price-update', title: 'تحديث الأسعار', description: 'إعلان عن تغيير الأسعار', icon: TrendingUp, prompt: 'أنشئ منشوراً للإعلان عن تحديث أسعار الخدمات' },
      { id: 'expansion', title: 'توسع جغرافي', description: 'الإعلان عن توسع في منطقة جديدة', icon: MapPin, prompt: 'أنشئ منشوراً للإعلان عن توسع الخدمات في منطقة جغرافية جديدة' },
      { id: 'maintenance', title: 'إشعار صيانة', description: 'إعلان عن صيانة أو توقف مؤقت', icon: Shield, prompt: 'أنشئ منشوراً لإعلام العملاء بفترة صيانة مجدولة' },
      { id: 'reopening', title: 'إعادة الافتتاح', description: 'الإعلان عن استئناف الخدمات', icon: Flag, prompt: 'أنشئ منشوراً للإعلان عن إعادة افتتاح أو استئناف الخدمات' },
    ]
  },
  {
    id: 'environmental',
    title: 'توعية بيئية',
    description: 'محتوى توعوي عن البيئة',
    icon: Leaf,
    color: 'from-green-500 to-emerald-500',
    templates: [
      { id: 'recycling-importance', title: 'أهمية التدوير', description: 'توعية عن فوائد إعادة التدوير', icon: Leaf, prompt: 'أنشئ منشوراً توعوياً عن أهمية إعادة التدوير للبيئة والمجتمع' },
      { id: 'climate-change', title: 'تغير المناخ', description: 'دور التدوير في مواجهة تغير المناخ', icon: Globe, prompt: 'أنشئ منشوراً عن دور إعادة التدوير في مكافحة تغير المناخ' },
      { id: 'plastic-pollution', title: 'التلوث البلاستيكي', description: 'مخاطر البلاستيك وبدائله', icon: Shield, prompt: 'أنشئ منشوراً توعوياً عن مخاطر التلوث البلاستيكي وكيفية تقليله' },
      { id: 'water-conservation', title: 'الحفاظ على المياه', description: 'أهمية ترشيد استهلاك المياه', icon: Heart, prompt: 'أنشئ منشوراً عن علاقة إدارة النفايات بالحفاظ على موارد المياه' },
      { id: 'sustainable-living', title: 'الحياة المستدامة', description: 'نصائح للعيش المستدام', icon: Lightbulb, prompt: 'أنشئ منشوراً عن أسلوب الحياة المستدام ودور الفرد في حماية البيئة' },
      { id: 'earth-day', title: 'يوم الأرض', description: 'منشور بمناسبة يوم الأرض', icon: Globe, prompt: 'أنشئ منشوراً احتفالياً بمناسبة يوم الأرض العالمي' },
      { id: 'world-environment-day', title: 'يوم البيئة العالمي', description: 'منشور بمناسبة يوم البيئة', icon: Leaf, prompt: 'أنشئ منشوراً بمناسبة يوم البيئة العالمي مع رسالة ملهمة' },
      { id: 'biodiversity', title: 'التنوع البيولوجي', description: 'حماية التنوع الحيوي', icon: Heart, prompt: 'أنشئ منشوراً عن أهمية التنوع البيولوجي ودور التدوير في حمايته' },
      { id: 'zero-waste', title: 'صفر نفايات', description: 'مفهوم الصفر نفايات', icon: Target, prompt: 'أنشئ منشوراً توعوياً عن مفهوم صفر نفايات وكيفية تحقيقه' },
      { id: 'eco-footprint', title: 'البصمة الكربونية', description: 'تقليل البصمة الكربونية', icon: TrendingUp, prompt: 'أنشئ منشوراً عن البصمة الكربونية وكيف يساهم التدوير في تقليلها' },
    ]
  },
  {
    id: 'tips',
    title: 'نصائح وإرشادات',
    description: 'نصائح عملية للتدوير',
    icon: MessageSquare,
    color: 'from-yellow-500 to-orange-500',
    templates: [
      { id: 'sorting-tips', title: 'نصائح الفرز', description: 'كيفية فرز النفايات بشكل صحيح', icon: MessageSquare, prompt: 'أنشئ منشوراً يحتوي على نصائح عملية لفرز النفايات في المنزل' },
      { id: 'home-recycling', title: 'التدوير المنزلي', description: 'طرق التدوير في المنزل', icon: Lightbulb, prompt: 'أنشئ منشوراً عن طرق سهلة لإعادة التدوير في المنزل' },
      { id: 'office-recycling', title: 'التدوير في المكتب', description: 'نصائح للمكاتب والشركات', icon: Briefcase, prompt: 'أنشئ منشوراً عن أفضل ممارسات إعادة التدوير في بيئة العمل' },
      { id: 'paper-recycling', title: 'تدوير الورق', description: 'نصائح لتدوير الورق', icon: FileText, prompt: 'أنشئ منشوراً تفصيلياً عن كيفية تدوير الورق والكرتون' },
      { id: 'plastic-recycling', title: 'تدوير البلاستيك', description: 'أنواع البلاستيك القابلة للتدوير', icon: Shield, prompt: 'أنشئ منشوراً توضيحياً عن أنواع البلاستيك وكيفية تدويرها' },
      { id: 'metal-recycling', title: 'تدوير المعادن', description: 'تدوير العلب والمعادن', icon: Zap, prompt: 'أنشئ منشوراً عن أهمية وطريقة تدوير المعادن والعلب' },
      { id: 'glass-recycling', title: 'تدوير الزجاج', description: 'نصائح لتدوير الزجاج', icon: Sparkles, prompt: 'أنشئ منشوراً عن كيفية فرز وتدوير الزجاج بأمان' },
      { id: 'e-waste', title: 'النفايات الإلكترونية', description: 'التخلص الآمن من الإلكترونيات', icon: Zap, prompt: 'أنشئ منشوراً توعوياً عن كيفية التخلص الآمن من النفايات الإلكترونية' },
      { id: 'organic-waste', title: 'النفايات العضوية', description: 'الاستفادة من النفايات العضوية', icon: Leaf, prompt: 'أنشئ منشوراً عن كيفية تحويل النفايات العضوية إلى سماد' },
      { id: 'reducing-waste', title: 'تقليل النفايات', description: 'نصائح لتقليل النفايات', icon: Target, prompt: 'أنشئ منشوراً عن استراتيجيات فعالة لتقليل النفايات من المصدر' },
    ]
  },
  {
    id: 'achievements',
    title: 'إنجازات وأرقام',
    description: 'عرض إنجازات الجهة',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    templates: [
      { id: 'monthly-stats', title: 'إحصائيات شهرية', description: 'عرض أرقام الشهر', icon: TrendingUp, prompt: 'أنشئ منشوراً يعرض الإحصائيات والإنجازات الشهرية للجهة' },
      { id: 'yearly-review', title: 'ملخص سنوي', description: 'إنجازات العام', icon: Calendar, prompt: 'أنشئ منشوراً يلخص إنجازات العام في مجال التدوير' },
      { id: 'milestone', title: 'إنجاز مهم', description: 'الاحتفال بإنجاز كبير', icon: Award, prompt: 'أنشئ منشوراً للاحتفال بتحقيق إنجاز مهم في مجال إعادة التدوير' },
      { id: 'tonnage-achieved', title: 'كمية التدوير', description: 'كمية النفايات المدورة', icon: TrendingUp, prompt: 'أنشئ منشوراً يعرض كمية النفايات التي تم تدويرها' },
      { id: 'customer-count', title: 'عدد العملاء', description: 'نمو قاعدة العملاء', icon: Users, prompt: 'أنشئ منشوراً يحتفل بنمو عدد العملاء والشركاء' },
      { id: 'environmental-impact', title: 'الأثر البيئي', description: 'الأثر الإيجابي على البيئة', icon: Leaf, prompt: 'أنشئ منشوراً يعرض الأثر البيئي الإيجابي لجهود التدوير' },
      { id: 'award-received', title: 'جائزة أو تكريم', description: 'حصول الجهة على تكريم', icon: Award, prompt: 'أنشئ منشوراً للإعلان عن حصول الجهة على جائزة أو تكريم' },
      { id: 'certification', title: 'شهادة أو اعتماد', description: 'الحصول على شهادة جودة', icon: Shield, prompt: 'أنشئ منشوراً للإعلان عن حصول الجهة على شهادة اعتماد أو جودة' },
    ]
  },
  {
    id: 'events',
    title: 'فعاليات ومناسبات',
    description: 'إعلانات الفعاليات',
    icon: Calendar,
    color: 'from-red-500 to-rose-500',
    templates: [
      { id: 'upcoming-event', title: 'فعالية قادمة', description: 'الإعلان عن فعالية', icon: Calendar, prompt: 'أنشئ منشوراً للإعلان عن فعالية قادمة تتعلق بالتدوير والبيئة' },
      { id: 'workshop', title: 'ورشة عمل', description: 'دعوة لحضور ورشة', icon: BookOpen, prompt: 'أنشئ منشوراً للدعوة لحضور ورشة عمل عن التدوير' },
      { id: 'cleanup-campaign', title: 'حملة نظافة', description: 'دعوة للمشاركة في حملة', icon: Users, prompt: 'أنشئ منشوراً للدعوة للمشاركة في حملة نظافة وتدوير' },
      { id: 'exhibition', title: 'معرض', description: 'المشاركة في معرض', icon: Building, prompt: 'أنشئ منشوراً للإعلان عن المشاركة في معرض بيئي' },
      { id: 'school-visit', title: 'زيارة مدرسية', description: 'برنامج توعوي للمدارس', icon: BookOpen, prompt: 'أنشئ منشوراً عن برنامج الزيارات المدرسية للتوعية البيئية' },
      { id: 'community-event', title: 'فعالية مجتمعية', description: 'نشاط مجتمعي', icon: Heart, prompt: 'أنشئ منشوراً للإعلان عن فعالية مجتمعية للتوعية البيئية' },
      { id: 'webinar', title: 'ندوة إلكترونية', description: 'دعوة لندوة أونلاين', icon: Mic, prompt: 'أنشئ منشوراً للدعوة لحضور ندوة إلكترونية عن التدوير' },
      { id: 'conference', title: 'مؤتمر', description: 'المشاركة في مؤتمر', icon: Users, prompt: 'أنشئ منشوراً للإعلان عن المشاركة في مؤتمر بيئي' },
    ]
  },
  {
    id: 'partnerships',
    title: 'شراكات وتعاون',
    description: 'إعلانات الشراكات',
    icon: Handshake,
    color: 'from-indigo-500 to-blue-500',
    templates: [
      { id: 'new-partnership', title: 'شراكة جديدة', description: 'إعلان شراكة استراتيجية', icon: Handshake, prompt: 'أنشئ منشوراً للإعلان عن شراكة جديدة في مجال إدارة النفايات' },
      { id: 'client-spotlight', title: 'عميل مميز', description: 'تسليط الضوء على عميل', icon: Star, prompt: 'أنشئ منشوراً يسلط الضوء على قصة نجاح مع عميل مميز' },
      { id: 'government-collaboration', title: 'تعاون حكومي', description: 'شراكة مع جهة حكومية', icon: Building, prompt: 'أنشئ منشوراً للإعلان عن تعاون مع جهة حكومية' },
      { id: 'ngo-partnership', title: 'شراكة مع منظمة', description: 'تعاون مع منظمة غير ربحية', icon: Heart, prompt: 'أنشئ منشوراً للإعلان عن شراكة مع منظمة بيئية غير ربحية' },
      { id: 'industry-alliance', title: 'تحالف صناعي', description: 'انضمام لتحالف في الصناعة', icon: Users, prompt: 'أنشئ منشوراً للإعلان عن الانضمام لتحالف صناعي في مجال التدوير' },
      { id: 'supplier-partnership', title: 'شراكة مع مورد', description: 'تعاون مع مورد جديد', icon: Briefcase, prompt: 'أنشئ منشوراً للإعلان عن شراكة استراتيجية مع مورد' },
    ]
  },
  {
    id: 'seasonal',
    title: 'مناسبات موسمية',
    description: 'محتوى موسمي ومناسبات',
    icon: Gift,
    color: 'from-teal-500 to-cyan-500',
    templates: [
      { id: 'ramadan', title: 'رمضان', description: 'تهنئة وتوعية رمضانية', icon: Star, prompt: 'أنشئ منشوراً بمناسبة شهر رمضان مع رسالة توعوية عن تقليل الهدر' },
      { id: 'eid', title: 'العيد', description: 'تهنئة بالعيد', icon: Gift, prompt: 'أنشئ منشوراً للتهنئة بالعيد مع رسالة عن الحفاظ على البيئة' },
      { id: 'new-year', title: 'رأس السنة', description: 'تهنئة بالعام الجديد', icon: Sparkles, prompt: 'أنشئ منشوراً للتهنئة بالعام الجديد مع التزامات بيئية' },
      { id: 'national-day', title: 'اليوم الوطني', description: 'تهنئة باليوم الوطني', icon: Flag, prompt: 'أنشئ منشوراً بمناسبة اليوم الوطني مع رسالة وطنية بيئية' },
      { id: 'mothers-day', title: 'عيد الأم', description: 'تهنئة بعيد الأم', icon: Heart, prompt: 'أنشئ منشوراً بمناسبة عيد الأم مع ربطه بالحفاظ على البيئة للأجيال القادمة' },
      { id: 'summer', title: 'فصل الصيف', description: 'نصائح صيفية', icon: Calendar, prompt: 'أنشئ منشوراً موسمياً عن التدوير في فصل الصيف' },
      { id: 'back-to-school', title: 'العودة للمدارس', description: 'موسم المدارس', icon: BookOpen, prompt: 'أنشئ منشوراً بمناسبة العودة للمدارس مع نصائح للتدوير' },
    ]
  },
  {
    id: 'team',
    title: 'فريق العمل',
    description: 'محتوى عن الفريق',
    icon: Users,
    color: 'from-amber-500 to-yellow-500',
    templates: [
      { id: 'team-spotlight', title: 'تسليط الضوء على موظف', description: 'تعريف بأحد أعضاء الفريق', icon: Star, prompt: 'أنشئ منشوراً للتعريف بأحد أعضاء الفريق وإنجازاته' },
      { id: 'hiring', title: 'فرص وظيفية', description: 'إعلان عن وظائف شاغرة', icon: Briefcase, prompt: 'أنشئ منشوراً للإعلان عن فرص وظيفية في مجال إدارة النفايات' },
      { id: 'team-training', title: 'تدريب الفريق', description: 'برنامج تدريبي للفريق', icon: BookOpen, prompt: 'أنشئ منشوراً عن برنامج تدريبي لتطوير مهارات الفريق' },
      { id: 'team-achievement', title: 'إنجاز الفريق', description: 'احتفال بإنجاز جماعي', icon: Award, prompt: 'أنشئ منشوراً للاحتفال بإنجاز حققه فريق العمل' },
      { id: 'team-culture', title: 'ثقافة العمل', description: 'عرض بيئة العمل', icon: Heart, prompt: 'أنشئ منشوراً يعرض ثقافة العمل والقيم في الجهة' },
      { id: 'employee-anniversary', title: 'ذكرى موظف', description: 'تكريم سنوات الخدمة', icon: Calendar, prompt: 'أنشئ منشوراً لتكريم موظف بمناسبة مرور سنوات على عمله' },
    ]
  },
];

export const getAllPostTemplates = (): PostTemplate[] => {
  return postCategories.flatMap(category => category.templates);
};

export const getPostTemplateById = (id: string): PostTemplate | undefined => {
  return getAllPostTemplates().find(template => template.id === id);
};

export const getPostCategoryById = (id: string): PostCategory | undefined => {
  return postCategories.find(category => category.id === id);
};
