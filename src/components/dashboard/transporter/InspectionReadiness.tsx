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
      const [permits, vehicles, drivers] = await Promise.all([
        supabase.from('permits').select('status, valid_until, permit_type').eq('organization_id', orgId!),
        supabase.from('vehicles').select('status, insurance_expiry, technical_inspection_date').eq('organization_id', orgId!),
        supabase.from('drivers').select('license_expiry, is_active, training_status').eq('organization_id', orgId!),
      ]);
      return {
        permits: permits.data || [],
        vehicles: vehicles.data || [],
        drivers: drivers.data || [],
      };
    },
  });

  const checks = useMemo((): CheckItem[] => {
    if (!data) return [];
    const now = new Date();
    const items: CheckItem[] = [];

    // License checks
    const hasActiveEEAA = data.permits.some(p => p.permit_type === 'environmental_approval' && p.status === 'active');
    items.push({ label: 'موافقة بيئية سارية (EEAA)', passed: hasActiveEEAA, critical: true });

    const hasActiveWMRA = data.permits.some(p => p.permit_type === 'wmra_license' && p.status === 'active');
    items.push({ label: 'ترخيص WMRA ساري', passed: hasActiveWMRA, critical: true });

    const noExpired = !data.permits.some(p => {
      if (!p.valid_until) return false;
      return new Date(p.valid_until) < now;
    });
    items.push({ label: 'لا توجد تراخيص منتهية', passed: noExpired, critical: true });

    // Vehicle checks
    const allVehiclesInsured = data.vehicles.length > 0 && data.vehicles.every(v => {
      if (!v.insurance_expiry) return false;
      return new Date(v.insurance_expiry) > now;
    });
    items.push({ label: 'تأمين جميع المركبات ساري', passed: allVehiclesInsured, critical: true });

    const allVehiclesInspected = data.vehicles.length > 0 && data.vehicles.every(v => {
      if (!v.technical_inspection_date) return false;
      const inspDate = new Date(v.technical_inspection_date);
      const sixMonths = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      return inspDate > sixMonths;
    });
    items.push({ label: 'فحص فني حديث لكل مركبة', passed: allVehiclesInspected, critical: false });

    // Driver checks
    const allDriversLicensed = data.drivers.length > 0 && data.drivers.every(d => {
      if (!d.license_expiry) return false;
      return new Date(d.license_expiry) > now;
    });
    items.push({ label: 'رخص السائقين سارية', passed: allDriversLicensed, critical: true });

    const hasActiveDrivers = data.drivers.some(d => d.is_active);
    items.push({ label: 'سائقون نشطون متاحون', passed: hasActiveDrivers, critical: false });

    return items;
  }, [data]);

  const score = useMemo(() => {
    if (!checks.length) return 0;
    const passed = checks.filter(c => c.passed).length;
    return Math.round((passed / checks.length) * 100);
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
                item.passed
                  ? 'bg-emerald-500/5'
                  : item.critical
                  ? 'bg-destructive/5'
                  : 'bg-amber-500/5'
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
