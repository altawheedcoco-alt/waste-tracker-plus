import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  History, FileText, ShieldCheck, Pen, Stamp,
  Loader2, Eye, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const actionIcons: Record<string, any> = {
  sign: Pen, approve: CheckCircle2, reject: AlertTriangle,
  stamp: Stamp, review: Eye, upload: FileText, default: History,
};

const actionLabels: Record<string, string> = {
  sign: 'توقيع', approve: 'اعتماد', reject: 'رفض',
  stamp: 'ختم', review: 'مراجعة', upload: 'رفع مستند',
};

const ConsultantActivityLog = memo(() => {
  const { profile } = useAuth();

  const { data: consultantProfile } = useQuery({
    queryKey: ['my-consultant-profile', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase.from('environmental_consultants').select('id')
        .eq('user_id', profile.user_id).maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  // Get signature history as activity log
  const { data: signatures = [], isLoading: loadingSigs } = useQuery({
    queryKey: ['consultant-signatures-log', consultantProfile?.id],
    queryFn: async () => {
      if (!consultantProfile?.id) return [];
      const { data } = await supabase
        .from('consultant_document_signatures')
        .select('*')
        .eq('consultant_id', consultantProfile.id)
        .order('signed_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!consultantProfile?.id,
  });

  // Get activity logs related to user
  const { data: activityLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['consultant-activity-logs', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', profile.user_id)
        .in('resource_type', ['consultant_signature', 'consultant_credential', 'consultant_assignment'])
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  const isLoading = loadingSigs || loadingLogs;

  // Merge and sort all activities
  const allActivities = [
    ...signatures.map((s: any) => ({
      id: s.id,
      type: 'signature',
      action: s.director_approval_status === 'approved' ? 'approve' : s.director_approval_status === 'rejected' ? 'reject' : 'sign',
      description: `توقيع ${s.document_type || 'مستند'}`,
      details: s.notes || s.solidarity_statement,
      date: s.signed_at,
      status: s.director_approval_status,
      hash: s.signature_hash?.slice(0, 12),
    })),
    ...activityLogs.map((l: any) => ({
      id: l.id,
      type: 'activity',
      action: l.action_type || 'default',
      description: l.action,
      details: typeof l.details === 'object' ? JSON.stringify(l.details) : l.details,
      date: l.created_at,
      status: null,
      hash: null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-primary" />سجل الأنشطة</CardTitle>
        <CardDescription>سجل كامل لجميع الإجراءات والتوقيعات — غير قابل للتعديل</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : allActivities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا توجد أنشطة مسجلة بعد</p>
            <p className="text-sm mt-1">ستظهر جميع إجراءاتك هنا تلقائياً</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute right-5 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {allActivities.map((activity) => {
                const Icon = actionIcons[activity.action] || actionIcons.default;
                return (
                  <div key={activity.id} className="relative flex gap-4 pr-2">
                    <div className="relative z-10 w-10 h-10 rounded-full border-2 border-border bg-card flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(activity.date), 'dd MMM yyyy HH:mm', { locale: ar })}
                        </span>
                      </div>
                      {activity.details && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{activity.details}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px]">
                          {actionLabels[activity.action] || activity.action}
                        </Badge>
                        {activity.status && (
                          <Badge variant={activity.status === 'approved' ? 'default' : activity.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[9px]">
                            {activity.status === 'approved' ? 'معتمد' : activity.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                          </Badge>
                        )}
                        {activity.hash && (
                          <Badge variant="outline" className="text-[8px] font-mono">{activity.hash}...</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ConsultantActivityLog.displayName = 'ConsultantActivityLog';
export default ConsultantActivityLog;
