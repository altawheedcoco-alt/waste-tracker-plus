/**
 * Rate Limiter - نظام تحديد معدل الطلبات
 * يحمي من الهجمات والاستخدام المفرط
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private cache: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: number | null = null;

  constructor() {
    // تنظيف دوري كل 5 دقائق
    if (typeof window !== 'undefined') {
      this.cleanupInterval = window.setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * فحص وتسجيل طلب جديد
   */
  checkLimit(config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
    const key = config.identifier || 'global';
    const now = Date.now();
    const entry = this.cache.get(key);

    // إذا لم يوجد سجل أو انتهت النافذة الزمنية
    if (!entry || now > entry.resetTime) {
      this.cache.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetIn: config.windowMs,
      };
    }

    // تجاوز الحد
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.resetTime - now,
      };
    }

    // زيادة العداد
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  /**
   * تنظيف السجلات القديمة
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.resetTime) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * إعادة تعيين حد معين
   */
  reset(identifier: string) {
    this.cache.delete(identifier);
  }

  /**
   * تدمير المثيل
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// مثيل مشترك
export const rateLimiter = new RateLimiter();

// إعدادات مسبقة للحدود
export const RATE_LIMITS = {
  // API عامة
  PUBLIC_API: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 طلبات/دقيقة
  
  // تسجيل الدخول
  AUTH: { maxRequests: 5, windowMs: 5 * 60 * 1000 }, // 5 محاولات/5 دقائق
  
  // AI requests
  AI_ASSISTANT: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 طلب/دقيقة
  
  // إنشاء الشحنات
  CREATE_SHIPMENT: { maxRequests: 30, windowMs: 60 * 1000 }, // 30/دقيقة
  
  // تحميل الملفات
  FILE_UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 ملفات/دقيقة
  
  // إرسال النماذج
  FORM_SUBMIT: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 نماذج/دقيقة
} as const;

/**
 * Hook للاستخدام في React
 */
export const useRateLimiter = () => {
  return {
    check: (config: RateLimitConfig) => rateLimiter.checkLimit(config),
    reset: (identifier: string) => rateLimiter.reset(identifier),
  };
};

export default rateLimiter;
