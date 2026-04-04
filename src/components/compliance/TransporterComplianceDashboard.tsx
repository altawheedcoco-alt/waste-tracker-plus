/**
 * TransporterComplianceDashboard — Compliance proof for generators & ministry
 * Shows: overall gate status, license grid, fleet cert rate, clean record stats
 */

import { useTransporterLicenseGate, GateStatus } from '@/hooks/useTransporterLicenseGate';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, ShieldCheck, ShieldAlert, ShieldX, 
  Truck, Users, FileCheck, AlertTriangle,
  TrendingUp, Award, CheckCircle2, XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_CONFIG: Record<GateStatus, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  clear: { icon: ShieldCheck, label: 'جاهز للعمل — جميع التراخيص سارية', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' },
  warning: { icon: ShieldAlert, label: 'تنبيه — بعض الوثائق تحتاج انتباه', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
  blocked: { icon: ShieldX, label: 'محظور — تراخيص منتهية تمنع إنشاء الشحنات', color: 'text-destructive', bg: 'bg-red-50 dark:bg-red-950/20' },
};

export default function TransporterComplianceDashboard() {
  const { organization } = useAuth();
  const { data: gate, isLoading } = useTransporterLicenseGate();

  // Fetch shipment record for clean track proof
  const { data: trackRecord } = useQuery({
    queryKey: ['transporter-track-record', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const totalRes = await (supabase as any).from('shipments').select('id', { count: 'exact', head: true }).eq('transporter_id', organization.id);
      const completedRes = await (supabase as any).from('shipments').select('id', { count: 'exact', head: true }).eq('transporter_id', organization.id).eq('status', 'confirmed');
      const incidentRes = await (supabase as any).from('shipments').select('id', { count: 'exact', head: true }).eq('transporter_id', organization.id).eq('has_incident', true);
      const total = totalRes.count || 0;
      const completed = completedRes.count || 0;
      const incidents = incidentRes.count || 0;
      return {
        totalShipments: total,
        completedShipments: completed,
        incidentCount: incidents,
        successRate: total > 0 ? Math.round((completed / total) * 100) : 100,
        cleanRate: total > 0 ? Math.round(((total - incidents) / total) * 100) : 100,
      };
    },
    enabled: !!organization?.id,
  });

  if (isLoading || !gate) {
    return <Card><CardContent className="p-6 text-center text-muted-foreground">جاري فحص الامتثال...</CardContent></Card>;
  }

  const statusCfg = STATUS_CONFIG[gate.overallStatus];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-4">
      {/* Gate Status Banner */}
      <Card className={gate.overallStatus === 'blocked' ? 'border-destructive' : gate.overallStatus === 'warning' ? 'border-yellow-400' : 'border-green-400'}>
        <CardContent className={`p-4 ${statusCfg.bg}`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-10 h-10 ${statusCfg.color} shrink-0`} />
            <div className="flex-1">
              <div className={`font-bold text-sm ${statusCfg.color}`}>{statusCfg.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                درجة الامتثال: {gate.complianceScore}% — آخر فحص: {format(gate.lastChecked, 'HH:mm')}
              </div>
            </div>
            <div className="text-center shrink-0">
              <div className={`text-3xl font-bold ${statusCfg.color}`}>{gate.complianceScore}</div>
              <div className="text-[10px] text-muted-foreground">من 100</div>
            </div>
          </div>
          <Progress value={gate.complianceScore} className="h-2 mt-3" />
        </CardContent>
      </Card>

      {/* Block Reasons */}
      {gate.blockReasons.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              أسباب الحظر ({gate.blockReasons.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gate.blockReasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-destructive bg-red-50 dark:bg-red-950/20 p-2 rounded">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {r}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {gate.warnings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              تنبيهات ({gate.warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {gate.warnings.map((w, i) => (
                <div key={i} className="text-xs text-yellow-700 dark:text-yellow-400">• {w}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* License Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" />
            سجل التراخيص والتصاريح
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {gate.licenses.map((lic) => (
              <div key={lic.field} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                <div className="flex items-center gap-2">
                  {lic.status === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  {lic.status === 'expiring' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                  {lic.status === 'expired' && <XCircle className="w-4 h-4 text-destructive" />}
                  {lic.status === 'missing' && <Shield className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-medium">{lic.label}</span>
                  {lic.isCritical && <Badge variant="outline" className="text-[9px] px-1">حرج</Badge>}
                </div>
                <div className="text-left">
                  {lic.expiry ? (
                    <span className={lic.status === 'expired' ? 'text-destructive' : lic.status === 'expiring' ? 'text-yellow-600' : 'text-muted-foreground'}>
                      {format(parseISO(lic.expiry), 'yyyy/MM/dd')}
                      {lic.daysRemaining !== null && (
                        <span className="mr-1">({lic.daysRemaining < 0 ? `منتهي منذ ${Math.abs(lic.daysRemaining)} يوم` : `${lic.daysRemaining} يوم`})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">غير مسجل</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fleet & Drivers Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              الأسطول
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>إجمالي المركبات</span>
              <span className="font-bold">{gate.fleet.totalVehicles}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>معتمدة</span>
              <span className="font-bold text-green-600">{gate.fleet.certifiedVehicles}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>تأمين منتهي</span>
              <span className="font-bold text-destructive">{gate.fleet.expiredInsurance}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>رخصة منتهية</span>
              <span className="font-bold text-destructive">{gate.fleet.expiredLicense}</span>
            </div>
            {gate.fleet.totalVehicles > 0 && (
              <Progress value={(gate.fleet.certifiedVehicles / gate.fleet.totalVehicles) * 100} className="h-1.5" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              السائقون
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>إجمالي السائقين</span>
              <span className="font-bold">{gate.drivers.totalDrivers}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>رخصة سارية</span>
              <span className="font-bold text-green-600">{gate.drivers.validLicense}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>رخصة منتهية</span>
              <span className="font-bold text-destructive">{gate.drivers.expiredLicense}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>بدون رخصة</span>
              <span className="font-bold text-yellow-600">{gate.drivers.missingLicense}</span>
            </div>
            {gate.drivers.totalDrivers > 0 && (
              <Progress value={(gate.drivers.validLicense / gate.drivers.totalDrivers) * 100} className="h-1.5" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Track Record - Clean Record Proof */}
      {trackRecord && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              السجل النظيف (Clean Track Record)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold">{trackRecord.totalShipments}</div>
                <div className="text-[10px] text-muted-foreground">إجمالي الشحنات</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="text-xl font-bold text-green-600">{trackRecord.completedShipments}</div>
                <div className="text-[10px] text-muted-foreground">مكتملة بنجاح</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold">{trackRecord.successRate}%</div>
                <div className="text-[10px] text-muted-foreground">معدل الإنجاز</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold">{trackRecord.cleanRate}%</div>
                <div className="text-[10px] text-muted-foreground">معدل النظافة</div>
              </div>
            </div>
            {trackRecord.incidentCount === 0 && trackRecord.totalShipments > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded">
                <TrendingUp className="w-4 h-4" />
                سجل نظيف 100% — لا توجد حوادث أو مخالفات مسجلة
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
