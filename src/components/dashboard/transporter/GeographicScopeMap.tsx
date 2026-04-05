/**
 * متتبع النطاق الجغرافي - فكرة #4
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, CheckCircle, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function GeographicScopeMap() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: docs, isLoading } = useQuery({
    queryKey: ['geo-scope-permits', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('entity_documents')
        .select('document_type, status, metadata')
        .eq('organization_id', orgId!)
        .in('status', ['active', 'approved']);
      return (data || []) as any[];
    },
  });

  const { authorizedGovs, isNationwide, wasteTypes } = useMemo(() => {
    const govs = new Set<string>();
    let nationwide = false;
    const types = new Set<string>();

    (docs || []).forEach((p: any) => {
      const meta = p.metadata as any;
      if (meta?.governorates) {
        if (Array.isArray(meta.governorates)) {
          meta.governorates.forEach((g: string) => govs.add(g));
        }
        if (meta.governorates === 'nationwide' || meta.nationwide) {
          nationwide = true;
        }
      }
      if (meta?.waste_types && Array.isArray(meta.waste_types)) {
        meta.waste_types.forEach((t: string) => types.add(t));
      }
    });

    return {
      authorizedGovs: Array.from(govs),
      isNationwide: nationwide,
      wasteTypes: Array.from(types),
    };
  }, [docs]);

  if (isLoading) return <Skeleton className="h-[260px] w-full rounded-xl" />;

  const wasteTypeLabels: Record<string, { label: string; color: string }> = {
    hazardous: { label: 'خطرة', color: 'bg-destructive/10 text-destructive' },
    non_hazardous: { label: 'غير خطرة', color: 'bg-emerald-500/10 text-emerald-600' },
    medical: { label: 'طبية', color: 'bg-blue-500/10 text-blue-600' },
    petroleum: { label: 'بترولية', color: 'bg-amber-500/10 text-amber-600' },
    electronic: { label: 'إلكترونية', color: 'bg-purple-500/10 text-purple-600' },
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-5 w-5 text-primary" />
          النطاق الجغرافي المصرح
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
          {isNationwide ? (
            <>
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">عموم الجمهورية</span>
            </>
          ) : authorizedGovs.length > 0 ? (
            <>
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{authorizedGovs.length} محافظة مصرح بها</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">لم يتم تحديد النطاق الجغرافي</span>
            </>
          )}
        </div>

        {!isNationwide && authorizedGovs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {authorizedGovs.map(gov => (
              <Badge key={gov} variant="outline" className="text-[10px] gap-1">
                <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />
                {gov}
              </Badge>
            ))}
          </div>
        )}

        {wasteTypes.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">أنواع المخلفات المصرح بنقلها:</p>
            <div className="flex flex-wrap gap-1.5">
              {wasteTypes.map(type => {
                const config = wasteTypeLabels[type] || { label: type, color: 'bg-muted text-muted-foreground' };
                return (
                  <Badge key={type} className={`text-[10px] border-0 ${config.color}`}>
                    {config.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold text-primary">
              {isNationwide ? '27' : authorizedGovs.length || '—'}
            </div>
            <div className="text-[10px] text-muted-foreground">محافظة</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold text-primary">{wasteTypes.length || '—'}</div>
            <div className="text-[10px] text-muted-foreground">نوع مخلفات</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold text-primary">{(docs || []).length}</div>
            <div className="text-[10px] text-muted-foreground">وثيقة</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}