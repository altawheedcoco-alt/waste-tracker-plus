import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Plus, Clock, CheckCircle2, Truck, PackageCheck,
  ThumbsUp, ArrowLeft, ChevronLeft,
} from 'lucide-react';

const STAGES = [
  { key: 'new', labelAr: 'جديدة', labelEn: 'New', icon: Plus, color: 'bg-blue-500', ring: 'ring-blue-200 dark:ring-blue-800' },
  { key: 'approved', labelAr: 'معتمدة', labelEn: 'Approved', icon: ThumbsUp, color: 'bg-amber-500', ring: 'ring-amber-200 dark:ring-amber-800' },
  { key: 'collecting', labelAr: 'قيد الجمع', labelEn: 'Collecting', icon: Clock, color: 'bg-orange-500', ring: 'ring-orange-200 dark:ring-orange-800' },
  { key: 'in_transit', labelAr: 'في الطريق', labelEn: 'In Transit', icon: Truck, color: 'bg-purple-500', ring: 'ring-purple-200 dark:ring-purple-800' },
  { key: 'delivered', labelAr: 'تم التسليم', labelEn: 'Delivered', icon: PackageCheck, color: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  { key: 'confirmed', labelAr: 'مؤكدة', labelEn: 'Confirmed', icon: CheckCircle2, color: 'bg-green-600', ring: 'ring-green-200 dark:ring-green-800' },
] as const;

const ShipmentStatusPipeline = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const { data: counts = {}, isLoading } = useQuery({
    queryKey: ['generator-pipeline', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return {};
      const { data } = await supabase
        .from('shipments')
        .select('status')
        .eq('generator_id', organization.id)
        .in('status', STAGES.map(s => s.key));

      const map: Record<string, number> = {};
      data?.forEach(s => { map[s.status] = (map[s.status] || 0) + 1; });
      return map;
    },
    enabled: !!organization?.id,
    staleTime: 60_000,
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="animate-pulse flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 w-24 shrink-0 bg-muted rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (total === 0) return null;

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/dashboard/shipments')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {isAr ? 'عرض الكل' : 'View All'}
            <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
          </button>
          <h3 className="text-sm font-bold">
            {isAr ? 'مسار الشحنات' : 'Shipment Pipeline'}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STAGES.map((stage, i) => {
            const count = counts[stage.key] || 0;
            const Icon = stage.icon;
            const hasItems = count > 0;

            return (
              <div key={stage.key} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/dashboard/shipments?status=${stage.key}`)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl border transition-all min-w-[4.5rem] sm:min-w-[5.5rem]",
                    hasItems
                      ? "border-border/60 hover:border-primary/40 hover:shadow-md bg-card"
                      : "border-border/30 bg-muted/30 opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ring-2",
                    hasItems ? stage.color : 'bg-muted',
                    hasItems ? stage.ring : 'ring-border/30'
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={cn(
                    "text-lg sm:text-xl font-bold tabular-nums",
                    hasItems ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {count}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight text-center">
                    {isAr ? stage.labelAr : stage.labelEn}
                  </span>
                </button>
                {i < STAGES.length - 1 && (
                  <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 rtl:rotate-180" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShipmentStatusPipeline;
