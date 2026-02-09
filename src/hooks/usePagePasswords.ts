import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PagePassword {
  id: string;
  organization_id: string;
  page_path: string;
  page_name: string;
  is_active: boolean;
  created_at: string;
  recovery_methods?: RecoveryMethod[];
}

export interface RecoveryMethod {
  id: string;
  page_password_id: string;
  recovery_type: 'email' | 'phone' | 'security_question' | 'backup_code' | 'admin_reset' | 'otp';
  recovery_data: Record<string, any>;
  is_enabled: boolean;
}

// Simple hash function for page passwords (not auth passwords)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'page_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

// Available pages for protection
export const availablePages = [
  { path: '/dashboard', name: 'لوحة التحكم الرئيسية' },
  { path: '/dashboard/shipments', name: 'الشحنات' },
  { path: '/dashboard/shipments/new', name: 'إنشاء شحنة جديدة' },
  { path: '/dashboard/reports', name: 'التقارير' },
  { path: '/dashboard/accounting', name: 'المحاسبة' },
  { path: '/dashboard/contracts', name: 'العقود' },
  { path: '/dashboard/settings', name: 'الإعدادات' },
  { path: '/dashboard/users', name: 'إدارة المستخدمين' },
  { path: '/dashboard/drivers', name: 'السائقون' },
  { path: '/dashboard/organizations', name: 'الجهات' },
  { path: '/dashboard/tracking', name: 'التتبع' },
  { path: '/dashboard/certificates', name: 'الشهادات' },
  { path: '/dashboard/invoices', name: 'الفواتير' },
  { path: '/dashboard/deposits', name: 'الإيداعات' },
];

export const recoveryTypeLabels: Record<string, { label: string; icon: string; description: string }> = {
  email: { label: 'البريد الإلكتروني', icon: '📧', description: 'إرسال رابط استعادة عبر البريد' },
  phone: { label: 'رقم الهاتف', icon: '📱', description: 'إرسال رمز تحقق عبر SMS' },
  security_question: { label: 'سؤال الأمان', icon: '❓', description: 'الإجابة على سؤال أمان محدد مسبقاً' },
  backup_code: { label: 'رمز احتياطي', icon: '🔑', description: 'استخدام أحد الرموز الاحتياطية المولدة' },
  admin_reset: { label: 'مدير النظام', icon: '👨‍💼', description: 'طلب إعادة التعيين من مدير النظام' },
  otp: { label: 'رمز OTP', icon: '🔐', description: 'رمز مؤقت يُرسل للمصادقة الثنائية' },
};

export function usePagePasswords() {
  const { organization } = useAuth();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState<PagePassword[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPasswords = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('page_passwords')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch recovery methods for each password
      const passwordIds = (data || []).map(p => p.id);
      let recoveryData: any[] = [];
      if (passwordIds.length > 0) {
        const { data: rd } = await supabase
          .from('page_password_recovery')
          .select('*')
          .in('page_password_id', passwordIds);
        recoveryData = rd || [];
      }

      const enriched = (data || []).map(p => ({
        ...p,
        recovery_methods: recoveryData.filter(r => r.page_password_id === p.id),
      }));

      setPasswords(enriched);
    } catch (error) {
      console.error('Error fetching page passwords:', error);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  const addPagePassword = async (pagePath: string, pageName: string, password: string, recoveryConfig: Record<string, { enabled: boolean; data: Record<string, any> }>) => {
    if (!organization?.id) return;

    try {
      const hash = await hashPassword(password);
      
      const { data: pagePass, error } = await supabase
        .from('page_passwords')
        .insert({
          organization_id: organization.id,
          page_path: pagePath,
          page_name: pageName,
          password_hash: hash,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert recovery methods
      const recoveryInserts = Object.entries(recoveryConfig).map(([type, config]) => ({
        page_password_id: pagePass.id,
        recovery_type: type,
        recovery_data: config.data,
        is_enabled: config.enabled,
      }));

      if (recoveryInserts.length > 0) {
        await supabase.from('page_password_recovery').insert(recoveryInserts);
      }

      // Generate backup codes if backup_code recovery is enabled
      if (recoveryConfig.backup_code?.enabled) {
        const codes = Array.from({ length: 8 }, () => 
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );
        const codeInserts = await Promise.all(codes.map(async (code) => ({
          page_password_id: pagePass.id,
          code_hash: await hashPassword(code),
        })));
        await supabase.from('page_password_backup_codes').insert(codeInserts);
      }

      toast({ title: 'تم بنجاح', description: `تم تفعيل حماية صفحة "${pageName}"` });
      fetchPasswords();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const removePagePassword = async (id: string) => {
    try {
      const { error } = await supabase.from('page_passwords').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم بنجاح', description: 'تم إزالة حماية الصفحة' });
      fetchPasswords();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const togglePagePassword = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('page_passwords').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      fetchPasswords();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const isPageProtected = useCallback((path: string) => {
    return passwords.find(p => p.is_active && path.startsWith(p.page_path));
  }, [passwords]);

  return {
    passwords,
    loading,
    addPagePassword,
    removePagePassword,
    togglePagePassword,
    isPageProtected,
    fetchPasswords,
  };
}
