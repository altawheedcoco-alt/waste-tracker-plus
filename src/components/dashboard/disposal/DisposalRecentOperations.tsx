import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Factory, Eye, AlertCircle, FileCheck } from 'lucide-react';

const DisposalRecentOperations = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: recentOps = [], isLoading } = useQuery({
    queryKey: ['disposal-recent-operations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('disposal_operations')
        .select('id, operation_number, waste_type, waste_description, quantity, unit, status, disposal_method, created_at, completed_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'معلق', variant: 'secondary' },
    processing: { label: 'قيد المعالجة', variant: 'default' },
    completed: { label: 'مكتمل', variant: 'outline' },
    rejected: { label: 'مرفوض', variant: 'destructive' },
  };

  const methodLabels: Record<string, string> = {
    landfill: 'دفن',
    incineration: 'حرق',
    treatment: 'معالجة كيميائية',
    recycling: 'إعادة تدوير',
    neutralization: 'تحييد',
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/disposal/operations')}>
            <Eye className="ml-2 h-4 w-4" />
            عرض الكل
          </Button>
          <div className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <Factory className="w-5 h-5 text-red-500" />
              آخر عمليات التخلص
            </CardTitle>
            <CardDescription>آخر 10 عمليات تخلص في المنشأة</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentOps.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد عمليات تخلص حتى الآن</p>
            <Button className="mt-4" onClick={() => navigate('/dashboard/disposal/operations/new')}>
              تسجيل عملية جديدة
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOps.map((op: any) => {
              const statusInfo = statusLabels[op.status] || { label: op.status, variant: 'outline' as const };
              return (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/dashboard/disposal/operations')}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={statusInfo.variant} className="text-xs">
                      {statusInfo.label}
                    </Badge>
                    {op.status === 'completed' && (
                      <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={(e) => {
                        e.stopPropagation();
                        navigate('/dashboard/disposal/certificates');
                      }}>
                        <FileCheck className="w-3 h-3" />
                        شهادة
                      </Button>
                    )}
                  </div>
                  <div className="text-right flex-1">
                    <div className="flex items-center gap-2 justify-end">
                      <Badge variant="outline" className="text-[10px]">
                        {methodLabels[op.disposal_method] || op.disposal_method || '-'}
                      </Badge>
                      <span className="font-medium text-sm">
                        {op.operation_number || `#${op.id.slice(0, 6)}`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {op.waste_description || op.waste_type} • {op.quantity} {op.unit}
                      {' • '}
                      {formatDistanceToNow(new Date(op.created_at), { locale: ar, addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DisposalRecentOperations;
