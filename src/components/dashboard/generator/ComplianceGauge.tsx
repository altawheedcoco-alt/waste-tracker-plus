import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

const ComplianceGauge = () => {
  const { organization } = useAuth();

  const { data: score } = useQuery({
    queryKey: ['compliance-score', organization?.id],
    queryFn: async () => {
      // Calculate compliance based on completed vs total shipments
      const { count: total } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('generator_id', organization?.id!);

      const { count: completed } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('generator_id', organization?.id!)
        .in('status', ['delivered', 'confirmed']);

      if (!total || total === 0) return 100;
      return Math.round(((completed || 0) / total) * 100);
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 10,
  });

  const percentage = score ?? 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 80 ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-red-500';
  const strokeColor = percentage >= 80 ? 'hsl(160, 84%, 39%)' : percentage >= 50 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-4" dir="rtl">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${color}`}>{percentage}%</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className={`w-5 h-5 ${color}`} />
            <h3 className="font-bold text-sm">مؤشر الامتثال</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            نسبة إتمام الشحنات وفقاً للإجراءات القانونية والبيئية المعتمدة
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceGauge;
