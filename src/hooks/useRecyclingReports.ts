import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getWasteCategoryFromType } from './useReportTemplates';

export interface RecyclingReport {
  id: string;
  shipment_id: string;
  recycler_organization_id: string;
  created_by: string | null;
  template_id: string | null;
  report_number: string;
  opening_declaration: string | null;
  processing_details: string | null;
  closing_declaration: string | null;
  custom_notes: string | null;
  waste_category: string;
  report_data: any;
  created_at: string;
  updated_at: string;
}

export interface CreateReportInput {
  shipment_id: string;
  template_id?: string;
  opening_declaration?: string;
  processing_details?: string;
  closing_declaration?: string;
  custom_notes?: string;
  waste_type: string;
  report_data?: any;
}

export const useRecyclingReports = () => {
  const { organization, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const saveReport = useCallback(async (input: CreateReportInput): Promise<RecyclingReport | null> => {
    if (!organization?.id || !profile?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }

    setLoading(true);
    try {
      const wasteCategory = getWasteCategoryFromType(input.waste_type);
      
      const { data, error } = await (supabase
        .from('recycling_reports') as any)
        .insert({
          shipment_id: input.shipment_id,
          recycler_organization_id: organization.id,
          created_by: profile.id,
          template_id: input.template_id || null,
          opening_declaration: input.opening_declaration,
          processing_details: input.processing_details,
          closing_declaration: input.closing_declaration,
          custom_notes: input.custom_notes,
          waste_category: wasteCategory,
          report_data: input.report_data || {},
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('تم حفظ التقرير وإرسال الإشعارات بنجاح');
      return data as RecyclingReport;
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast.error('حدث خطأ أثناء حفظ التقرير');
      return null;
    } finally {
      setLoading(false);
    }
  }, [organization?.id, profile?.id]);

  const getReportByShipmentId = useCallback(async (shipmentId: string): Promise<RecyclingReport | null> => {
    try {
      const { data, error } = await (supabase
        .from('recycling_reports') as any)
        .select('*')
        .eq('shipment_id', shipmentId)
        .maybeSingle();

      if (error) throw error;
      return data as RecyclingReport | null;
    } catch (error) {
      console.error('Error fetching report:', error);
      return null;
    }
  }, []);

  const getReportsByOrganization = useCallback(async (): Promise<RecyclingReport[]> => {
    if (!organization?.id) return [];

    try {
      const { data, error } = await (supabase
        .from('recycling_reports') as any)
        .select('*')
        .eq('recycler_organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as RecyclingReport[];
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }, [organization?.id]);

  return {
    loading,
    saveReport,
    getReportByShipmentId,
    getReportsByOrganization,
  };
};

export default useRecyclingReports;
