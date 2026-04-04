/**
 * DisposalComplianceDashboard — Full compliance view for disposal facilities
 * Covers: core, environmental, disposal ops, safety, and sector-specific licenses
 */

import { useDisposalLicenseGate, GateStatus, DISPOSAL_LICENSE_CATEGORIES, DisposalLicenseCategory } from '@/hooks/useDisposalLicenseGate';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, ShieldCheck, ShieldAlert, ShieldX, 
  FileCheck, AlertTriangle, CheckCircle2, XCircle,
  BookOpen, Factory, Flame, Mountain, FlaskConical,
  Droplets, Wind, Thermometer, Atom, Pill, Apple,
  HardHat, MapPin
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_CONFIG: Record<GateStatus, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  clear: { icon: ShieldCheck, label: 'جاهز لاستقبال المخلفات — جميع التراخيص سارية', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' },
  warning: { icon: ShieldAlert, label: 'تنبيه — بعض الوثائق تحتاج انتباه', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
  blocked: { icon: ShieldX, label: 'محظور — تراخيص أساسية منتهية تمنع استقبال المخلفات', color: 'text-destructive', bg: 'bg-red-50 dark:bg-red-950/20' },
};

const CATEGORY_ICONS: Record<DisposalLicenseCategory, React.ElementType> = {
  core: FileCheck,
  environmental: BookOpen,
  disposal_ops: Factory,
  safety: HardHat,
  sector_specific: Shield,
};

const SECTOR_ICONS: Record<string, React.ElementType> = {
  medical: Shield, petroleum: Droplets, pharmaceutical: Pill,
  nuclear: Atom, radiation: Atom, food: Apple, industrial: Factory,
  veterinary: Shield, incineration: Flame, landfill: Mountain,
  chemical: FlaskConical,
};

export default function DisposalComplianceDashboard() {
  const { organization } = useAuth();
  const { data: gate, isLoading } = useDisposalLicenseGate();

  if (!organization || organization.organization_type !== 'disposal') {
    return <div className="p-4 text-muted-foreground text-center">هذه الصفحة مخصصة لجهات التخلص النهائي فقط</div>;
  }

  if (isLoading || !gate) {
    return <div className="p-6 text-center text-muted-foreground animate-pulse">جارٍ فحص التراخيص...</div>;
  }

  const statusConf = STATUS_CONFIG[gate.overallStatus];
  const StatusIcon = statusConf.icon;

  // Group licenses by category
  const grouped = Object.entries(DISPOSAL_LICENSE_CATEGORIES).map(([key, label]) => {
    const catKey = key as DisposalLicenseCategory;
    return {
      key: catKey,
      label,
      icon: CATEGORY_ICONS[catKey],
      licenses: gate.licenses.filter(l => l.category === catKey),
    };
  });

  const activeSectors = gate.sectorApprovals.filter(s => s.hasApproval);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Overall Status Banner */}
      <Card className={`${statusConf.bg} border-2`}>
        <CardContent className="p-6 flex items-center gap-4">
          <StatusIcon className={`h-12 w-12 ${statusConf.color}`} />
          <div className="flex-1">
            <h2 className={`text-lg font-bold ${statusConf.color}`}>{statusConf.label}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {gate.canAcceptWaste ? 'يمكنك استقبال ومعالجة المخلفات' : 'يجب تجديد التراخيص المنتهية قبل استقبال أي مخلفات'}
            </p>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${statusConf.color}`}>{gate.complianceScore}%</div>
            <div className="text-xs text-muted-foreground">نسبة الامتثال</div>
          </div>
        </CardContent>
      </Card>

      {/* Block Reasons & Warnings */}
      {gate.blockReasons.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2"><CardTitle className="text-destructive flex items-center gap-2"><XCircle className="h-5 w-5" /> أسباب الحظر</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {gate.blockReasons.map((r, i) => <li key={i} className="text-sm text-destructive flex items-center gap-2"><XCircle className="h-3 w-3" />{r}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {gate.warnings.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/10">
          <CardHeader className="pb-2"><CardTitle className="text-yellow-700 dark:text-yellow-400 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> تنبيهات</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {gate.warnings.map((w, i) => <li key={i} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2"><AlertTriangle className="h-3 w-3" />{w}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Sector Approvals Summary */}
      {activeSectors.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Factory className="h-5 w-5" /> أنواع المخلفات المصرح بالتخلص منها</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeSectors.map(s => {
                const SIcon = SECTOR_ICONS[s.sector] || Shield;
                return (
                  <Badge key={s.sector} variant="secondary" className="gap-1 px-3 py-1">
                    <SIcon className="h-3 w-3" />{s.label}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* License Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grouped.map(cat => {
          if (cat.licenses.length === 0) return null;
          const CatIcon = cat.icon;
          const filled = cat.licenses.filter(l => l.number);
          const valid = cat.licenses.filter(l => l.status === 'valid' || l.status === 'expiring');
          const catScore = filled.length > 0 ? Math.round((valid.length / filled.length) * 100) : 0;

          return (
            <Card key={cat.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><CatIcon className="h-4 w-4" />{cat.label}</CardTitle>
                  <span className="text-xs text-muted-foreground">{catScore}%</span>
                </div>
                <Progress value={catScore} className="h-1.5 mt-1" />
              </CardHeader>
              <CardContent className="space-y-2">
                {cat.licenses.map(l => {
                  const statusColor = l.status === 'valid' ? 'text-green-600' : l.status === 'expiring' ? 'text-yellow-600' : l.status === 'expired' ? 'text-destructive' : 'text-muted-foreground';
                  const statusLabel = l.status === 'valid' ? 'ساري' : l.status === 'expiring' ? `ينتهي خلال ${l.daysRemaining} يوم` : l.status === 'expired' ? 'منتهي' : 'غير مسجل';
                  const Icon = l.status === 'valid' || l.status === 'expiring' ? CheckCircle2 : l.status === 'expired' ? XCircle : AlertTriangle;

                  return (
                    <div key={l.field} className="flex items-center justify-between text-sm border-b border-border/50 pb-1.5 last:border-0">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${statusColor}`} />
                        <span>{l.label}</span>
                        {l.isCritical && <Badge variant="outline" className="text-[10px] px-1 py-0">إلزامي</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {l.number && <span className="text-xs text-muted-foreground font-mono">{l.number}</span>}
                        <Badge variant={l.status === 'valid' ? 'default' : l.status === 'expiring' ? 'secondary' : l.status === 'expired' ? 'destructive' : 'outline'} className="text-[10px]">
                          {statusLabel}
                        </Badge>
                        {l.expiry && <span className="text-[10px] text-muted-foreground">{format(parseISO(l.expiry), 'yyyy/MM/dd')}</span>}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Facility Info */}
      {gate.facilityType && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">النشاط المسجل: <strong>{gate.facilityType}</strong></span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
