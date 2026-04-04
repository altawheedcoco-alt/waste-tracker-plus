/**
 * Supabase Offline Interceptor v2 - اعتراض شامل للقراءة والكتابة
 * يعمل كطبقة وسيطة تلقائية بدون تعديل أي ملف موجود
 * 
 * عند فقدان الاتصال:
 * - GET: تُقدم من كاش IndexedDB تلقائياً
 * - insert/update/delete: تُحفظ في IndexedDB وتُزامن عند العودة
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

/** جداول إضافية يُكاش قراءتها فقط */
const READ_CACHE_TABLES = new Set([
  ...INTERCEPTED_TABLES,
  'organizations', 'waste_types', 'waste_categories',
  'academy_courses', 'ad_plans', 'ad_coupons',
  'ai_agent_configs', 'ai_agent_knowledge',
  'ai_platform_config', 'ai_documents',
  'external_partners', 'account_periods',
  'aggregate_invoices', 'achievement_definitions',
]);

/** TTL لكاش القراءة بالمللي ثانية حسب الجدول */
function getReadCacheTTL(table: string): number {
  const shortTTL = ['notifications', 'direct_messages', 'private_messages', 'channel_messages', 'shipment_logs'];
  const mediumTTL = ['shipments', 'invoices', 'collection_requests', 'work_orders'];
  
  if (shortTTL.includes(table)) return 2 * 60 * 1000;      // 2 دقائق
  if (mediumTTL.includes(table)) return 10 * 60 * 1000;     // 10 دقائق
  return 30 * 60 * 1000;                                     // 30 دقيقة
}

/** تحديد أولوية الجدول */
function getTablePriority(table: string): 'critical' | 'high' | 'normal' {
  const critical = ['direct_messages', 'private_messages', 'channel_messages', 'notifications'];
  const high = ['shipments', 'invoices', 'collection_requests', 'work_orders', 'accounting_ledger', 'deposits'];
  
  if (critical.includes(table)) return 'critical';
  if (high.includes(table)) return 'high';
  return 'normal';
}

/** إنشاء مفتاح كاش فريد من الـ URL */
function buildCacheKey(url: string): string {
  try {
    const u = new URL(url);
    // إزالة apikey من المعاملات لأنها لا تؤثر على البيانات
    u.searchParams.delete('apikey');
    return `rest_cache_${u.pathname}${u.search}`;
  } catch {
    return `rest_cache_${url.slice(0, 200)}`;
  }
}

/**
 * اعتراض fetch لتحويل عمليات الكتابة الفاشلة إلى عمليات أوفلاين
 * + كاش القراءة تلقائياً
 */
export function initOfflineInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = (init?.method || 'GET').toUpperCase();

    // هل هذا طلب Supabase REST API؟
    const isSupabaseRest = url.includes('supabase.co/rest/v1/');
    if (!isSupabaseRest) {
      return originalFetch.call(window, input, init);
    }

    // استخراج اسم الجدول
    const tableMatch = url.match(/\/rest\/v1\/([^?]+)/);
    const table = tableMatch?.[1];
    if (!table) {
      return originalFetch.call(window, input, init);
    }

    // ======= معالجة القراءة (GET) =======
    if (method === 'GET' && READ_CACHE_TABLES.has(table)) {
      return handleReadRequest(originalFetch, input, init, url, table);
    }

    // ======= معالجة الكتابة (POST/PATCH/DELETE) =======
    if (['POST', 'PATCH', 'DELETE'].includes(method) && INTERCEPTED_TABLES.has(table)) {
      return handleWriteRequest(originalFetch, input, init, url, table, method);
    }

    return originalFetch.call(window, input, init);
  };

  console.log('[OfflineInterceptor] ✅ v2 Initialized — read+write interception on', READ_CACHE_TABLES.size, 'tables');
}

/** معالجة طلبات القراءة مع كاش ذكي */
async function handleReadRequest(
  originalFetch: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  url: string,
  table: string
): Promise<Response> {
  const cacheKey = buildCacheKey(url);

  if (navigator.onLine) {
    try {
      const response = await originalFetch.call(window, input, init);
      if (response.ok) {
        // كاش الاستجابة الناجحة
        const clone = response.clone();
        clone.json().then(data => {
          offlineStorage.setCache(cacheKey, data, getReadCacheTTL(table)).catch(() => {});
        }).catch(() => {});
        return response;
      }
      // خطأ سيرفر - حاول الكاش
      if (response.status >= 500) {
        const cached = await offlineStorage.getCache<any>(cacheKey);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' },
          });
        }
      }
      return response;
    } catch {
      // فشل الشبكة - اذهب للكاش
    }
  }

  // أوفلاين أو فشل - خدمة من الكاش
  const cached = await offlineStorage.getCache<any>(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      statusText: 'OK (Cached)',
      headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' },
    });
  }

  // حاول من بيانات التحميل المسبق
  const preloaded = await offlineStorage.getCache<any>(`preload_${table}`);
  if (preloaded) {
    return new Response(JSON.stringify(preloaded), {
      status: 200,
      statusText: 'OK (Preloaded)',
      headers: { 'Content-Type': 'application/json', 'X-Offline-Preload': 'true' },
    });
  }

  // لا يوجد كاش - أرجع مصفوفة فارغة بدلاً من خطأ
  return new Response(JSON.stringify([]), {
    status: 200,
    statusText: 'OK (Empty Offline)',
    headers: { 'Content-Type': 'application/json', 'X-Offline-Empty': 'true' },
  });
}

/** معالجة طلبات الكتابة مع قائمة انتظار */
async function handleWriteRequest(
  originalFetch: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  url: string,
  table: string,
  method: string
): Promise<Response> {
  // إذا متصل، حاول العملية العادية
  if (navigator.onLine) {
    try {
      const response = await originalFetch.call(window, input, init);
      
      if (response.ok || response.status < 500) {
        return response;
      }
      
      console.warn(`[OfflineInterceptor] Server error ${response.status} for ${table}, queuing offline`);
    } catch {
      console.warn(`[OfflineInterceptor] Network error for ${table}, queuing offline`);
    }
  }

  // --- حفظ أوفلاين ---
  try {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    
    let actionType: 'create' | 'update' | 'delete' = 'create';
    if (method === 'PATCH') actionType = 'update';
    if (method === 'DELETE') actionType = 'delete';

    await offlineStorage.addPendingAction({
      type: actionType,
      table,
      data: body,
      priority: getTablePriority(table),
      originalCreatedAt: new Date().toISOString(),
      meta: { intercepted: true, method, url },
    });

    console.log(`[OfflineInterceptor] ⏳ Queued ${actionType} on ${table}`);

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
    return new Response(JSON.stringify({ error: 'Offline queue failed' }), {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

export default initOfflineInterceptor;
