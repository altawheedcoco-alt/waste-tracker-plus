import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Clock, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AuditLogTabProps {
  organizationId?: string | null;
}

const AuditLogTab = ({ organizationId }: AuditLogTabProps) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['mc-audit-logs', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .in('resource_type', ['disposal_operations', 'disposal_certificates', 'disposal_incoming_requests', 'disposal_facilities'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Also fetch disposal operations with audit trail
  const { data: recentOps = [] } = useQuery({
    queryKey: ['mc-audit-ops', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('disposal_operations')
        .select('id, operation_number, waste_description, status, receiving_officer, verified_by, verified_at, processing_started_at, processing_completed_at, disposal_method, created_at, updated_at')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return 'bg-green-500/10 text-green-600';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-500/10 text-blue-600';
    if (action.includes('delete') || action.includes('reject')) return 'bg-red-500/10 text-red-600';
    return 'bg-muted text-muted-foreground';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'processing': return 'قيد المعالجة';
      case 'completed': return 'مكتمل';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-600" />
            سجل التدقيق — لا يُمحى
          </CardTitle>
          <CardDescription>كل إجراء مسجل: من الموظف، متى، وما هي القراءات. ضمان قانوني للجهة.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOps.length === 0 && logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>لا توجد سجلات حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOps.map((op: any) => (
                <div key={op.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <Badge variant="outline" className="text-xs">{getStatusLabel(op.status)}</Badge>
                      <span className="font-medium text-sm">{op.operation_number || op.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{op.waste_description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {op.receiving_officer && (
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> مسؤول الاستلام: {op.receiving_officer}</span>
                      )}
                      {op.verified_by && (
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> تحقق بواسطة: {op.verified_by}</span>
                      )}
                      {op.processing_started_at && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> بدأ المعالجة: {format(new Date(op.processing_started_at), 'dd/MM HH:mm', { locale: ar })}</span>
                      )}
                      {op.processing_completed_at && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> انتهى: {format(new Date(op.processing_completed_at), 'dd/MM HH:mm', { locale: ar })}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> آخر تحديث: {format(new Date(op.updated_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Activity logs */}
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Badge className={`text-xs ${getActionColor(log.action_type)}`}>{log.action_type}</Badge>
                      <span className="text-sm">{log.action}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.resource_type} • {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ar })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogTab;
