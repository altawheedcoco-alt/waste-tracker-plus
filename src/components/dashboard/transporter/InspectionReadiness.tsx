/**
 * مؤشر جاهزية التفتيش المفاجئ - فكرة #10
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Check, X, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface CheckItem {
  label: string;
  passed: boolean;
  critical: boolean;
}

export default function InspectionReadiness() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['inspection-readiness', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [entityDocs, fleetVehicles, driversData] = await Promise.all([
        supabase.from('entity_documents').select('status, expiry_date, document_type').eq('organization_id', orgId!),
        supabase.from('fleet_vehicles').select('status').eq('organization_id', orgId!),
        supabase.from('drivers').select('license_expiry, is_available').eq('organization_id', orgId!),
      ]);
      return {
        permits: (entityDocs.data || []) as any[],
        vehicles: (fleetVehicles.data || []) as any[],
        drivers: (driversData.data || []) as any[],
      };
    },
  });

  const checks = useMemo((): CheckItem[] => {
    if (!data) return [];
    const now = new Date();
    const items: CheckItem[] = [];

    const hasActiveEEAA = data.permits.some((p: any) => p.document_type === 'environmental_approval' && (p.status === 'active' || p.status === 'approved'));
    items.push({ label: 'موافقة بيئية سارية (EEAA)', passed: hasActiveEEAA, critical: true });

    const hasActiveWMRA = data.permits.some((p: any) => p.document_type === 'wmra_license' && (p.status === 'active' || p.status === 'approved'));
    items.push({ label: 'ترخيص WMRA ساري', passed: hasActiveWMRA, critical: true });

    const noExpired = !data.permits.some((p: any) => {
      if (!p.expiry_date) return false;
      return new Date(p.expiry_date) < now;
    });
    items.push({ label: 'لا توجد وثائق منتهية', passed: noExpired, critical: true });

    const hasActiveVehicles = data.vehicles.some((v: any) => v.status === 'active');
    items.push({ label: 'مركبات نشطة متاحة', passed: hasActiveVehicles, critical: true });

    const allDriversLicensed = data.drivers.length > 0 && data.drivers.every((d: any) => {
      if (!d.license_expiry) return false;
      return new Date(d.license_expiry) > now;
    });
    items.push({ label: 'رخص السائقين سارية', passed: allDriversLicensed, critical: true });

    const hasAvailableDrivers = data.drivers.some((d: any) => d.is_available);
    items.push({ label: 'سائقون متاحون', passed: hasAvailableDrivers, critical: false });

    return items;
  }, [data]);

  const score = useMemo(() => {
    if (!checks.length) return 0;
    return Math.round((checks.filter(c => c.passed).length / checks.length) * 100);
  }, [checks]);

  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-primary" />
            جاهزية التفتيش
          </CardTitle>
          <Badge variant={score >= 80 ? 'default' : score >= 50 ? 'secondary' : 'destructive'}>
            {score}%
          </Badge>
        </div>
        <Progress value={score} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {checks.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                item.passed ? 'bg-emerald-500/5' : item.critical ? 'bg-destructive/5' : 'bg-amber-500/5'
              }`}
            >
              {item.passed ? (
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : item.critical ? (
                <X className="h-3.5 w-3.5 text-destructive shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              <span className={item.passed ? 'text-muted-foreground' : 'font-medium'}>{item.label}</span>
              {item.critical && !item.passed && (
                <Badge variant="destructive" className="text-[9px] mr-auto">حرج</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}