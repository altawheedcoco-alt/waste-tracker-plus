/**
 * تقويم الجمع المصغر — خاص بالمولدين
 * يعرض مواعيد الجمع القادمة والماضية
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Truck, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ar } from 'date-fns/locale';

const CollectionCalendarMini = () => {
  const { organization } = useAuth();

  const { data: upcoming = [] } = useQuery({
    queryKey: ['collection-calendar', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, pickup_date, waste_type, status, transporter_id')
        .eq('generator_id', organization.id)
        .in('status', ['new', 'approved', 'collecting'])
        .order('pickup_date', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 3,
  });

  const getDateLabel = (dateStr: string | null) => {
    if (!dateStr) return 'غير محدد';
    const date = new Date(dateStr);
    if (isToday(date)) return 'اليوم';
    if (isTomorrow(date)) return 'غداً';
    if (isPast(date)) return 'متأخر';
    return format(date, 'EEE d MMM', { locale: ar });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'collecting': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'approved': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      default: return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          مواعيد الجمع القادمة
          {upcoming.length > 0 && (
            <Badge className="text-[10px] mr-auto">{upcoming.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد مواعيد جمع قادمة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="flex flex-col items-center min-w-[50px]">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
                  <span className="text-[10px] font-bold">
                    {getDateLabel(item.scheduled_date)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {item.waste_type || 'شحنة'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Truck className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate">
                      {item.transporter?.name || 'بانتظار ناقل'}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[9px] border-0 ${getStatusColor(item.status)}`}>
                  {item.status === 'collecting' ? 'جاري' : item.status === 'approved' ? 'مؤكد' : 'جديد'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollectionCalendarMini;
