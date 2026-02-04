import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type SecurityEventType = 
  | 'login_success' 
  | 'login_failed' 
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_failed'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'permission_change'
  | 'suspicious_activity'
  | 'brute_force_detected'
  | 'session_hijack_attempt'
  | 'unauthorized_access'
  | 'data_export'
  | 'bulk_delete'
  | 'admin_action';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  id: string;
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  user_id: string | null;
  organization_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  location_info: Record<string, any> | null;
  event_data: Record<string, any>;
  is_suspicious: boolean;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface SecuritySummary {
  total_events: number;
  critical_events: number;
  high_events: number;
  suspicious_events: number;
  unresolved_events: number;
  login_failures: number;
  api_key_events: number;
}

export interface SecurityEventsFilters {
  eventType?: SecurityEventType;
  severity?: SecuritySeverity;
  isSuspicious?: boolean;
  isResolved?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// Fetch security events
export function useSecurityEvents(filters?: SecurityEventsFilters) {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['security-events', filters],
    queryFn: async () => {
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.isSuspicious !== undefined) {
        query = query.eq('is_suspicious', filters.isSuspicious);
      }
      if (filters?.isResolved !== undefined) {
        query = query.eq('is_resolved', filters.isResolved);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      
      query = query.limit(filters?.limit || 100);
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as SecurityEvent[];
    },
    enabled: !!profile,
  });
}

// Fetch security summary
export function useSecuritySummary(organizationId?: string, days = 7) {
  return useQuery({
    queryKey: ['security-summary', organizationId, days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_security_summary', { 
          p_organization_id: organizationId || null,
          p_days: days 
        });
      
      if (error) throw error;
      return (data?.[0] || {
        total_events: 0,
        critical_events: 0,
        high_events: 0,
        suspicious_events: 0,
        unresolved_events: 0,
        login_failures: 0,
        api_key_events: 0,
      }) as SecuritySummary;
    },
  });
}

// Check brute force
export function useBruteForceCheck(userId?: string, ipAddress?: string) {
  return useQuery({
    queryKey: ['brute-force-check', userId, ipAddress],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('check_brute_force', {
          p_user_id: userId || null,
          p_ip_address: ipAddress || null,
        });
      
      if (error) throw error;
      return data?.[0] as { is_blocked: boolean; failed_attempts: number; last_attempt: string } | null;
    },
    enabled: !!(userId || ipAddress),
  });
}

// Log security event
export function useLogSecurityEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      eventType: SecurityEventType;
      severity: SecuritySeverity;
      userId?: string;
      organizationId?: string;
      ipAddress?: string;
      userAgent?: string;
      eventData?: Record<string, any>;
      isSuspicious?: boolean;
    }) => {
      const { data, error } = await supabase
        .rpc('log_security_event', {
          p_event_type: params.eventType,
          p_severity: params.severity,
          p_user_id: params.userId || null,
          p_organization_id: params.organizationId || null,
          p_ip_address: params.ipAddress || null,
          p_user_agent: params.userAgent || null,
          p_event_data: params.eventData || {},
          p_is_suspicious: params.isSuspicious || false,
        });
      
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      queryClient.invalidateQueries({ queryKey: ['security-summary'] });
    },
  });
}

// Resolve security event
export function useResolveSecurityEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { eventId: string; resolutionNotes?: string }) => {
      const { data, error } = await supabase
        .rpc('resolve_security_event', {
          p_event_id: params.eventId,
          p_resolution_notes: params.resolutionNotes || null,
        });
      
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      queryClient.invalidateQueries({ queryKey: ['security-summary'] });
      toast.success('تم حل الحدث الأمني');
    },
    onError: () => {
      toast.error('فشل في حل الحدث');
    },
  });
}

// Event type labels in Arabic
export const eventTypeLabels: Record<SecurityEventType, string> = {
  login_success: 'تسجيل دخول ناجح',
  login_failed: 'فشل تسجيل الدخول',
  logout: 'تسجيل خروج',
  password_change: 'تغيير كلمة المرور',
  password_reset_request: 'طلب استعادة كلمة المرور',
  '2fa_enabled': 'تفعيل المصادقة الثنائية',
  '2fa_disabled': 'إلغاء المصادقة الثنائية',
  '2fa_failed': 'فشل المصادقة الثنائية',
  api_key_created: 'إنشاء مفتاح API',
  api_key_revoked: 'إلغاء مفتاح API',
  permission_change: 'تغيير الصلاحيات',
  suspicious_activity: 'نشاط مشبوه',
  brute_force_detected: 'اكتشاف محاولة اختراق',
  session_hijack_attempt: 'محاولة اختطاف جلسة',
  unauthorized_access: 'محاولة وصول غير مصرح',
  data_export: 'تصدير بيانات',
  bulk_delete: 'حذف جماعي',
  admin_action: 'إجراء إداري',
};

// Severity labels and colors
export const severityConfig: Record<SecuritySeverity, { label: string; color: string; bgColor: string }> = {
  low: { label: 'منخفض', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  medium: { label: 'متوسط', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  high: { label: 'عالي', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  critical: { label: 'حرج', color: 'text-red-600', bgColor: 'bg-red-100' },
};
