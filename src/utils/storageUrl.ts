/**
 * أداة مركزية للحصول على روابط ملفات التخزين
 * تستخدم Signed URLs للباكتات الخاصة و Public URLs للعامة
 */
import { supabase } from '@/integrations/supabase/client';

// الباكتات العامة - لا تحتاج signed URL
const PUBLIC_BUCKETS = new Set(['organization-posts', 'profile-media', 'public-assets']);

// مدة صلاحية الرابط بالثواني (24 ساعة)
const DEFAULT_EXPIRY = 24 * 60 * 60;

// كاش مؤقت للروابط المولّدة (لتجنب طلبات متكررة)
const urlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * الحصول على رابط صالح لملف في التخزين
 * يستخدم signed URL للباكتات الخاصة تلقائياً
 */
export const getStorageUrl = async (
  bucket: string,
  path: string,
  expirySeconds = DEFAULT_EXPIRY
): Promise<string | null> => {
  if (!path) return null;

  const cacheKey = `${bucket}/${path}`;
  const now = Date.now();

  // تحقق من الكاش
  const cached = urlCache.get(cacheKey);
  if (cached && cached.expiresAt > now + 60000) {
    return cached.url;
  }

  try {
    if (PUBLIC_BUCKETS.has(bucket)) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }

    // باكت خاص - استخدم signed URL
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expirySeconds);

    if (error) {
      console.warn(`⚠️ فشل إنشاء رابط موقّع لـ ${cacheKey}:`, error.message);
      // fallback to public URL
      const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(path);
      return pubData.publicUrl;
    }

    // خزّن في الكاش
    urlCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt: now + expirySeconds * 1000,
    });

    return data.signedUrl;
  } catch (err) {
    console.error(`❌ خطأ في الحصول على رابط ${cacheKey}:`, err);
    return null;
  }
};

/**
 * الحصول على روابط لعدة ملفات بالتوازي
 */
export const getStorageUrls = async (
  bucket: string,
  paths: string[]
): Promise<(string | null)[]> => {
  return Promise.all(paths.map((path) => getStorageUrl(bucket, path)));
};

/**
 * استخراج اسم الباكت والمسار من رابط Supabase كامل
 */
export const parseStorageUrl = (url: string): { bucket: string; path: string } | null => {
  try {
    const match = url.match(/\/storage\/v1\/(?:object\/(?:public|sign))\/([\w-]+)\/(.+?)(?:\?|$)/);
    if (match) {
      return { bucket: match[1], path: decodeURIComponent(match[2]) };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * تحويل رابط عام/منتهي إلى رابط صالح
 */
export const refreshStorageUrl = async (url: string): Promise<string | null> => {
  const parsed = parseStorageUrl(url);
  if (!parsed) return url; // ليس رابط تخزين - أعده كما هو
  return getStorageUrl(parsed.bucket, parsed.path);
};

/**
 * مسح كاش الروابط
 */
export const clearUrlCache = () => urlCache.clear();

/**
 * إصلاح روابط التخزين القديمة التي تشير لمشروع Supabase سابق
 * يستبدل الدومين القديم بالدومين الحالي
 */
const CURRENT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const OLD_SUPABASE_PATTERNS = [
  'jejwizkssmqzxwseqsre.supabase.co',
  // أضف أي دومينات قديمة أخرى هنا
];

export const fixStorageUrl = (url: string): string => {
  if (!url) return url;
  try {
    const currentHost = new URL(CURRENT_SUPABASE_URL).host;
    for (const oldPattern of OLD_SUPABASE_PATTERNS) {
      if (url.includes(oldPattern)) {
        return url.replace(oldPattern, currentHost);
      }
    }
  } catch {
    // ignore
  }
  return url;
};
