import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { playNotificationSound } from '@/hooks/useNotificationSound';
import type { Json } from '@/integrations/supabase/types';

export type ReportRequestType = 
  | 'aggregate_report' 
  | 'recycling_certificate'
  | 'shipment_report' 
  | 'waste_register' 
  | 'operational_plan'
  | 'reports';

export interface ReportRequest {
  id: string;
  request_type: ReportRequestType;
  request_title: string;
  requester_user_id: string;
  requester_organization_id: string | null;
  target_resource_id: string | null;
  target_resource_data: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  auto_approve_at: string;
  approved_at: string | null;
  approved_by: string | null;
  admin_notes: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useReportRequests = (reportType?: ReportRequestType, resourceId?: string) => {
  const { user, organization, roles } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ReportRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<ReportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const isAdmin = roles.includes('admin');

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('report_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportType) {
        query = query.eq('request_type', reportType);
      }

      if (resourceId) {
        query = query.eq('target_resource_id', resourceId);
      }

      if (!isAdmin) {
        query = query.eq('requester_user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests(data as ReportRequest[] || []);

      // Set current request if looking for specific resource
      if (reportType && resourceId && data && data.length > 0) {
        const pending = data.find(r => r.status === 'pending' || r.status === 'approved');
        setCurrentRequest(pending as ReportRequest || null);
      } else if (reportType && data && data.length > 0) {
        // Get most recent pending or approved for this type
        const pending = data.find(r => r.status === 'pending' || r.status === 'approved');
        setCurrentRequest(pending as ReportRequest || null);
      }
    } catch (error) {
      console.error('Error fetching report requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user, reportType, resourceId, isAdmin]);

  // Create new request
  const createRequest = async (
    type: ReportRequestType,
    title: string,
    resourceId?: string,
    resourceData?: Record<string, unknown>
  ) => {
    if (!user) return { success: false };

    setRequesting(true);
    try {
      const { data, error } = await supabase
        .from('report_requests')
        .insert([{
          request_type: type,
          request_title: title,
          requester_user_id: user.id,
          requester_organization_id: organization?.id || null,
          target_resource_id: resourceId || null,
          target_resource_data: (resourceData || {}) as Json,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'تم إرسال الطلب',
        description: 'سيتم تجهيز المستند خلال 5 دقائق كحد أقصى',
      });

      setCurrentRequest(data as ReportRequest);
      await fetchRequests();
      return { success: true, request: data };
    } catch (error) {
      console.error('Error creating report request:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال الطلب',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setRequesting(false);
    }
  };

  // Approve request (admin only)
  const approveRequest = async (requestId: string, pdfUrl?: string) => {
    if (!isAdmin) return { success: false };

    try {
      const { error } = await supabase
        .from('report_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          pdf_url: pdfUrl || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'تمت الموافقة',
        description: 'تم تجهيز المستند وإشعار المستخدم',
      });

      await fetchRequests();
      return { success: true };
    } catch (error) {
      console.error('Error approving request:', error);
      return { success: false };
    }
  };

  // Reject request (admin only)
  const rejectRequest = async (requestId: string, notes?: string) => {
    if (!isAdmin) return { success: false };

    try {
      const { error } = await supabase
        .from('report_requests')
        .update({
          status: 'rejected',
          admin_notes: notes || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'تم الرفض',
        description: 'تم رفض الطلب وإشعار المستخدم',
      });

      await fetchRequests();
      return { success: true };
    } catch (error) {
      console.error('Error rejecting request:', error);
      return { success: false };
    }
  };

  // Check if auto-approval time has passed
  const checkAutoApproval = useCallback(async () => {
    if (!currentRequest || currentRequest.status !== 'pending') return;

    const autoApproveTime = new Date(currentRequest.auto_approve_at).getTime();
    const now = Date.now();

    if (now >= autoApproveTime) {
      // Auto-approve the request
      try {
        const { error } = await supabase
          .from('report_requests')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            admin_notes: 'موافقة تلقائية بعد انتهاء مدة المراجعة',
          })
          .eq('id', currentRequest.id)
          .eq('status', 'pending');

        if (!error) {
          playNotificationSound('approval_request');
          toast({
            title: '✅ المستند جاهز',
            description: 'تم تجهيز المستند ويمكنك الآن طباعته وتحميله',
          });
          await fetchRequests();
        }
      } catch (error) {
        console.error('Auto-approval error:', error);
      }
    }
  }, [currentRequest, fetchRequests, toast]);

  // Calculate remaining time
  const getRemainingTime = useCallback(() => {
    if (!currentRequest || currentRequest.status !== 'pending') return null;

    const autoApproveTime = new Date(currentRequest.auto_approve_at).getTime();
    const now = Date.now();
    const remaining = Math.max(0, autoApproveTime - now);

    return {
      total: remaining,
      minutes: Math.floor(remaining / 60000),
      seconds: Math.floor((remaining % 60000) / 1000),
    };
  }, [currentRequest]);

  // Check if can print (approved or admin)
  const canPrint = useCallback(() => {
    if (isAdmin) return true;
    if (!currentRequest) return false;
    return currentRequest.status === 'approved';
  }, [currentRequest, isAdmin]);

  // Check if has pending request
  const hasPendingRequest = useCallback(() => {
    return currentRequest?.status === 'pending';
  }, [currentRequest]);

  // Initial fetch
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('report_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_requests',
          filter: isAdmin ? undefined : `requester_user_id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as ReportRequest;
            if (updated.status === 'approved' && payload.old && (payload.old as ReportRequest).status === 'pending') {
              playNotificationSound('approval_request');
              toast({
                title: '✅ المستند جاهز',
                description: 'تم تجهيز المستند ويمكنك الآن طباعته وتحميله',
              });
            }
          }
          await fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, fetchRequests, toast]);

  // Auto-approval check interval
  useEffect(() => {
    if (!currentRequest || currentRequest.status !== 'pending') return;

    const interval = setInterval(() => {
      checkAutoApproval();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [currentRequest, checkAutoApproval]);

  return {
    requests,
    currentRequest,
    loading,
    requesting,
    isAdmin,
    createRequest,
    approveRequest,
    rejectRequest,
    canPrint,
    hasPendingRequest,
    getRemainingTime,
    fetchRequests,
  };
};
