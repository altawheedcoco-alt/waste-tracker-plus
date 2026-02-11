import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Truck,
  Recycle,
  Factory,
  Trash2,
  Users,
  FileText,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  UserCheck,
} from 'lucide-react';

interface OrgHealth {
  id: string;
  name: string;
  type: string;
  is_verified: boolean;
  members_count: number;
  shipments_count: number;
  drivers_count: number;
  docs_count: number;
  invoices_count: number;
  health_score: number;
  status: 'healthy' | 'warning' | 'inactive';
  issues: string[];
}

const typeConfig: Record<string, { label: string; icon: typeof Building2; gradient: string }> = {
  generator: { label: 'مولّد نفايات', icon: Factory, gradient: 'from-amber-500 to-orange-500' },
  transporter: { label: 'ناقل', icon: Truck, gradient: 'from-blue-500 to-cyan-500' },
  recycler: { label: 'مُعيد تدوير', icon: Recycle, gradient: 'from-green-500 to-emerald-500' },
  disposal: { label: 'تخلص نهائي', icon: Trash2, gradient: 'from-red-500 to-rose-500' },
};

const useOrganizationsHealth = () => {
  return useQuery({
    queryKey: ['organizations-health'],
    queryFn: async (): Promise<OrgHealth[]> => {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type, is_verified');

      if (error) throw error;
      if (!orgs) return [];

      const results = await Promise.all(
        orgs.map(async (org) => {
          const [members, shipGen, shipTrans, shipRecy, drivers, docs, invoices] = await Promise.all([
            supabase.from('user_organizations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
            supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('generator_id', org.id),
            supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('transporter_id', org.id),
            supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('recycler_id', org.id),
            supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
            supabase.from('organization_documents').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
            supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
          ]);

          const shipmentsCount = (shipGen.count || 0) + (shipTrans.count || 0) + (shipRecy.count || 0);
          const membersCount = members.count || 0;
          const driversCount = drivers.count || 0;
          const docsCount = docs.count || 0;
          const invoicesCount = invoices.count || 0;

          const issues: string[] = [];
          if (!org.is_verified) issues.push('المؤسسة غير موثقة');
          if (shipmentsCount === 0) issues.push('لا توجد شحنات');
          if (membersCount <= 1) issues.push('عضو واحد فقط');
          if (docsCount === 0) issues.push('لا توجد وثائق مرفوعة');
          if (org.organization_type === 'transporter' && driversCount === 0) issues.push('لا يوجد سائقين مسجلين');

          let healthScore = 100;
          if (!org.is_verified) healthScore -= 30;
          if (shipmentsCount === 0) healthScore -= 30;
          if (docsCount === 0) healthScore -= 15;
          if (membersCount <= 1) healthScore -= 10;
          if (org.organization_type === 'transporter' && driversCount === 0) healthScore -= 15;
          healthScore = Math.max(0, healthScore);

          const status: OrgHealth['status'] =
            healthScore >= 80 ? 'healthy' : healthScore >= 40 ? 'warning' : 'inactive';

          return {
            id: org.id,
            name: org.name,
            type: org.organization_type,
            is_verified: org.is_verified,
            members_count: membersCount,
            shipments_count: shipmentsCount,
            drivers_count: driversCount,
            docs_count: docsCount,
            invoices_count: invoicesCount,
            health_score: healthScore,
            status,
            issues,
          };
        })
      );

      return results.sort((a, b) => b.health_score - a.health_score);
    },
    refetchInterval: 30000,
  });
};

const StatusIcon = ({ status }: { status: OrgHealth['status'] }) => {
  if (status === 'healthy') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  return <XCircle className="w-5 h-5 text-red-500" />;
};

const statusLabel = (status: OrgHealth['status']) => {
  if (status === 'healthy') return 'نشطة وسليمة';
  if (status === 'warning') return 'تحتاج انتباه';
  return 'غير نشطة';
};

const statusBadgeVariant = (status: OrgHealth['status']) => {
  if (status === 'healthy') return 'default' as const;
  if (status === 'warning') return 'secondary' as const;
  return 'destructive' as const;
};

const OrgCard = ({ org }: { org: OrgHealth }) => {
  const config = typeConfig[org.type] || typeConfig.generator;
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} text-white`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{org.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{config.label}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusIcon status={org.status} />
            {org.is_verified && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">مؤشر الصحة</span>
            <Badge variant={statusBadgeVariant(org.status)} className="text-xs">
              {statusLabel(org.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={org.health_score}
              className={`h-2.5 flex-1 ${
                org.health_score >= 80 ? '[&>div]:bg-green-500' :
                org.health_score >= 40 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
              }`}
            />
            <span className="text-sm font-bold min-w-[36px] text-left">{org.health_score}%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Package className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">شحنات</p>
              <p className="text-sm font-semibold">{org.shipments_count}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">أعضاء</p>
              <p className="text-sm font-semibold">{org.members_count}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">سائقين</p>
              <p className="text-sm font-semibold">{org.drivers_count}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">وثائق</p>
              <p className="text-sm font-semibold">{org.docs_count}</p>
            </div>
          </div>
        </div>

        {/* Issues */}
        {org.issues.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t">
            {org.issues.map((issue, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0" />
                {issue}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const OrganizationsHealthTab = () => {
  const { data: orgs, isLoading } = useOrganizationsHealth();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-10 w-full" /></CardHeader>
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!orgs || orgs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد مؤسسات مسجلة حالياً</p>
        </CardContent>
      </Card>
    );
  }

  const healthy = orgs.filter(o => o.status === 'healthy').length;
  const warning = orgs.filter(o => o.status === 'warning').length;
  const inactive = orgs.filter(o => o.status === 'inactive').length;

  // Group by type
  const grouped = orgs.reduce<Record<string, OrgHealth[]>>((acc, org) => {
    if (!acc[org.type]) acc[org.type] = [];
    acc[org.type].push(org);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{healthy}</p>
              <p className="text-xs text-muted-foreground">جهات نشطة وسليمة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-500/10">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{warning}</p>
              <p className="text-xs text-muted-foreground">تحتاج انتباه</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{inactive}</p>
              <p className="text-xs text-muted-foreground">غير نشطة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grouped by type */}
      {Object.entries(grouped).map(([type, typeOrgs]) => {
        const config = typeConfig[type] || typeConfig.generator;
        const TypeIcon = config.icon;
        return (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.gradient} text-white`}>
                <TypeIcon className="w-4 h-4" />
              </div>
              <h3 className="font-semibold">{config.label}</h3>
              <Badge variant="outline">{typeOrgs.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typeOrgs.map(org => (
                <OrgCard key={org.id} org={org} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
