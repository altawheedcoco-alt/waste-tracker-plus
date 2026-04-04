/**
 * CertifiedFleetManager — Vehicle environmental compliance & certification dashboard
 * Shows fleet certification status, environmental compliance, expired docs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Truck, ShieldCheck, ShieldAlert, AlertTriangle, Calendar, Fuel, MapPin } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface VehicleCertStatus {
  id: string;
  plateNumber: string;
  type: string;
  brand: string | null;
  status: string;
  insuranceExpiry: string | null;
  licenseExpiry: string | null;
  wasteTypesAllowed: string[];
  capacityTons: number | null;
  isCertified: boolean;
  issues: string[];
  daysToInsuranceExpiry: number | null;
  daysToLicenseExpiry: number | null;
}

export default function CertifiedFleetManager() {
  const { organization } = useAuth();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['certified-fleet', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('fleet_vehicles')
        .select('id, plate_number, vehicle_type, brand, status, insurance_expiry, license_expiry, waste_types_allowed, capacity_tons')
        .eq('organization_id', organization.id)
        .order('plate_number');
      
      if (!data) return [];
      const now = new Date();

      return data.map((v): VehicleCertStatus => {
        const issues: string[] = [];
        const insExpiry = v.insurance_expiry ? differenceInDays(parseISO(v.insurance_expiry), now) : null;
        const licExpiry = v.license_expiry ? differenceInDays(parseISO(v.license_expiry), now) : null;
        
        if (!v.insurance_expiry) issues.push('تأمين غير مسجل');
        else if (insExpiry !== null && insExpiry < 0) issues.push('تأمين منتهي');
        
        if (!v.license_expiry) issues.push('رخصة غير مسجلة');
        else if (licExpiry !== null && licExpiry < 0) issues.push('رخصة منتهية');
        
        if (!v.waste_types_allowed || v.waste_types_allowed.length === 0) issues.push('أنواع مخلفات غير محددة');
        if (v.status !== 'active') issues.push('المركبة غير نشطة');

        return {
          id: v.id,
          plateNumber: v.plate_number,
          type: v.vehicle_type,
          brand: v.brand,
          status: v.status,
          insuranceExpiry: v.insurance_expiry,
          licenseExpiry: v.license_expiry,
          wasteTypesAllowed: v.waste_types_allowed || [],
          capacityTons: v.capacity_tons,
          isCertified: issues.length === 0,
          issues,
          daysToInsuranceExpiry: insExpiry,
          daysToLicenseExpiry: licExpiry,
        };
      });
    },
    enabled: !!organization?.id,
  });

  const certified = vehicles.filter(v => v.isCertified).length;
  const total = vehicles.length;
  const certRate = total > 0 ? Math.round((certified / total) * 100) : 0;

  if (isLoading) {
    return <Card><CardContent className="p-6 text-center text-muted-foreground">جاري تحميل بيانات الأسطول...</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="w-5 h-5 text-primary" />
            الأسطول المعتمد (Certified Fleet)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-xs text-muted-foreground">إجمالي المركبات</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="text-2xl font-bold text-green-600">{certified}</div>
              <div className="text-xs text-muted-foreground">معتمدة</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
              <div className="text-2xl font-bold text-destructive">{total - certified}</div>
              <div className="text-xs text-muted-foreground">تحتاج مراجعة</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{certRate}%</div>
              <div className="text-xs text-muted-foreground">نسبة الامتثال</div>
            </div>
          </div>
          <Progress value={certRate} className="h-2" />
        </CardContent>
      </Card>

      {/* Vehicle Cards */}
      <div className="grid gap-3">
        {vehicles.map((v) => (
          <Card key={v.id} className={v.isCertified ? 'border-green-200 dark:border-green-800' : 'border-destructive/30'}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {v.isCertified ? (
                    <ShieldCheck className="w-8 h-8 text-green-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-8 h-8 text-destructive shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-sm">{v.plateNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.type === 'truck' ? 'شاحنة' : v.type === 'pickup' ? 'بيك أب' : v.type} {v.brand && `— ${v.brand}`}
                      {v.capacityTons && ` — ${v.capacityTons} طن`}
                    </div>
                  </div>
                </div>
                <Badge variant={v.isCertified ? 'default' : 'destructive'} className="shrink-0">
                  {v.isCertified ? 'معتمدة ✓' : 'غير مطابقة'}
                </Badge>
              </div>

              {/* Details */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>التأمين: </span>
                  {v.insuranceExpiry ? (
                    <span className={v.daysToInsuranceExpiry !== null && v.daysToInsuranceExpiry < 0 ? 'text-destructive font-medium' : v.daysToInsuranceExpiry !== null && v.daysToInsuranceExpiry < 30 ? 'text-yellow-600 font-medium' : ''}>
                      {format(parseISO(v.insuranceExpiry), 'yyyy/MM/dd')}
                    </span>
                  ) : <span className="text-muted-foreground">—</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>الرخصة: </span>
                  {v.licenseExpiry ? (
                    <span className={v.daysToLicenseExpiry !== null && v.daysToLicenseExpiry < 0 ? 'text-destructive font-medium' : v.daysToLicenseExpiry !== null && v.daysToLicenseExpiry < 30 ? 'text-yellow-600 font-medium' : ''}>
                      {format(parseISO(v.licenseExpiry), 'yyyy/MM/dd')}
                    </span>
                  ) : <span className="text-muted-foreground">—</span>}
                </div>
              </div>

              {/* Waste types */}
              {v.wasteTypesAllowed.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {v.wasteTypesAllowed.slice(0, 4).map((wt) => (
                    <Badge key={wt} variant="outline" className="text-[10px]">{wt}</Badge>
                  ))}
                  {v.wasteTypesAllowed.length > 4 && (
                    <Badge variant="outline" className="text-[10px]">+{v.wasteTypesAllowed.length - 4}</Badge>
                  )}
                </div>
              )}

              {/* Issues */}
              {v.issues.length > 0 && (
                <div className="mt-2 space-y-1">
                  {v.issues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertTriangle className="w-3 h-3" />
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {vehicles.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد مركبات مسجلة</p>
              <p className="text-xs mt-1">أضف مركبات الأسطول من قسم إدارة المركبات</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
