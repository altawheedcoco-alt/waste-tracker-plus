/**
 * Voice Training Mode — وضع التدريب على الأوامر الصوتية
 * يساعد المستخدمين على تعلم الأوامر المتاحة خطوة بخطوة
 */

export interface TrainingLesson {
  id: string;
  title: string;
  description: string;
  command: string;
  expectedIntent: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'navigation' | 'filter' | 'action' | 'search';
}

export interface TrainingProgress {
  lessonId: string;
  completed: boolean;
  attempts: number;
  bestScore: number;
  completedAt?: number;
}

const TRAINING_STORAGE_KEY = 'voice_training_progress';

export const TRAINING_LESSONS: TrainingLesson[] = [
  // Navigation - Easy
  {
    id: 'nav_1',
    title: 'فتح لوحة التحكم',
    description: 'تعلم كيف تنتقل للوحة التحكم الرئيسية',
    command: 'افتح لوحة التحكم',
    expectedIntent: 'navigate',
    hint: 'قول "افتح لوحة التحكم" أو "روح الرئيسية"',
    difficulty: 'easy',
    category: 'navigation',
  },
  {
    id: 'nav_2',
    title: 'فتح الشحنات',
    description: 'تعلم الانتقال لصفحة الشحنات',
    command: 'افتح الشحنات',
    expectedIntent: 'navigate',
    hint: 'قول "افتح الشحنات" أو "ورّيني الشحنات"',
    difficulty: 'easy',
    category: 'navigation',
  },
  {
    id: 'nav_3',
    title: 'فتح الحسابات',
    description: 'تعلم الانتقال لصفحة الحسابات المالية',
    command: 'روح للحسابات',
    expectedIntent: 'navigate',
    hint: 'قول "روح للحسابات" أو "افتح الحسابات"',
    difficulty: 'easy',
    category: 'navigation',
  },
  // Filter - Medium
  {
    id: 'filter_1',
    title: 'تصفية حسب النوع',
    description: 'تعلم تصفية الشحنات حسب نوع النفاية',
    command: 'ورّيني شحنات البلاستيك',
    expectedIntent: 'filter',
    hint: 'قول "ورّيني شحنات البلاستيك" أو "فلتر بلاستيك"',
    difficulty: 'medium',
    category: 'filter',
  },
  {
    id: 'filter_2',
    title: 'شحنات اليوم',
    description: 'تعلم عرض شحنات اليوم فقط',
    command: 'شحنات النهارده',
    expectedIntent: 'filter',
    hint: 'قول "شحنات النهارده" أو "ورّيني شحنات اليوم"',
    difficulty: 'medium',
    category: 'filter',
  },
  // Action - Medium
  {
    id: 'action_1',
    title: 'إنشاء شحنة',
    description: 'تعلم إنشاء شحنة جديدة بالصوت',
    command: 'أنشئ شحنة جديدة',
    expectedIntent: 'create',
    hint: 'قول "أنشئ شحنة جديدة" أو "عايز أعمل شحنة"',
    difficulty: 'medium',
    category: 'action',
  },
  // Search - Hard
  {
    id: 'search_1',
    title: 'البحث عن شركة',
    description: 'تعلم البحث عن شركة محددة بالاسم',
    command: 'ابحث عن شركة النيل',
    expectedIntent: 'search',
    hint: 'قول "ابحث عن [اسم الشركة]" أو "دوّر على [اسم]"',
    difficulty: 'hard',
    category: 'search',
  },
  {
    id: 'search_2',
    title: 'استعلام عن الحالة',
    description: 'تعلم السؤال عن عدد الشحنات المعلقة',
    command: 'كام شحنة معلقة',
    expectedIntent: 'info',
    hint: 'قول "كام شحنة معلقة" أو "عدد الشحنات الجديدة"',
    difficulty: 'hard',
    category: 'search',
  },
];

export function getTrainingProgress(): TrainingProgress[] {
  try {
    return JSON.parse(localStorage.getItem(TRAINING_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function updateLessonProgress(lessonId: string, intent: string, confidence: number): { passed: boolean; score: number } {
  const lesson = TRAINING_LESSONS.find(l => l.id === lessonId);
  if (!lesson) return { passed: false, score: 0 };

  const passed = lesson.expectedIntent === intent && confidence > 0.5;
  const score = passed ? Math.round(confidence * 100) : 0;

  const progress = getTrainingProgress();
  const existing = progress.find(p => p.lessonId === lessonId);

  if (existing) {
    existing.attempts++;
    if (passed && score > existing.bestScore) {
      existing.bestScore = score;
      existing.completed = true;
      existing.completedAt = Date.now();
    }
  } else {
    progress.push({
      lessonId,
      completed: passed,
      attempts: 1,
      bestScore: score,
      completedAt: passed ? Date.now() : undefined,
    });
  }

  localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(progress));
  return { passed, score };
}

export function getOverallProgress(): { completed: number; total: number; percentage: number } {
  const progress = getTrainingProgress();
  const completed = progress.filter(p => p.completed).length;
  const total = TRAINING_LESSONS.length;
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}

export function resetTrainingProgress() {
  localStorage.removeItem(TRAINING_STORAGE_KEY);
}
