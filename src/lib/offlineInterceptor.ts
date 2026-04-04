/**
 * Supabase Offline Interceptor - اعتراض شامل لكل عمليات الكتابة
 * يعمل كطبقة وسيطة (middleware) تلقائية بدون تعديل أي ملف موجود
 * 
 * عند فقدان الاتصال:
 * - insert/update/delete تُحفظ في IndexedDB تلقائياً
 * - عند عودة الاتصال تُزامن بالترتيب الصحيح
 * 
 * الاستخدام: استدعاء initOfflineInterceptor() مرة واحدة عند تشغيل التطبيق
 */

import { offlineStorage } from '@/lib/offlineStorage';

/** الجداول التي يجب اعتراض عمليات الكتابة عليها */
const INTERCEPTED_TABLES = new Set([
  // رسائل ودردشة (critical)
  'direct_messages', 'private_messages', 'channel_messages',
  'ai_agent_messages', 'meeting_chat_messages',
  // إشعارات
  'notifications', 'push_subscriptions',
  // عمليات تشغيلية (high)
  'shipments', 'shipment_logs', 'delivery_declarations',
  'invoices', 'collection_requests', 'work_orders',
  'accounting_ledger', 'deposits',
  // بيانات مستخدم
  'profiles', 'organization_members', 'activity_logs',
  'biometric_credentials',
  // تفاعلات اجتماعية
  'social_posts', 'social_comments', 'social_likes',
  'broadcast_posts', 'broadcast_comments',
  'story_views', 'reel_views',
  // مخزون ومعدات
  'mro_inventory', 'mro_usage_log',
  'waste_exchange_listings', 'waste_exchange_watchlist',
  // عقود وتوقيعات
  'contracts', 'signing_requests',
  'organization_signatures', 'organization_stamps',
  // اجتماعات ومكالمات
  'video_meetings', 'video_meeting_participants',
  'call_records',
  // إعلانات
  'advertisements', 'ad_analytics',
  // تقييمات
  'partner_ratings', 'customer_feedback',
  // واتساب
  'whatsapp_config', 'whatsapp_templates',
  // أكاديمية
  'academy_enrollments', 'academy_progress',
  // طلبات
  'ai_agent_orders', 'ai_agent_conversations',
]);

/** تحديد أولوية الجدول */
function getTablePriority(table: string): 'critical' | 'high' | 'normal' {
  const critical = ['direct_messages', 'private_messages', 'channel_messages', 'notifications'];
  const high = ['shipments', 'invoices', 'collection_requests', 'work_orders', 'accounting_ledger', 'deposits'];
  
  if (critical.includes(table)) return 'critical';
  if (high.includes(table)) return 'high';
  return 'normal';
}

/**
 * اعتراض fetch لتحويل عمليات الكتابة الفاشلة إلى عمليات أوفلاين
 */
export function initOfflineInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = init?.method || 'GET';

    // فقط اعترض عمليات الكتابة على Supabase REST API
    const isSupabaseWrite = 
      url.includes('supabase.co/rest/v1/') && 
      ['POST', 'PATCH', 'DELETE'].includes(method.toUpperCase());

    if (!isSupabaseWrite) {
      return originalFetch.call(window, input, init);
    }

    // استخراج اسم الجدول من الـ URL
    const tableMatch = url.match(/\/rest\/v1\/([^?]+)/);
    const table = tableMatch?.[1];

    if (!table || !INTERCEPTED_TABLES.has(table)) {
      return originalFetch.call(window, input, init);
    }

    // إذا متصل، حاول العملية العادية
    if (navigator.onLine) {
      try {
        const response = await originalFetch.call(window, input, init);
        
        // إذا نجحت، أرجعها كما هي
        if (response.ok || response.status < 500) {
          return response;
        }
        
        // خطأ سيرفر (500+) - احفظ أوفلاين
        console.warn(`[OfflineInterceptor] Server error ${response.status} for ${table}, queuing offline`);
      } catch (networkError) {
        // فشل الشبكة - احفظ أوفلاين
        console.warn(`[OfflineInterceptor] Network error for ${table}, queuing offline`);
      }
    }

    // --- حفظ أوفلاين ---
    try {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      
      let actionType: 'create' | 'update' | 'delete' = 'create';
      if (method.toUpperCase() === 'PATCH') actionType = 'update';
      if (method.toUpperCase() === 'DELETE') actionType = 'delete';

      await offlineStorage.addPendingAction({
        type: actionType,
        table,
        data: body,
        priority: getTablePriority(table),
        originalCreatedAt: new Date().toISOString(),
        meta: { intercepted: true, method, url },
      });

      console.log(`[OfflineInterceptor] ⏳ Queued ${actionType} on ${table}`);

      // أرجع response وهمي ناجح حتى لا ينكسر الكود
      return new Response(JSON.stringify(Array.isArray(body) ? body : [body]), {
        status: 201,
        statusText: 'Queued Offline',
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Queued': 'true',
        },
      });
    } catch (queueError) {
      console.error('[OfflineInterceptor] Failed to queue:', queueError);
      // فشل حتى الحفظ المحلي - أرجع خطأ
      return new Response(JSON.stringify({ error: 'Offline queue failed' }), {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
  };

  console.log('[OfflineInterceptor] ✅ Initialized — intercepting writes on', INTERCEPTED_TABLES.size, 'tables');
}

export default initOfflineInterceptor;
