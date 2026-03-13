import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AutoActionsSettings {
  id: string;
  organization_id: string;
  all_actions_enabled: boolean;
  // Documents
  auto_delivery_certificate: boolean;
  auto_receipt_generation: boolean;
  auto_manifest_generation: boolean;
  auto_invoice_generation: boolean;
  auto_tracking_form: boolean;
  // Notifications
  auto_shipment_notifications: boolean;
  auto_status_change_alerts: boolean;
  auto_partner_notifications: boolean;
  auto_whatsapp_notifications: boolean;
  auto_email_notifications: boolean;
  // Operations
  auto_shipment_status_update: boolean;
  auto_weight_reconciliation: boolean;
  auto_compliance_check: boolean;
  auto_archive_documents: boolean;
  auto_signature_request: boolean;
  // AI
  auto_waste_classification: boolean;
  auto_route_optimization: boolean;
  auto_fraud_detection: boolean;
  auto_price_calculation: boolean;
}

// All toggle keys (excluding id, organization_id, metadata)
export const AUTO_ACTION_KEYS = [
  'auto_delivery_certificate', 'auto_receipt_generation', 'auto_manifest_generation',
  'auto_invoice_generation', 'auto_tracking_form',
  'auto_shipment_notifications', 'auto_status_change_alerts', 'auto_partner_notifications',
  'auto_whatsapp_notifications', 'auto_email_notifications',
  'auto_shipment_status_update', 'auto_weight_reconciliation', 'auto_compliance_check',
  'auto_archive_documents', 'auto_signature_request',
  'auto_waste_classification', 'auto_route_optimization', 'auto_fraud_detection',
  'auto_price_calculation',
] as const;

export type AutoActionKey = typeof AUTO_ACTION_KEYS[number];

export const AUTO_ACTION_LABELS: Record<AutoActionKey, { ar: string; en: string; group: string; trigger?: string }> = {
  auto_delivery_certificate: { ar: 'إصدار إقرارات التسليم/الاستلام تلقائياً', en: 'Auto delivery declarations', group: 'documents', trigger: 'عند تسجيل/اعتماد أو تسليم الشحنة' },
  auto_receipt_generation: { ar: 'إصدار شهادات الاستلام تلقائياً', en: 'Auto receipt generation', group: 'documents', trigger: 'عند استلام الناقل للشحنة أو تسليمها' },
  auto_manifest_generation: { ar: 'إصدار المانيفست تلقائياً', en: 'Auto manifest generation', group: 'documents', trigger: 'عند بدء نقل الشحنة (in_transit)' },
  auto_invoice_generation: { ar: 'إصدار الفواتير تلقائياً', en: 'Auto invoice generation', group: 'documents', trigger: 'عند اكتمال الشحنة (completed/confirmed)' },
  auto_tracking_form: { ar: 'إصدار نماذج التتبع تلقائياً', en: 'Auto tracking forms', group: 'documents', trigger: 'عند تحميل الشحنة (loading)' },
  auto_shipment_notifications: { ar: 'إشعارات الشحنات', en: 'Shipment notifications', group: 'notifications', trigger: 'عند أي تغيير في حالة الشحنة' },
  auto_status_change_alerts: { ar: 'تنبيهات تغيير الحالة', en: 'Status change alerts', group: 'notifications', trigger: 'عند انتقال الشحنة لمرحلة جديدة' },
  auto_partner_notifications: { ar: 'إشعارات الشركاء', en: 'Partner notifications', group: 'notifications', trigger: 'عند إصدار مستند يخص شريكاً' },
  auto_whatsapp_notifications: { ar: 'إشعارات واتساب', en: 'WhatsApp notifications', group: 'notifications', trigger: 'مع كل إشعار داخلي' },
  auto_email_notifications: { ar: 'إشعارات البريد الإلكتروني', en: 'Email notifications', group: 'notifications', trigger: 'مع كل إشعار داخلي' },
  auto_shipment_status_update: { ar: 'تحديث حالات الشحنات', en: 'Shipment status updates', group: 'operations', trigger: 'عند وصول السائق للموقع (Geofence)' },
  auto_weight_reconciliation: { ar: 'مطابقة الأوزان', en: 'Weight reconciliation', group: 'operations', trigger: 'عند تسجيل الوزن في مرحلة الوزن' },
  auto_compliance_check: { ar: 'فحص الامتثال', en: 'Compliance checks', group: 'operations', trigger: 'قبل اعتماد الشحنة' },
  auto_archive_documents: { ar: 'أرشفة المستندات', en: 'Document archiving', group: 'operations', trigger: 'عند اكتمال الشحنة' },
  auto_signature_request: { ar: 'طلب التوقيعات', en: 'Signature requests', group: 'operations', trigger: 'عند إصدار إقرار أو شهادة' },
  auto_waste_classification: { ar: 'تصنيف المخلفات بالذكاء الاصطناعي', en: 'AI waste classification', group: 'ai', trigger: 'عند إنشاء شحنة جديدة' },
  auto_route_optimization: { ar: 'تحسين المسارات', en: 'Route optimization', group: 'ai', trigger: 'عند تعيين سائق للشحنة' },
  auto_fraud_detection: { ar: 'كشف الاحتيال', en: 'Fraud detection', group: 'ai', trigger: 'عند تغييرات الأوزان أو المسار' },
  auto_price_calculation: { ar: 'حساب الأسعار تلقائياً', en: 'Auto price calculation', group: 'ai', trigger: 'عند ربط الشحنة بخطاب ترسية' },
};

export const AUTO_ACTION_GROUPS = {
  documents: { ar: 'إصدار المستندات', en: 'Document Generation', icon: 'FileText' },
  notifications: { ar: 'الإشعارات', en: 'Notifications', icon: 'Bell' },
  operations: { ar: 'العمليات التشغيلية', en: 'Operations', icon: 'Settings' },
  ai: { ar: 'الذكاء الاصطناعي', en: 'AI & Smart Features', icon: 'Sparkles' },
};

export const useAutoActions = (organizationId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['auto-actions', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('organization_auto_actions' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      
      // Auto-create if not exists
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('organization_auto_actions' as any)
          .insert({ organization_id: organizationId } as any)
          .select()
          .single();
        if (insertError) throw insertError;
        return newData as unknown as AutoActionsSettings;
      }
      return data as unknown as AutoActionsSettings;
    },
    enabled: !!organizationId,
    staleTime: 0, // Always refetch to ensure latest state from DB
    refetchOnWindowFocus: true, // Re-sync when user returns to tab
    refetchOnMount: 'always', // Always check DB on mount
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AutoActionsSettings>) => {
      if (!organizationId) throw new Error('No organization');

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
      }

      const payload = {
        organization_id: organizationId,
        ...updates,
        last_modified_by: authData.user.id,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('organization_auto_actions' as any)
        .upsert(payload as any, { onConflict: 'organization_id' })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('لم يتم حفظ التغييرات - تحقق من صلاحياتك');
      return data;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['auto-actions', organizationId] });
      // Snapshot previous value
      const previous = queryClient.getQueryData(['auto-actions', organizationId]);
      // Optimistically update
      queryClient.setQueryData(['auto-actions', organizationId], (old: any) => 
        old ? { ...old, ...updates } : old
      );
      return { previous };
    },
    onError: (err: any, _updates, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['auto-actions', organizationId], context.previous);
      }
      console.error('Auto-actions save failed:', err);
      toast({ title: 'خطأ في حفظ الإجراءات التلقائية', description: err.message, variant: 'destructive' });
    },
    onSuccess: (data) => {
      // Force cache to use server response (source of truth)
      queryClient.setQueryData(['auto-actions', organizationId], data);
    },
    onSettled: () => {
      // Refetch to ensure sync with DB
      queryClient.invalidateQueries({ queryKey: ['auto-actions', organizationId] });
    },
  });

  // Check if a specific action is enabled (respects master toggle)
  const isActionEnabled = (key: AutoActionKey): boolean => {
    if (!settings) return true; // Default enabled if no settings
    if (!settings.all_actions_enabled) return false; // Master toggle off = all off
    return (settings as any)[key] ?? true;
  };

  // Toggle a single action
  const toggleAction = (key: AutoActionKey) => {
    if (!settings) return;
    updateMutation.mutate({ [key]: !(settings as any)[key] });
  };

  // Toggle master switch
  const toggleAll = (enabled: boolean) => {
    updateMutation.mutate({ all_actions_enabled: enabled });
  };

  // Toggle entire group
  const toggleGroup = (group: string, enabled: boolean) => {
    const groupKeys = AUTO_ACTION_KEYS.filter(k => AUTO_ACTION_LABELS[k].group === group);
    const updates: any = {};
    groupKeys.forEach(k => { updates[k] = enabled; });
    updateMutation.mutate(updates);
  };

  return {
    settings,
    isLoading,
    isActionEnabled,
    toggleAction,
    toggleAll,
    toggleGroup,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
