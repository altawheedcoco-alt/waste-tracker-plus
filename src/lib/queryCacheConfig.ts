import { QueryClient } from '@tanstack/react-query';

/**
 * استراتيجيات التخزين المؤقت الذكي حسب نوع البيانات
 * كل نوع بيانات له وقت staleness مختلف حسب طبيعته
 */

// فئات البيانات وأوقات التخزين المؤقت (بالمللي ثانية)
export const CACHE_PROFILES = {
  /** بيانات ثابتة نادراً ما تتغير (الإعدادات، الأنواع، المحافظات) */
  static: {
    staleTime: 60 * 60 * 1000,     // 1 ساعة
    gcTime: 24 * 60 * 60 * 1000,   // 24 ساعة
  },
  /** بيانات مرجعية تتغير قليلاً (المنظمات، الجهات المرتبطة، السائقين) */
  reference: {
    staleTime: 15 * 60 * 1000,     // 15 دقيقة
    gcTime: 60 * 60 * 1000,        // 1 ساعة
  },
  /** بيانات تشغيلية تتغير بانتظام (الشحنات، الفواتير) */
  operational: {
    staleTime: 5 * 60 * 1000,      // 5 دقائق
    gcTime: 30 * 60 * 1000,        // 30 دقيقة
  },
  /** بيانات لحظية تتغير باستمرار (الإشعارات، المواقع، الحالات) */
  realtime: {
    staleTime: 30 * 1000,          // 30 ثانية
    gcTime: 5 * 60 * 1000,         // 5 دقائق
  },
  /** بيانات تحليلية مكلفة الحساب (التقارير، الإحصائيات) */
  analytics: {
    staleTime: 30 * 60 * 1000,     // 30 دقيقة
    gcTime: 2 * 60 * 60 * 1000,    // ساعتان
  },
} as const;

export type CacheProfile = keyof typeof CACHE_PROFILES;

/**
 * خريطة أنماط مفاتيح الاستعلام إلى فئات التخزين المؤقت
 * تُطابق تلقائياً أي queryKey يبدأ بأحد هذه الأنماط
 */
const QUERY_KEY_PROFILES: Record<string, CacheProfile> = {
  // بيانات ثابتة
  'waste-types': 'static',
  'regions': 'static',
  'system-settings': 'static',
  'terms-content': 'static',
  'badges': 'static',
  'carbon-factors': 'static',

  // بيانات مرجعية
  'organization': 'reference',
  'organizations': 'reference',
  'partners': 'reference',
  'linked-partners': 'reference',
  'verified-partnerships': 'reference',
  'employees': 'reference',
  'employee-permissions': 'reference',
  'my-permissions': 'reference',
  'drivers': 'reference',
  'customers': 'reference',
  'vehicles': 'reference',
  'contracts': 'reference',
  'award-letters': 'reference',
  'signatories': 'reference',
  'profile': 'reference',
  'work-orders': 'operational',

  // بيانات تشغيلية
  'shipments': 'operational',
  'shipment': 'operational',
  'partner-shipments': 'operational',
  'invoices': 'operational',
  'deposits': 'operational',
  'ledger': 'operational',
  'approval-requests': 'operational',
  'weight-records': 'operational',

  // بيانات لحظية
  'notifications': 'realtime',
  'unread-count': 'realtime',
  'driver-location': 'realtime',
  'driver-locations': 'realtime',
  'call-logs': 'realtime',
  'chat-messages': 'realtime',
  'system-health': 'realtime',

  // بيانات تحليلية
  'analytics': 'analytics',
  'reports': 'analytics',
  'statistics': 'analytics',
  'carbon-footprint': 'analytics',
  'carbon-summary': 'analytics',
  'trends': 'analytics',
  'performance': 'analytics',
  'backup-logs': 'analytics',
  'admin-dashboard-stats': 'realtime',
};

/**
 * استنتاج فئة التخزين المؤقت من مفتاح الاستعلام
 */
export const getCacheProfile = (queryKey: readonly unknown[]): CacheProfile => {
  const firstKey = String(queryKey[0] ?? '').toLowerCase();
  
  // بحث مباشر
  if (QUERY_KEY_PROFILES[firstKey]) {
    return QUERY_KEY_PROFILES[firstKey];
  }

  // بحث جزئي (يبدأ بـ)
  for (const [pattern, profile] of Object.entries(QUERY_KEY_PROFILES)) {
    if (firstKey.startsWith(pattern) || firstKey.includes(pattern)) {
      return profile;
    }
  }

  // القيمة الافتراضية: تشغيلي
  return 'operational';
};

/**
 * الحصول على إعدادات التخزين المؤقت لمفتاح استعلام معين
 */
export const getCacheOptions = (queryKey: readonly unknown[]) => {
  const profile = getCacheProfile(queryKey);
  return CACHE_PROFILES[profile];
};

/**
 * إنشاء QueryClient ذكي مع تخزين مؤقت تكيّفي
 */
export const createSmartQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_PROFILES.operational.staleTime,
      gcTime: CACHE_PROFILES.operational.gcTime,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        if (error?.status === 404) return false;
        // المزيد من المحاولات عند ضعف الشبكة
        const connection = (navigator as any).connection;
        const maxRetries = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g' ? 4 : 3;
        return failureCount < maxRetries;
      },
      retryDelay: (attemptIndex) => {
        // تأخير أسي مع jitter لتجنب thundering herd
        const base = Math.min(1000 * 2 ** attemptIndex, 15000);
        return base + Math.random() * 1000;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      // استخدام البيانات القديمة أثناء إعادة الجلب
      keepPreviousData: true,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'offlineFirst',
    },
  },
});

/**
 * إبطال ذكي للكاش - يبطل فقط الاستعلامات المرتبطة
 */
export const smartInvalidate = (
  queryClient: QueryClient,
  primaryKey: string,
  relatedKeys?: string[]
) => {
  // إبطال المفتاح الأساسي
  queryClient.invalidateQueries({ queryKey: [primaryKey] });

  // إبطال المفاتيح المرتبطة
  if (relatedKeys) {
    relatedKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }
};

/**
 * خريطة الارتباطات: عند تغيير بيانات معينة، ما البيانات الأخرى التي يجب تحديثها؟
 */
export const INVALIDATION_MAP: Record<string, string[]> = {
  shipments: ['statistics', 'analytics', 'invoices', 'partner-shipments', 'reports', 'notifications', 'work-orders'],
  invoices: ['statistics', 'ledger', 'analytics', 'reports'],
  deposits: ['ledger', 'statistics', 'analytics'],
  drivers: ['driver-locations', 'shipments', 'transporter-drivers-summary'],
  organizations: ['partners', 'linked-partners', 'statistics', 'verified-partnerships'],
  'approval-requests': ['notifications', 'shipments', 'organizations'],
  'verified-partnerships': ['partners', 'linked-partners', 'notifications'],
  'work-orders': ['notifications', 'shipments'],
  'employee-permissions': ['my-permissions'],
  'delivery-confirmations': ['shipments', 'notifications'],
  contracts: ['award-letters', 'notifications'],
};

/**
 * إبطال تسلسلي ذكي - يتتبع الارتباطات تلقائياً
 */
export const cascadeInvalidate = (
  queryClient: QueryClient,
  changedKey: string
) => {
  smartInvalidate(
    queryClient,
    changedKey,
    INVALIDATION_MAP[changedKey]
  );
};
