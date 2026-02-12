export type LayoutTemplateId = 
  | 'standard' | 'compact' | 'detailed' | 'two-column' 
  | 'formal-arabic' | 'modern-grid' | 'executive' | 'technical';

export interface LayoutTemplate {
  id: LayoutTemplateId;
  name: string;
  nameEn: string;
  description: string;
  preview: string;
  headerLayout: 'centered' | 'left-right' | 'split-banner' | 'minimal-top';
  bodyLayout: 'single-column' | 'two-column' | 'grid' | 'sections';
  tableStyle: 'striped' | 'bordered' | 'minimal' | 'modern-rounded' | 'compact';
  fontPreset: {
    heading: string;
    body: string;
    googleImport: string;
  };
  spacing: 'tight' | 'normal' | 'spacious';
  showDecorations: boolean;
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'standard',
    name: 'قياسي',
    nameEn: 'Standard',
    description: 'تخطيط متوازن مع عمود واحد وجداول مخططة',
    preview: '📄',
    headerLayout: 'centered',
    bodyLayout: 'single-column',
    tableStyle: 'striped',
    fontPreset: { heading: "'Cairo', sans-serif", body: "'Cairo', sans-serif", googleImport: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap' },
    spacing: 'normal',
    showDecorations: false,
  },
  {
    id: 'compact',
    name: 'مضغوط',
    nameEn: 'Compact',
    description: 'تخطيط مكثف يوفر المساحة لأقصى محتوى',
    preview: '📋',
    headerLayout: 'minimal-top',
    bodyLayout: 'single-column',
    tableStyle: 'compact',
    fontPreset: { heading: "'Tajawal', sans-serif", body: "'Tajawal', sans-serif", googleImport: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap' },
    spacing: 'tight',
    showDecorations: false,
  },
  {
    id: 'detailed',
    name: 'تفصيلي',
    nameEn: 'Detailed',
    description: 'تخطيط موسع مع فراغات واسعة وتفاصيل كاملة',
    preview: '📑',
    headerLayout: 'centered',
    bodyLayout: 'sections',
    tableStyle: 'bordered',
    fontPreset: { heading: "'Amiri', serif", body: "'Cairo', sans-serif", googleImport: 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap' },
    spacing: 'spacious',
    showDecorations: true,
  },
  {
    id: 'two-column',
    name: 'عمودين',
    nameEn: 'Two Column',
    description: 'تقسيم ثنائي للبيانات الرئيسية مع جدول سفلي',
    preview: '📰',
    headerLayout: 'left-right',
    bodyLayout: 'two-column',
    tableStyle: 'modern-rounded',
    fontPreset: { heading: "'Cairo', sans-serif", body: "'Tajawal', sans-serif", googleImport: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap' },
    spacing: 'normal',
    showDecorations: false,
  },
  {
    id: 'formal-arabic',
    name: 'رسمي عربي',
    nameEn: 'Formal Arabic',
    description: 'تصميم رسمي بخطوط عربية كلاسيكية وإطارات مزدوجة',
    preview: '🕌',
    headerLayout: 'centered',
    bodyLayout: 'sections',
    tableStyle: 'bordered',
    fontPreset: { heading: "'Amiri', serif", body: "'Amiri', serif", googleImport: 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap' },
    spacing: 'spacious',
    showDecorations: true,
  },
  {
    id: 'modern-grid',
    name: 'شبكي حديث',
    nameEn: 'Modern Grid',
    description: 'تخطيط شبكي عصري بزوايا مستديرة وألوان مسطحة',
    preview: '🔲',
    headerLayout: 'split-banner',
    bodyLayout: 'grid',
    tableStyle: 'modern-rounded',
    fontPreset: { heading: "'Rubik', sans-serif", body: "'Noto Sans Arabic', sans-serif", googleImport: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap' },
    spacing: 'normal',
    showDecorations: false,
  },
  {
    id: 'executive',
    name: 'تنفيذي',
    nameEn: 'Executive',
    description: 'تصميم فاخر للمستندات الرسمية والتنفيذية',
    preview: '🎩',
    headerLayout: 'centered',
    bodyLayout: 'single-column',
    tableStyle: 'minimal',
    fontPreset: { heading: "'Amiri', serif", body: "'Cairo', sans-serif", googleImport: 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap' },
    spacing: 'spacious',
    showDecorations: true,
  },
  {
    id: 'technical',
    name: 'تقني هندسي',
    nameEn: 'Technical',
    description: 'تخطيط دقيق للتقارير الفنية والهندسية',
    preview: '⚙️',
    headerLayout: 'minimal-top',
    bodyLayout: 'grid',
    tableStyle: 'bordered',
    fontPreset: { heading: "'Cairo', sans-serif", body: "'Cairo', sans-serif", googleImport: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap' },
    spacing: 'tight',
    showDecorations: false,
  },
];

export const getLayoutById = (id: LayoutTemplateId): LayoutTemplate => {
  return LAYOUT_TEMPLATES.find(t => t.id === id) || LAYOUT_TEMPLATES[0];
};
