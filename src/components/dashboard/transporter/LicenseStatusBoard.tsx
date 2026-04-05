/**
 * لوحة حالة التراخيص الشاملة - فكرة #1
 * عرض كل التراخيص (EEAA، WMRA، نقل بري، دفاع مدني) بحالتها
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface LicenseInfo {
  id: string;
  type: string;
  typeAr: string;
  issuer: string;
  number: string;
  validUntil: string;
  status: 'active' | 'expiring' | 'critical' | 'expired';
  daysLeft: number;
  wasteTypes?: string[];
  governorates?: string[];
}

export default function LicenseStatusBoard() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: permits, isLoading } = useQuery({
    queryKey: ['transporter-licenses', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('permits' as any)
        .select('*')
        .eq('organization_id', orgId!)
        .order('valid_until', { ascending: true });
      return data || [];
    },
  });

  const licenses = useMemo((): LicenseInfo[] => {
    const now = new Date();
    return (permits || []).map(p => {
      const validUntil = p.valid_until ? new Date(p.valid_until) : null;
      const daysLeft = validUntil
        ? Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let status: LicenseInfo['status'] = 'active';
      if (daysLeft < 0) status = 'expired';
      else if (daysLeft <= 15) status = 'critical';
      else if (daysLeft <= 45) status = 'expiring';

      const typeMap: Record<string, string> = {
        environmental_approval: 'موافقة بيئية - EEAA',
        wmra_license: 'ترخيص WMRA',
        transport_license: 'ترخيص نقل بري',
        civil_defense: 'موافقة دفاع مدني',
        industrial_control: 'رقابة صناعية',
      };

      return {
        id: p.id,
        type: p.permit_type || 'other',
        typeAr: typeMap[p.permit_type || ''] || p.permit_type || 'ترخيص آخر',
        issuer: p.issuing_authority || 'جهة غير محددة',
        number: p.permit_number || '-',
        validUntil: p.valid_until || '-',
        status,
        daysLeft,
      };
    });
  }, [permits]);

  const statusConfig = {
    active: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle, label: 'ساري' },
    expiring: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock, label: 'يقترب' },
    critical: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: AlertTriangle, label: 'حرج' },
    expired: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle, label: 'منتهي' },
  };

  const overallHealth = useMemo(() => {
    if (!licenses.length) return 100;
    const expired = licenses.filter(l => l.status === 'expired').length;
    const critical = licenses.filter(l => l.status === 'critical').length;
    const total = licenses.length;
    return Math.max(0, Math.round(((total - expired * 2 - critical) / total) * 100));
  }, [licenses]);

  if (isLoading) return <Skeleton className="h-[320px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            حالة التراخيص والتصاريح
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">صحة الامتثال</span>
            <Badge variant={overallHealth > 80 ? 'default' : overallHealth > 50 ? 'secondary' : 'destructive'}>
              {overallHealth}%
            </Badge>
          </div>
        </div>
        <Progress value={overallHealth} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent>
        {licenses.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">لم يتم تسجيل تراخيص بعد</p>
            <Button variant="outline" size="sm" className="mt-3">
              <RefreshCw className="h-3.5 w-3.5 ml-1" /> إضافة ترخيص
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {licenses.slice(0, 6).map(license => {
              const config = statusConfig[license.status];
              const Icon = config.icon;
              return (
                <div key={license.id} className={`flex items-center justify-between p-2.5 rounded-lg border ${config.color}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{license.typeAr}</p>
                      <p className="text-[10px] text-muted-foreground">{license.number}</p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {license.status === 'expired' ? 'منتهي' : `${license.daysLeft} يوم`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
