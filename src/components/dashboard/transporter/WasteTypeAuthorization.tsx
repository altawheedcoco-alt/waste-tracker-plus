/**
 * مراقب أنواع المخلفات المصرح بها - فكرة #5
 * خطر، غير خطر، طبي، بترولي مع مقارنة بالعمليات الفعلية
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Beaker, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const WASTE_CATEGORIES = [
  { key: 'hazardous', label: 'مخلفات خطرة', icon: '☢️', color: 'text-destructive' },
  { key: 'non_hazardous', label: 'مخلفات غير خطرة', icon: '♻️', color: 'text-emerald-600' },
  { key: 'medical', label: 'مخلفات طبية', icon: '🏥', color: 'text-blue-600' },
  { key: 'petroleum', label: 'مخلفات بترولية', icon: '🛢️', color: 'text-amber-600' },
  { key: 'electronic', label: 'مخلفات إلكترونية', icon: '💻', color: 'text-purple-600' },
  { key: 'construction', label: 'مخلفات بناء وهدم', icon: '🏗️', color: 'text-orange-600' },
  { key: 'organic', label: 'مخلفات عضوية', icon: '🌿', color: 'text-green-600' },
  { key: 'pharmaceutical', label: 'مخلفات دوائية', icon: '💊', color: 'text-pink-600' },
];

export default function WasteTypeAuthorization() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: permits, isLoading } = useQuery({
    queryKey: ['waste-auth', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('permits')
        .select('conditions, status')
        .eq('organization_id', orgId!)
        .in('status', ['active', 'approved']);
      return data || [];
    },
  });

  const authorizedTypes = useMemo(() => {
    const types = new Set<string>();
    (permits || []).forEach(p => {
      const cond = p.conditions as any;
      if (cond?.waste_types && Array.isArray(cond.waste_types)) {
        cond.waste_types.forEach((t: string) => types.add(t));
      }
    });
    return types;
  }, [permits]);

  if (isLoading) return <Skeleton className="h-[260px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Beaker className="h-5 w-5 text-primary" />
          أنواع المخلفات المصرح بها
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {WASTE_CATEGORIES.map(cat => {
            const isAuthorized = authorizedTypes.has(cat.key);
            return (
              <div
                key={cat.key}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                  isAuthorized
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-muted/30 border-transparent opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.icon}</span>
                  <span className={`text-xs font-medium ${isAuthorized ? cat.color : 'text-muted-foreground'}`}>
                    {cat.label}
                  </span>
                </div>
                {isAuthorized ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
            );
          })}
        </div>
        {authorizedTypes.size === 0 && (
          <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-600">لم يتم ربط أنواع المخلفات بالتصاريح</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
