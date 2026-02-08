import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CallAnalysis {
  summary: string;
  requirements: string[];
  issues?: string[];
  actions_required?: Array<{
    action: string;
    priority: 'urgent' | 'medium' | 'low';
  }>;
  priority: 'urgent' | 'medium' | 'low';
  category: 'inquiry' | 'complaint' | 'service_request' | 'follow_up' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  follow_up_recommendations?: string[];
  keywords?: string[];
}

export interface CallRecord {
  id?: string;
  phoneNumber: string;
  callerName?: string;
  callDirection: 'inbound' | 'outbound';
  notes: string;
  analysis?: CallAnalysis;
  analyzedAt?: string;
  createdAt: string;
}

export function useCallAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { organization } = useAuth();

  const analyzeCall = async (
    notes: string,
    phoneNumber: string,
    callDirection: 'inbound' | 'outbound',
    callerName?: string
  ): Promise<CallAnalysis | null> => {
    if (!notes.trim()) {
      toast.error('يرجى إدخال ملاحظات المكالمة');
      return null;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-call', {
        body: {
          callNotes: notes,
          phoneNumber,
          callDirection,
          callerName
        }
      });

      if (error) throw error;
      
      if (data?.analysis) {
        toast.success('تم تحليل المكالمة بنجاح');
        return data.analysis;
      }
      
      throw new Error('لم يتم استلام نتيجة التحليل');
    } catch (error) {
      console.error('Error analyzing call:', error);
      toast.error('فشل في تحليل المكالمة');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveCallLog = async (
    callRecord: Omit<CallRecord, 'id' | 'createdAt'>
  ): Promise<boolean> => {
    if (!organization?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    setIsSaving(true);
    try {
      // Save to call_logs table
      const { error } = await supabase.from('call_logs').insert({
        organization_id: organization.id,
        from_number: callRecord.callDirection === 'inbound' ? callRecord.phoneNumber : '01500045579',
        to_number: callRecord.callDirection === 'outbound' ? callRecord.phoneNumber : '01500045579',
        direction: callRecord.callDirection,
        status: 'completed',
        notes: callRecord.notes,
        // Store analysis in tags as keywords
        tags: callRecord.analysis?.keywords || [],
      });

      if (error) throw error;
      
      toast.success('تم حفظ سجل المكالمة');
      return true;
    } catch (error) {
      console.error('Error saving call log:', error);
      toast.error('فشل في حفظ سجل المكالمة');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    analyzeCall,
    saveCallLog,
    isAnalyzing,
    isSaving
  };
}
