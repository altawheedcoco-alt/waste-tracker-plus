/**
 * useAIComplianceAnalyzer — AI-powered strict compliance analysis
 * Uses Lovable AI to deeply analyze org documents, licenses, and operations
 * Returns advisory warnings — NEVER blocks any operation
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AIComplianceReport {
  overall_score: number;
  level: 'excellent' | 'good' | 'acceptable' | 'weak' | 'critical';
  strengths: string[];
  weaknesses: { point: string; risk: string }[];
  urgent_recommendations: { action: string; priority: 'high' | 'medium'; deadline_days: number }[];
  improvement_recommendations: string[];
  legal_risks: { risk: string; law_reference: string; severity: 'high' | 'medium' | 'low' }[];
  standards_comparison: { standard: string; current_status: 'met' | 'partial' | 'not_met'; gap: string }[];
  summary: string;
}

export interface AIComplianceResult {
  success: boolean;
  report: AIComplianceReport;
  organization: { id: string; name: string; type: string };
  generated_at: string;
  disclaimer: string;
}

export function useAIComplianceAnalyzer() {
  const { organization } = useAuth();

  return useMutation<AIComplianceResult, Error>({
    mutationKey: ['ai-compliance-analysis', organization?.id],
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-compliance-analyzer`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ organization_id: organization.id }),
      });

      if (response.status === 429) {
        throw new Error('تم تجاوز حد الطلبات، حاول لاحقاً');
      }
      if (response.status === 402) {
        throw new Error('رصيد AI غير كافٍ');
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'فشل في تحليل الامتثال');
      }

      return response.json();
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تحليل الامتثال بالذكاء الاصطناعي');
    },
  });
}
