/**
 * useBranding — جلب إعدادات الهوية البصرية (اللوجو واسم النظام)
 * يُستخدم في الإشعارات والمستندات والهيدر
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BrandingData {
  system_name: string;
  system_name_en: string;
  logo_url: string;
  notification_logo_url: string;
  tagline: string;
  tagline_en: string;
  primary_color: string;
}

const DEFAULT: BrandingData = {
  system_name: 'آي ريسايكل — منصة حلول إدارة المخلفات',
  system_name_en: 'iRecycle — Waste Management Solution Platform',
  logo_url: '',
  notification_logo_url: '',
  tagline: 'نحو مستقبل أنظف',
  tagline_en: 'Towards a cleaner future',
  primary_color: '#22996E',
};

export function useBranding() {
  return useQuery({
    queryKey: ['platform-branding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('id', 'branding')
        .maybeSingle();
      if (error) throw error;
      return { ...DEFAULT, ...(data?.value as any || {}) } as BrandingData;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

/** دالة مساعدة لجلب البراندنج بدون hook (للاستخدام في services) */
export async function fetchBranding(): Promise<BrandingData> {
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('id', 'branding')
    .maybeSingle();
  return { ...DEFAULT, ...(data?.value as any || {}) };
}
