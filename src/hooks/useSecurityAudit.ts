import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SecurityAudit {
  id: string;
  audit_type: string;
  status: 'passed' | 'warning' | 'failed' | 'error';
  findings: SecurityFinding[];
  summary: string | null;
  checks_passed: number;
  checks_failed: number;
  checks_warning: number;
  run_duration_ms: number | null;
  triggered_by: string;
  organization_id: string | null;
  created_at: string;
}

export interface SecurityFinding {
  check: string;
  severity: string;
  status: string;
  count?: number;
  details?: any;
  adoption_rate?: number;
  total_users?: number;
  '2fa_enabled'?: number;
  unresolved?: number;
  top_offenders?: any[];
}

export interface SecurityCheckSetting {
  id: string;
  check_name: string;
  is_enabled: boolean;
  severity: string;
  check_interval_hours: number;
  last_run_at: string | null;
  next_run_at: string | null;
  config: Record<string, any>;
}

// Fetch latest audits
export function useSecurityAudits(limit = 10) {
  return useQuery({
    queryKey: ['security-audits', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as SecurityAudit[];
    },
  });
}

// Fetch latest audit
export function useLatestSecurityAudit() {
  return useQuery({
    queryKey: ['security-audit-latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as SecurityAudit | null;
    },
  });
}

// Fetch check settings
export function useSecurityCheckSettings() {
  return useQuery({
    queryKey: ['security-check-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_check_settings')
        .select('*')
        .order('severity', { ascending: false });
      
      if (error) throw error;
      return data as SecurityCheckSetting[];
    },
  });
}

// Run manual security audit
export function useRunSecurityAudit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('run_security_audit');
      
      if (error) throw error;
      return data as {
        audit_id: string;
        status: string;
        passed: number;
        warning: number;
        failed: number;
        duration_ms: number;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['security-audits'] });
      queryClient.invalidateQueries({ queryKey: ['security-audit-latest'] });
      
      if (data.failed > 0) {
        toast.error(`تم اكتشاف ${data.failed} مشكلة أمنية`);
      } else if (data.warning > 0) {
        toast.warning(`${data.warning} تحذيرات أمنية`);
      } else {
        toast.success('الفحص الأمني اكتمل بنجاح');
      }
    },
    onError: (error) => {
      toast.error('فشل في تشغيل الفحص الأمني');
      console.error('Security audit error:', error);
    },
  });
}

// Check name labels
export const checkNameLabels: Record<string, string> = {
  inactive_users: 'المستخدمون غير النشطين',
  expired_api_keys: 'مفاتيح API منتهية الصلاحية',
  failed_login_attempts: 'محاولات الدخول الفاشلة',
  expired_licenses: 'الرخص المنتهية',
  expiring_contracts: 'العقود القريبة من الانتهاء',
  '2fa_adoption': 'نسبة استخدام المصادقة الثنائية',
  suspicious_activity: 'النشاط المشبوه',
  api_rate_violations: 'تجاوزات حد الاستخدام',
  weak_passwords: 'كلمات المرور الضعيفة',
  stale_sessions: 'الجلسات القديمة',
  permission_anomalies: 'شذوذ الصلاحيات',
};

// Status colors and labels
export const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  passed: { label: 'ناجح', color: 'text-green-600', bgColor: 'bg-green-100' },
  warning: { label: 'تحذير', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  failed: { label: 'فشل', color: 'text-red-600', bgColor: 'bg-red-100' },
  error: { label: 'خطأ', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};
