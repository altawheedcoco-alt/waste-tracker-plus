/**
 * AI Fallback System - نظام احتياطي للذكاء الاصطناعي
 * يوفر ردود بديلة عند تعطل خدمات AI أو تجاوز الحدود
 */

import { rateLimiter, RATE_LIMITS } from './rateLimiter';
import { trackError } from './errorTracker';

// ردود احتياطية حسب السياق
const FALLBACK_RESPONSES: Record<string, string[]> = {
  greeting: [
    'مرحباً! كيف يمكنني مساعدتك اليوم؟',
    'أهلاً بك! أنا هنا لمساعدتك.',
    'مرحباً بك في منصة آي ريسايكل!',
  ],
  shipment: [
    'للاستفسار عن شحنتك، يمكنك التوجه لصفحة الشحنات في لوحة التحكم أو الاتصال بالدعم الفني.',
    'يمكنك تتبع شحنتك من خلال رقم التتبع في صفحة "شحناتي".',
    'لمعرفة حالة الشحنة، استخدم صفحة إدارة الشحنات.',
  ],
  support: [
    'فريق الدعم متاح على مدار الساعة. يمكنك فتح تذكرة دعم من خلال الأيقونة في الأسفل.',
    'للحصول على مساعدة فورية، يرجى التواصل مع فريق الدعم عبر الهاتف أو البريد الإلكتروني.',
    'نعتذر عن أي تأخير. سيتم الرد على استفسارك في أقرب وقت ممكن.',
  ],
  error: [
    'عذراً، نواجه بعض المشاكل التقنية حالياً. يرجى المحاولة لاحقاً.',
    'حدث خطأ غير متوقع. فريقنا يعمل على حله.',
    'نعتذر عن هذا الخلل. يمكنك التواصل مع الدعم للمساعدة.',
  ],
  rateLimit: [
    'لقد وصلت للحد الأقصى من الطلبات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.',
    'عدد كبير من الطلبات. يرجى الانتظار دقيقة واحدة.',
    'تم تجاوز حد الاستخدام. يرجى المحاولة بعد قليل.',
  ],
  default: [
    'شكراً لتواصلك! سنقوم بالرد على استفسارك في أقرب وقت.',
    'تم استلام رسالتك. سيتم مراجعتها والرد عليك.',
    'نشكر صبرك. سنعود إليك قريباً.',
  ],
};

// أنماط للكشف عن نوع الاستفسار
const INTENT_PATTERNS: Record<string, RegExp[]> = {
  greeting: [/^(مرحبا|أهلا|السلام|هاي|hello|hi)/i],
  shipment: [/شحن|تتبع|رقم|طلب|حالة|shipment|track/i],
  support: [/مساعد|دعم|مشكل|استفسار|help|support|problem/i],
};

/**
 * كشف نية المستخدم من الرسالة
 */
function detectIntent(message: string): string {
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return intent;
      }
    }
  }
  return 'default';
}

/**
 * اختيار رد عشوائي من القائمة
 */
function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
}

export interface AIFallbackResult {
  response: string;
  isFallback: boolean;
  reason?: 'rate_limit' | 'error' | 'timeout' | 'offline';
  retryAfter?: number;
}

/**
 * فحص إمكانية استخدام AI
 */
export function canUseAI(userId: string): { allowed: boolean; retryAfter?: number } {
  const result = rateLimiter.checkLimit({
    ...RATE_LIMITS.AI_ASSISTANT,
    identifier: `ai_${userId}`,
  });
  
  return {
    allowed: result.allowed,
    retryAfter: result.allowed ? undefined : Math.ceil(result.resetIn / 1000),
  };
}

/**
 * الحصول على رد احتياطي
 */
export function getFallbackResponse(
  message: string,
  reason: AIFallbackResult['reason'] = 'error'
): AIFallbackResult {
  let responses: string[];
  
  if (reason === 'rate_limit') {
    responses = FALLBACK_RESPONSES.rateLimit;
  } else {
    const intent = detectIntent(message);
    responses = FALLBACK_RESPONSES[intent] || FALLBACK_RESPONSES.default;
  }
  
  return {
    response: getRandomResponse(responses),
    isFallback: true,
    reason,
  };
}

/**
 * معالج AI مع fallback تلقائي
 */
export async function handleAIRequest<T>(
  userId: string,
  request: () => Promise<T>,
  options: {
    timeout?: number;
    onFallback?: (result: AIFallbackResult) => void;
    message?: string;
  } = {}
): Promise<T | AIFallbackResult> {
  const { timeout = 30000, onFallback, message = '' } = options;
  
  // فحص Rate Limit
  const canUse = canUseAI(userId);
  if (!canUse.allowed) {
    const fallback = getFallbackResponse(message, 'rate_limit');
    fallback.retryAfter = canUse.retryAfter;
    onFallback?.(fallback);
    trackError('AI Rate limit exceeded', 'medium', { userId, action: 'ai_request' });
    return fallback;
  }
  
  // فحص الاتصال
  if (!navigator.onLine) {
    const fallback = getFallbackResponse(message, 'offline');
    onFallback?.(fallback);
    return fallback;
  }
  
  try {
    // تنفيذ مع timeout
    const result = await Promise.race([
      request(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout')), timeout)
      ),
    ]);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = errorMessage.includes('timeout');
    const isRateLimit = errorMessage.includes('429') || errorMessage.includes('rate');
    
    trackError(error instanceof Error ? error : errorMessage, 'high', {
      userId,
      action: 'ai_request',
      metadata: { isTimeout, isRateLimit },
    });
    
    const fallback = getFallbackResponse(
      message,
      isTimeout ? 'timeout' : isRateLimit ? 'rate_limit' : 'error'
    );
    
    onFallback?.(fallback);
    return fallback;
  }
}

/**
 * قائمة انتظار للطلبات عند تجاوز الحد
 */
class AIRequestQueue {
  private queue: Array<{
    id: string;
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private retryDelay = 60000; // دقيقة واحدة

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id: `req_${Date.now()}`,
        request,
        resolve,
        reject,
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    const item = this.queue.shift()!;
    
    try {
      const result = await item.request();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }
    
    // انتظار قبل الطلب التالي
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.process();
  }

  get length() {
    return this.queue.length;
  }

  clear() {
    this.queue.forEach(item => item.reject(new Error('Queue cleared')));
    this.queue = [];
  }
}

export const aiRequestQueue = new AIRequestQueue();

export default {
  canUseAI,
  getFallbackResponse,
  handleAIRequest,
  aiRequestQueue,
};
