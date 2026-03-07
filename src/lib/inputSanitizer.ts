/**
 * Input Sanitizer — حماية شاملة ضد هجمات XSS و SQL Injection و Path Traversal
 * 
 * يوفر طبقة تحقق وتنظيف للمدخلات قبل إرسالها للخادم
 */

// أنماط خطيرة يجب إزالتها
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*['"]?\s*javascript/gi,
];

// أنماط SQL injection
const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /('|"|`)\s*(OR|AND)\s+\d+\s*=\s*\d+/gi,
];

// أنماط Path Traversal
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\+/g,
  /%2e%2e/gi,
  /%252e%252e/gi,
];

/**
 * تنظيف نص عادي من أكواد HTML و XSS
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  let clean = input;
  
  // إزالة أنماط XSS
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, '');
  }
  
  // ترميز أحرف HTML الخاصة
  clean = clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return clean.trim();
}

/**
 * تنظيف مدخل بريد إلكتروني
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const trimmed = input.trim().toLowerCase();
  return emailRegex.test(trimmed) ? trimmed : '';
}

/**
 * تنظيف رقم هاتف
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[^\d+\-\s()]/g, '').trim();
}

/**
 * تنظيف URL
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

/**
 * كشف محاولات SQL Injection
 */
export function detectSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return SQL_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * كشف محاولات Path Traversal
 */
export function detectPathTraversal(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * تنظيف اسم ملف
 */
export function sanitizeFileName(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[^a-zA-Z0-9._\-\u0600-\u06FF\s]/g, '')
    .replace(/\.\./g, '')
    .trim();
}

/**
 * تنظيف رقمي - يقبل أرقام فقط
 */
export function sanitizeNumeric(input: string | number): number | null {
  const num = typeof input === 'number' ? input : parseFloat(String(input));
  return isNaN(num) || !isFinite(num) ? null : num;
}

/**
 * تنظيف شامل لكائن (Object) بالكامل
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      (sanitized as any)[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (sanitized as any)[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      (sanitized as any)[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      );
    }
  }
  
  return sanitized;
}

/**
 * التحقق من قوة كلمة المرور
 */
export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score += 1;
  else feedback.push('يجب أن تكون 8 أحرف على الأقل');
  
  if (password.length >= 12) score += 1;
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('أضف حرفاً كبيراً');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('أضف حرفاً صغيراً');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('أضف رقماً');
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push('أضف رمزاً خاصاً');
  
  // Common passwords check
  const common = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (common.some(p => password.toLowerCase().includes(p))) {
    score = Math.max(0, score - 2);
    feedback.push('تجنب كلمات المرور الشائعة');
  }
  
  return { score: Math.min(score, 5), feedback };
}

/**
 * تنظيف محتوى Markdown (يسمح بالتنسيق لكن يزيل الأكواد الخطيرة)
 */
export function sanitizeMarkdown(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  let clean = input;
  
  // إزالة سكريبتات HTML فقط
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, '');
  }
  
  // السماح بتنسيق Markdown العادي
  return clean.trim();
}
