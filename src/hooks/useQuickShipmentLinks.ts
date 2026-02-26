import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface QuickLinkField {
  id?: string;
  link_id?: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_mode: 'fixed' | 'restricted_list' | 'free_input';
  fixed_value: string | null;
  allowed_values: string[] | null;
  default_value: string | null;
  min_value: number | null;
  max_value: number | null;
  is_required: boolean;
  is_visible: boolean;
  sort_order: number;
}

export interface QuickShipmentLink {
  id: string;
  organization_id: string;
  created_by: string;
  link_code: string;
  link_name: string;
  description: string | null;
  assigned_driver_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  requires_approval: boolean;
  auto_capture_gps: boolean;
  created_at: string;
  updated_at: string;
  fields?: QuickLinkField[];
}

export const AVAILABLE_FIELDS = [
  { name: 'driver_name', label: 'اسم السائق', type: 'text', alwaysRequired: true },
  { name: 'driver_phone', label: 'رقم هاتف السائق', type: 'text', alwaysRequired: true },
  { name: 'generator', label: 'جهة التحميل (المولد)', type: 'select' },
  { name: 'receiver', label: 'جهة الاستلام (المستقبل)', type: 'select' },
  { name: 'waste_type', label: 'نوع المخلف', type: 'select' },
  { name: 'waste_subtype', label: 'تصنيف المخلف الفرعي', type: 'select' },
  { name: 'quantity', label: 'الكمية (طن)', type: 'number' },
  { name: 'weight', label: 'الوزن (كجم)', type: 'number' },
  { name: 'vehicle_plate', label: 'رقم لوحة المركبة', type: 'text' },
  { name: 'photo_scale', label: 'صورة الميزان', type: 'photo' },
  { name: 'photo_load', label: 'صورة الحمولة', type: 'photo' },
  { name: 'notes', label: 'ملاحظات', type: 'text' },
  { name: 'signature', label: 'التوقيع الإلكتروني', type: 'signature' },
  { name: 'gps_location', label: 'الموقع GPS', type: 'gps' },
];

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export function useQuickShipmentLinks() {
  const { profile } = useAuth();
  const [links, setLinks] = useState<QuickShipmentLink[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLinks = useCallback(async () => {
    if (!profile?.organization_id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('quick_shipment_links')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLinks((data as any[]) || []);
    } catch (e) {
      console.error('Error loading quick links:', e);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const createLink = async (
    linkData: Partial<QuickShipmentLink>,
    fields: QuickLinkField[]
  ) => {
    if (!profile?.organization_id || !profile?.id) return null;
    try {
      const code = generateCode();
      const { data: link, error: linkErr } = await supabase
        .from('quick_shipment_links')
        .insert({
          organization_id: profile.organization_id,
          created_by: profile.id,
          link_code: code,
          link_name: linkData.link_name || 'رابط سريع',
          description: linkData.description || null,
          assigned_driver_id: linkData.assigned_driver_id || null,
          expires_at: linkData.expires_at || null,
          max_uses: linkData.max_uses || null,
          requires_approval: linkData.requires_approval || false,
          auto_capture_gps: linkData.auto_capture_gps ?? true,
        } as any)
        .select()
        .single();
      if (linkErr) throw linkErr;

      // Insert fields
      if (fields.length > 0) {
        const fieldRows = fields.map((f, i) => ({
          link_id: (link as any).id,
          field_name: f.field_name,
          field_label: f.field_label,
          field_type: f.field_type,
          field_mode: f.field_mode,
          fixed_value: f.fixed_value,
          allowed_values: f.allowed_values ? JSON.stringify(f.allowed_values) : null,
          default_value: f.default_value,
          min_value: f.min_value,
          max_value: f.max_value,
          is_required: f.is_required,
          is_visible: f.is_visible,
          sort_order: i,
        }));
        const { error: fieldsErr } = await supabase
          .from('quick_link_fields')
          .insert(fieldRows as any[]);
        if (fieldsErr) throw fieldsErr;
      }

      toast.success('✅ تم إنشاء الرابط بنجاح');
      await loadLinks();
      return link as any;
    } catch (e) {
      console.error('Error creating link:', e);
      toast.error('فشل في إنشاء الرابط');
      return null;
    }
  };

  const toggleLink = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('quick_shipment_links')
        .update({ is_active: !isActive } as any)
        .eq('id', id);
      if (error) throw error;
      toast.success(isActive ? 'تم إيقاف الرابط' : 'تم تفعيل الرابط');
      await loadLinks();
    } catch (e) {
      toast.error('فشل في تحديث الرابط');
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quick_shipment_links')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('تم حذف الرابط');
      await loadLinks();
    } catch (e) {
      toast.error('فشل في حذف الرابط');
    }
  };

  return { links, loading, createLink, toggleLink, deleteLink, reload: loadLinks };
}
