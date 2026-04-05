/**
 * إدارة أسطول الحاويات - تتبع حاويات الإيجار ومواعيد الإرجاع
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

const ContainerFleetManager = () => {
  const { organization } = useAuth();

  const { data: containers = [] } = useQuery({
    queryKey: ['generator-containers', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('containers')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const stats = useMemo(() => {
    const total = containers.length;
    const active = containers.filter(c => c.status === 'active' || c.status === 'in_use').length;
    const needsMaintenance = containers.filter(c => c.status === 'maintenance').length;
    const rental = containers.filter(c => c.container_type?.includes('إيجار') || c.container_type?.includes('rental')).length;
    return { total, active, needsMaintenance, rental };
  }, [containers]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <Trash2 className="h-4 w-4 text-primary" />
          إدارة الحاويات
        </CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        {stats.total === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">لم يتم تسجيل حاويات بعد</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
              <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-muted-foreground">إجمالي الحاويات</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
              <CheckCircle2 className="h-4 w-4 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-muted-foreground">نشطة</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-amber-600">{stats.needsMaintenance}</p>
              <p className="text-xs text-muted-foreground">تحتاج صيانة</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-center">
              <Clock className="h-4 w-4 mx-auto text-purple-500 mb-1" />
              <p className="text-lg font-bold text-purple-600">{stats.rental}</p>
              <p className="text-xs text-muted-foreground">مستأجرة</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContainerFleetManager;
