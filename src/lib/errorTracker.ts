/**
 * Error Tracker - نظام تتبع الأخطاء المركزي
 * يجمع ويصنف الأخطاء مع إشعارات للمدير
 */

import { supabase } from '@/integrations/supabase/client';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'network' | 'validation' | 'auth' | 'database' | 'ai' | 'unknown';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  timestamp: string;
  resolved: boolean;
  occurrences: number;
}

class ErrorTracker {
  private errors: Map<string, TrackedError> = new Map();
  private maxErrors = 100;
  private notifyAdminThreshold = 5; // عدد الأخطاء قبل الإشعار

  /**
   * تتبع خطأ جديد
   */
  async track(
    error: Error | string,
    severity: ErrorSeverity = 'medium',
    context: ErrorContext = {}
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    const category = this.categorizeError(errorMessage);
    
    // إنشاء hash فريد للخطأ
    const errorHash = this.hashError(errorMessage, category);
    
    // تحديث أو إضافة الخطأ
    const existing = this.errors.get(errorHash);
    if (existing) {
      existing.occurrences++;
      existing.timestamp = new Date().toISOString();
      
      // إشعار إذا تجاوز العتبة
      if (existing.occurrences === this.notifyAdminThreshold) {
        await this.notifyAdmin(existing);
      }
    } else {
      const newError: TrackedError = {
        id: errorHash,
        message: errorMessage,
        stack: errorStack,
        severity,
        category,
        context,
        timestamp: new Date().toISOString(),
        resolved: false,
        occurrences: 1,
      };
      
      this.errors.set(errorHash, newError);
      
      // إشعار فوري للأخطاء الحرجة
      if (severity === 'critical') {
        await this.notifyAdmin(newError);
      }
    }

    // تنظيف إذا تجاوز الحد
    if (this.errors.size > this.maxErrors) {
      this.cleanup();
    }

    // تسجيل في console للتطوير
    console.error(`[ErrorTracker] ${severity.toUpperCase()}:`, errorMessage, context);
  }

  /**
   * تصنيف الخطأ تلقائياً
   */
  private categorizeError(message: string): ErrorCategory {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('timeout')) {
      return 'network';
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') || lowerMessage.includes('required')) {
      return 'validation';
    }
    if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized') || lowerMessage.includes('403') || lowerMessage.includes('401')) {
      return 'auth';
    }
    if (lowerMessage.includes('database') || lowerMessage.includes('supabase') || lowerMessage.includes('rls') || lowerMessage.includes('postgres')) {
      return 'database';
    }
    if (lowerMessage.includes('ai') || lowerMessage.includes('gemini') || lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
      return 'ai';
    }
    
    return 'unknown';
  }

  /**
   * إنشاء hash فريد للخطأ
   */
  private hashError(message: string, category: ErrorCategory): string {
    const str = `${category}:${message.substring(0, 100)}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `err_${Math.abs(hash).toString(16)}`;
  }

  /**
   * إشعار المدير بالأخطاء الحرجة
   */
  private async notifyAdmin(error: TrackedError): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await (supabase.from('notifications') as any).insert({
        user_id: null, // للمدير
        title: `⚠️ خطأ ${error.severity === 'critical' ? 'حرج' : 'متكرر'}: ${error.category}`,
        message: `${error.message.substring(0, 200)}${error.occurrences > 1 ? ` (تكرر ${error.occurrences} مرات)` : ''}`,
        type: 'system_alert',
        priority: error.severity === 'critical' ? 'urgent' : 'high',
        metadata: {
          errorId: error.id,
          category: error.category,
          occurrences: error.occurrences,
          context: error.context,
        },
      });
    } catch (e) {
      console.error('Failed to notify admin:', e);
    }
  }

  /**
   * تنظيف الأخطاء القديمة
   */
  private cleanup(): void {
    const sortedErrors = Array.from(this.errors.entries())
      .sort((a, b) => new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime());
    
    // الاحتفاظ بأحدث 50 خطأ فقط
    const toKeep = sortedErrors.slice(0, 50);
    this.errors = new Map(toKeep);
  }

  /**
   * الحصول على جميع الأخطاء
   */
  getErrors(): TrackedError[] {
    return Array.from(this.errors.values());
  }

  /**
   * الحصول على إحصائيات الأخطاء
   */
  getStats(): { total: number; byCategory: Record<ErrorCategory, number>; bySeverity: Record<ErrorSeverity, number> } {
    const errors = this.getErrors();
    
    const byCategory: Record<ErrorCategory, number> = {
      network: 0, validation: 0, auth: 0, database: 0, ai: 0, unknown: 0,
    };
    
    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0, medium: 0, high: 0, critical: 0,
    };
    
    errors.forEach(err => {
      byCategory[err.category]++;
      bySeverity[err.severity]++;
    });
    
    return { total: errors.length, byCategory, bySeverity };
  }

  /**
   * مسح خطأ محدد
   */
  resolve(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
    }
  }

  /**
   * مسح جميع الأخطاء
   */
  clearAll(): void {
    this.errors.clear();
  }
}

// مثيل مشترك
export const errorTracker = new ErrorTracker();

/**
 * دالة مساعدة للتتبع السريع
 */
export const trackError = (
  error: Error | string,
  severity?: ErrorSeverity,
  context?: ErrorContext
) => errorTracker.track(error, severity, context);

export default errorTracker;
