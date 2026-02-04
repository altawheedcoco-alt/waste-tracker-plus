import { 
  Image, Recycle, TreePine, Mountain, Palette, Globe, Leaf, 
  Building, Users, Award, Heart, Sparkles, Camera, Sun, 
  Droplets, Zap, Star, FileImage, Layers, PenTool, Frame
} from 'lucide-react';

export interface ImageTemplate {
  id: string;
  title: string;
  description: string;
  icon: any;
  prompt: string;
}

export interface ImageCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  templates: ImageTemplate[];
}

export const imageCategories: ImageCategory[] = [
  {
    id: 'recycling',
    title: 'إعادة التدوير',
    description: 'صور عن التدوير والاستدامة',
    icon: Recycle,
    color: 'from-green-500 to-emerald-500',
    templates: [
      { id: 'recycling-symbol', title: 'رمز إعادة التدوير', description: 'رمز التدوير بتصميم عصري', icon: Recycle, prompt: 'صورة احترافية لرمز إعادة التدوير بتصميم ثلاثي الأبعاد عصري وألوان خضراء' },
      { id: 'recycling-process', title: 'عملية التدوير', description: 'مراحل إعادة التدوير', icon: Layers, prompt: 'صورة توضيحية لمراحل عملية إعادة التدوير من الجمع إلى المنتج الجديد' },
      { id: 'recycling-bins', title: 'حاويات الفرز', description: 'حاويات فرز النفايات', icon: Recycle, prompt: 'صورة ملونة لحاويات فرز النفايات الملونة مع توضيح ما يوضع في كل حاوية' },
      { id: 'recycled-products', title: 'منتجات مُعاد تدويرها', description: 'منتجات من مواد مُدورة', icon: Sparkles, prompt: 'صورة لمنتجات جميلة مصنوعة من مواد معاد تدويرها' },
      { id: 'circular-economy', title: 'الاقتصاد الدائري', description: 'مفهوم الاقتصاد الدائري', icon: Recycle, prompt: 'رسم توضيحي لمفهوم الاقتصاد الدائري وإعادة استخدام الموارد' },
      { id: 'upcycling', title: 'إعادة التصنيع الإبداعي', description: 'تحويل النفايات لفن', icon: PenTool, prompt: 'صورة لأعمال فنية مصنوعة من مواد معاد تدويرها' },
      { id: 'plastic-bottles', title: 'زجاجات بلاستيكية', description: 'تدوير الزجاجات البلاستيكية', icon: Droplets, prompt: 'صورة فنية لزجاجات بلاستيكية في طريقها لإعادة التدوير' },
      { id: 'paper-recycling', title: 'تدوير الورق', description: 'دورة حياة الورق', icon: FileImage, prompt: 'صورة توضيحية لعملية تدوير الورق والكرتون' },
    ]
  },
  {
    id: 'nature',
    title: 'الطبيعة والبيئة',
    description: 'صور طبيعية بيئية',
    icon: TreePine,
    color: 'from-teal-500 to-cyan-500',
    templates: [
      { id: 'green-forest', title: 'غابة خضراء', description: 'غابة خضراء كثيفة', icon: TreePine, prompt: 'صورة لغابة خضراء كثيفة تعبر عن الطبيعة النقية والحفاظ على البيئة' },
      { id: 'clean-ocean', title: 'محيط نظيف', description: 'مياه المحيط الصافية', icon: Droplets, prompt: 'صورة لمحيط صافٍ مع أمواج هادئة تعبر عن نظافة البحار' },
      { id: 'sunrise-nature', title: 'شروق الشمس', description: 'شروق على الطبيعة', icon: Sun, prompt: 'صورة شروق الشمس فوق منظر طبيعي جميل يرمز للأمل والتجدد' },
      { id: 'mountains', title: 'الجبال', description: 'قمم جبلية', icon: Mountain, prompt: 'صورة لقمم جبلية مهيبة مع سماء صافية' },
      { id: 'garden', title: 'حديقة خضراء', description: 'حديقة مزهرة', icon: Leaf, prompt: 'صورة لحديقة خضراء مزهرة تعبر عن جمال الطبيعة' },
      { id: 'wildlife', title: 'الحياة البرية', description: 'حيوانات في الطبيعة', icon: Heart, prompt: 'صورة لحيوانات في بيئتها الطبيعية تعبر عن التنوع البيولوجي' },
      { id: 'waterfall', title: 'شلال', description: 'شلال مياه صافية', icon: Droplets, prompt: 'صورة لشلال مياه نقية في غابة خضراء' },
      { id: 'desert-oasis', title: 'واحة صحراوية', description: 'واحة في الصحراء', icon: Sun, prompt: 'صورة لواحة خضراء وسط الصحراء ترمز للاستدامة' },
    ]
  },
  {
    id: 'infographics',
    title: 'إنفوجرافيك',
    description: 'تصاميم معلوماتية',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    templates: [
      { id: 'recycling-stats', title: 'إحصائيات التدوير', description: 'أرقام وإحصائيات', icon: Palette, prompt: 'تصميم إنفوجرافيك عن إحصائيات إعادة التدوير بأسلوب عصري وألوان جذابة' },
      { id: 'waste-types', title: 'أنواع النفايات', description: 'تصنيف النفايات', icon: Layers, prompt: 'إنفوجرافيك يوضح أنواع النفايات المختلفة وكيفية فرزها' },
      { id: 'recycling-benefits', title: 'فوائد التدوير', description: 'فوائد إعادة التدوير', icon: Heart, prompt: 'إنفوجرافيك يعرض فوائد إعادة التدوير للبيئة والاقتصاد' },
      { id: 'how-to-recycle', title: 'كيف تُدوّر', description: 'خطوات التدوير', icon: Recycle, prompt: 'إنفوجرافيك يشرح خطوات إعادة التدوير بشكل مبسط' },
      { id: 'timeline', title: 'جدول زمني', description: 'مراحل ومحطات', icon: Sparkles, prompt: 'إنفوجرافيك على شكل جدول زمني يوضح تطور جهود التدوير' },
      { id: 'comparison', title: 'مقارنة', description: 'قبل وبعد التدوير', icon: Layers, prompt: 'إنفوجرافيك مقارنة بين التخلص العادي وإعادة التدوير' },
      { id: 'impact-numbers', title: 'أرقام التأثير', description: 'تأثير التدوير بالأرقام', icon: Zap, prompt: 'إنفوجرافيك يعرض تأثير إعادة التدوير بالأرقام والإحصائيات' },
      { id: 'process-flow', title: 'مخطط العملية', description: 'تدفق عملية التدوير', icon: Layers, prompt: 'إنفوجرافيك يوضح تدفق عملية إعادة التدوير من البداية للنهاية' },
    ]
  },
  {
    id: 'earth',
    title: 'كوكب الأرض',
    description: 'صور الأرض والفضاء',
    icon: Globe,
    color: 'from-blue-500 to-indigo-500',
    templates: [
      { id: 'earth-space', title: 'الأرض من الفضاء', description: 'كوكب الأرض الأزرق', icon: Globe, prompt: 'صورة لكوكب الأرض من الفضاء تظهر جماله الأزرق والأخضر' },
      { id: 'earth-hands', title: 'الأرض في أيدينا', description: 'أيدي تحمل الأرض', icon: Heart, prompt: 'صورة رمزية لأيدي تحمل كوكب الأرض تعبر عن مسؤوليتنا' },
      { id: 'earth-green', title: 'أرض خضراء', description: 'كوكب أخضر مستدام', icon: Leaf, prompt: 'صورة لكوكب الأرض بألوان خضراء زاهية ترمز للاستدامة' },
      { id: 'earth-healing', title: 'شفاء الأرض', description: 'الأرض تتعافى', icon: Heart, prompt: 'صورة رمزية للأرض تتعافى من التلوث بفضل إعادة التدوير' },
      { id: 'future-earth', title: 'مستقبل الأرض', description: 'الأرض في المستقبل', icon: Sparkles, prompt: 'تصور مستقبلي لكوكب أرض نظيف ومستدام' },
      { id: 'earth-children', title: 'أرض للأجيال', description: 'الأرض للأجيال القادمة', icon: Users, prompt: 'صورة ترمز لحماية الأرض للأجيال القادمة' },
    ]
  },
  {
    id: 'business',
    title: 'الأعمال والشركات',
    description: 'صور للشركات والمؤسسات',
    icon: Building,
    color: 'from-slate-500 to-gray-600',
    templates: [
      { id: 'green-office', title: 'مكتب أخضر', description: 'بيئة عمل صديقة للبيئة', icon: Building, prompt: 'صورة لمكتب عصري صديق للبيئة مع نباتات وإضاءة طبيعية' },
      { id: 'team-work', title: 'فريق العمل', description: 'فريق يعمل معاً', icon: Users, prompt: 'صورة لفريق عمل متنوع يتعاون في مشروع بيئي' },
      { id: 'sustainable-factory', title: 'مصنع مستدام', description: 'مصنع صديق للبيئة', icon: Building, prompt: 'صورة لمصنع تدوير حديث مع تقنيات صديقة للبيئة' },
      { id: 'green-truck', title: 'شاحنة تدوير', description: 'شاحنة جمع النفايات', icon: Recycle, prompt: 'صورة لشاحنة جمع النفايات الخضراء الحديثة' },
      { id: 'handshake', title: 'شراكة', description: 'مصافحة شراكة', icon: Users, prompt: 'صورة لمصافحة تعبر عن الشراكة والتعاون في مجال البيئة' },
      { id: 'award-ceremony', title: 'حفل تكريم', description: 'تسليم جائزة', icon: Award, prompt: 'صورة لحفل تسليم جائزة بيئية أو شهادة تقدير' },
      { id: 'warehouse', title: 'مستودع التدوير', description: 'مستودع مواد مُدورة', icon: Building, prompt: 'صورة لمستودع منظم يحتوي مواد معاد تدويرها' },
      { id: 'logistics', title: 'الخدمات اللوجستية', description: 'أسطول النقل', icon: Recycle, prompt: 'صورة لأسطول شاحنات نقل النفايات الحديثة' },
    ]
  },
  {
    id: 'social',
    title: 'وسائل التواصل',
    description: 'تصاميم للسوشيال ميديا',
    icon: Camera,
    color: 'from-pink-500 to-rose-500',
    templates: [
      { id: 'instagram-post', title: 'منشور إنستغرام', description: 'تصميم مربع للإنستغرام', icon: Camera, prompt: 'تصميم منشور إنستغرام عن التدوير بألوان جذابة وتصميم عصري' },
      { id: 'story-design', title: 'تصميم ستوري', description: 'قالب للستوري', icon: Frame, prompt: 'تصميم ستوري عمودي عن التوعية البيئية بأسلوب جذاب' },
      { id: 'cover-photo', title: 'صورة غلاف', description: 'غلاف للصفحة', icon: Image, prompt: 'تصميم صورة غلاف لصفحة التواصل الاجتماعي عن التدوير' },
      { id: 'profile-frame', title: 'إطار صورة شخصية', description: 'إطار للصورة الشخصية', icon: Frame, prompt: 'تصميم إطار للصورة الشخصية يحتوي على رموز التدوير' },
      { id: 'quote-card', title: 'بطاقة اقتباس', description: 'اقتباس ملهم', icon: PenTool, prompt: 'تصميم بطاقة اقتباس ملهم عن البيئة والتدوير' },
      { id: 'carousel-slide', title: 'شريحة عرض', description: 'شريحة لعرض متعدد', icon: Layers, prompt: 'تصميم شريحة لعرض معلومات عن التدوير بأسلوب متسلسل' },
    ]
  },
  {
    id: 'artistic',
    title: 'فني وإبداعي',
    description: 'صور فنية وإبداعية',
    icon: PenTool,
    color: 'from-amber-500 to-orange-500',
    templates: [
      { id: 'abstract-green', title: 'تجريدي أخضر', description: 'فن تجريدي بألوان خضراء', icon: Palette, prompt: 'لوحة فنية تجريدية بألوان خضراء تعبر عن الطبيعة والاستدامة' },
      { id: 'watercolor-nature', title: 'طبيعة ألوان مائية', description: 'رسم بالألوان المائية', icon: PenTool, prompt: 'رسم بالألوان المائية لمنظر طبيعي جميل' },
      { id: 'minimalist', title: 'تصميم بسيط', description: 'تصميم مينيماليست', icon: Frame, prompt: 'تصميم بسيط ومينيماليست عن التدوير بألوان هادئة' },
      { id: 'geometric', title: 'أشكال هندسية', description: 'تصميم هندسي', icon: Layers, prompt: 'تصميم هندسي عصري يجمع رموز التدوير مع أشكال هندسية' },
      { id: 'vintage-eco', title: 'ريترو بيئي', description: 'تصميم كلاسيكي', icon: Star, prompt: 'تصميم بأسلوب ريترو كلاسيكي عن حماية البيئة' },
      { id: 'pop-art', title: 'بوب آرت', description: 'فن البوب آرت', icon: Sparkles, prompt: 'تصميم بأسلوب البوب آرت الجريء عن إعادة التدوير' },
      { id: 'line-art', title: 'رسم خطي', description: 'رسم بالخطوط', icon: PenTool, prompt: 'رسم بالخطوط البسيطة لعناصر بيئية وتدويرية' },
      { id: '3d-render', title: 'تصميم ثلاثي الأبعاد', description: 'رندر ثلاثي الأبعاد', icon: Layers, prompt: 'تصميم ثلاثي الأبعاد واقعي لرمز إعادة التدوير' },
    ]
  },
  {
    id: 'motivational',
    title: 'تحفيزي وملهم',
    description: 'صور تحفيزية وملهمة',
    icon: Star,
    color: 'from-yellow-500 to-amber-500',
    templates: [
      { id: 'hope', title: 'الأمل', description: 'صورة ترمز للأمل', icon: Sun, prompt: 'صورة ملهمة ترمز للأمل في مستقبل أخضر ونظيف' },
      { id: 'change', title: 'التغيير', description: 'قوة التغيير الإيجابي', icon: Zap, prompt: 'صورة قوية تعبر عن قدرتنا على التغيير الإيجابي للبيئة' },
      { id: 'together', title: 'معاً', description: 'العمل الجماعي', icon: Users, prompt: 'صورة تعبر عن قوة العمل الجماعي لحماية البيئة' },
      { id: 'small-steps', title: 'خطوات صغيرة', description: 'كل خطوة تُحدث فرقاً', icon: Heart, prompt: 'صورة ملهمة تعبر عن أن كل خطوة صغيرة تحدث فرقاً' },
      { id: 'future-generations', title: 'الأجيال القادمة', description: 'من أجل أطفالنا', icon: Heart, prompt: 'صورة عاطفية عن حماية البيئة للأجيال القادمة' },
      { id: 'hero', title: 'أبطال البيئة', description: 'كن بطلاً للبيئة', icon: Award, prompt: 'صورة بطولية تشجع على أن يكون الجميع أبطالاً للبيئة' },
    ]
  },
];

export const getAllImageTemplates = (): ImageTemplate[] => {
  return imageCategories.flatMap(category => category.templates);
};

export const getImageTemplateById = (id: string): ImageTemplate | undefined => {
  return getAllImageTemplates().find(template => template.id === id);
};

export const getImageCategoryById = (id: string): ImageCategory | undefined => {
  return imageCategories.find(category => category.id === id);
};
