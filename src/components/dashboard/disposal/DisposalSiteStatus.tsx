/**
 * DisposalSiteStatus — حالة مواقع الدفن/المعالجة
 * يعرض حالة المنشأة (السعة، مستوى الامتلاء، التراخيص)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, AlertTriangle, CheckCircle2, ChevronLeft, Factory, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const DisposalSiteStatus = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['disposal-site-status', organization?.id],
    queryFn: async () => {
      const [facilityR, opsR] = await Promise.all([
        supabase.from('disposal_facilities')
          .select('id, name, facility_type, capacity_tons_per_day, current_fill_percentage, status, license_expiry, address')
          .eq('organization_id', organization!.id),
        supabase.from('disposal_operations')
          .select('status, quantity')
          .eq('organization_id', organization!.id)
          .eq('status', 'completed'),
      ]);

      const facilities = facilityR.data || [];
      const totalProcessed = (opsR.data || []).reduce((s, o) => s + (Number(o.quantity) || 0), 0);

      return {
        facilities,
        totalProcessed,
        facilityCount: facilities.length,
      };
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="border border-border/40 bg-card/80">
        <CardContent className="p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3 mr-auto" />
            <div className="h-20 bg-muted/30 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/dashboard/disposal/mission-control')}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              مركز القيادة <ChevronLeft className="w-3 h-3" />
            </button>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              حالة المواقع
              <MapPin className="w-4 h-4 text-primary" />
            </h3>
          </div>

          {(data?.facilities?.length || 0) > 0 ? (
            <div className="space-y-2">
              {data!.facilities.map((f: any) => {
                const fill = f.current_fill_percentage || 0;
                const isNearFull = fill >= 80;
                return (
                  <div key={f.id} className="p-2.5 rounded-lg border border-border/30 bg-muted/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="outline" className={`text-[9px] ${
                        f.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                      }`}>
                        {f.status === 'active' ? <><CheckCircle2 className="w-2.5 h-2.5 ml-0.5" /> نشط</> : f.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-foreground">{f.name || 'منشأة التخلص'}</p>
                        <p className="text-[9px] text-muted-foreground">{f.facility_type || 'دفن صحي'} · {f.address || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold tabular-nums ${isNearFull ? 'text-destructive' : 'text-foreground'}`}>
                        {fill}%
                      </span>
                      <Progress value={fill} className="h-1.5 flex-1" />
                      <Gauge className="w-3 h-3 text-muted-foreground" />
                    </div>
                    {isNearFull && (
                      <div className="flex items-center gap-1 mt-1 text-[9px] text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        سعة قريبة من الامتلاء
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="text-center pt-1">
                <p className="text-[10px] text-muted-foreground">
                  إجمالي المعالج: <span className="font-bold text-foreground">{(data?.totalProcessed || 0).toLocaleString('ar-SA')}</span> طن
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Factory className="w-6 h-6 mx-auto mb-1 opacity-30" />
              <p className="text-[11px]">لم يتم تسجيل منشآت بعد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DisposalSiteStatus;
