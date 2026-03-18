import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useRestrictionEnforcer } from '@/hooks/useRestrictionEnforcer';
import { usePartnerRestrictions, RESTRICTION_TYPES, RestrictionType } from '@/hooks/usePartnerRestrictions';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldBan, ShieldAlert, Clock, AlertTriangle, BarChart3, Users, ArrowUpDown,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const RestrictionsMonitor = () => {
  const { organization } = useAuth();
  const { stats, restrictions, restrictionsAgainstUs, getExpiringRestrictions } = useRestrictionEnforcer();
  const expiring = getExpiringRestrictions(7);

  // Fetch org names for restricted orgs
  const restrictedOrgIds = useMemo(() => {
    const ids = new Set<string>();
    restrictions.forEach(r => ids.add(r.restricted_org_id));
    restrictionsAgainstUs.forEach(r => ids.add(r.organization_id));
    return Array.from(ids);
  }, [restrictions, restrictionsAgainstUs]);

  const { data: orgNames = {} } = useQuery({
    queryKey: ['restriction-org-names', restrictedOrgIds],
    queryFn: async () => {
      if (restrictedOrgIds.length === 0) return {};
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', restrictedOrgIds);
      const map: Record<string, string> = {};
      data?.forEach(o => { map[o.id] = o.name; });
      return map;
    },
    enabled: restrictedOrgIds.length > 0,
  });

  // Fetch affected shipments count
  const { data: affectedShipments = 0 } = useQuery({
    queryKey: ['affected-shipments-count', organization?.id, restrictions],
    queryFn: async () => {
      if (!organization?.id || restrictions.length === 0) return 0;
      const blockedOrgIds = restrictions
        .filter(r => r.is_active && ['block_shipments', 'block_all', 'suspend_partnership', 'blacklist'].includes(r.restriction_type))
        .map(r => r.restricted_org_id);
      if (blockedOrgIds.length === 0) return 0;

      const { count } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('transporter_id', organization.id)
        .in('generator_id', blockedOrgIds)
        .in('status', ['new', 'in_transit', 'collecting']);
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  const getRestrictionMeta = (type: string) =>
    RESTRICTION_TYPES.find(rt => rt.type === type);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldBan className="h-6 w-6 text-destructive" />
            مراقبة التقييدات
          </h1>
          <p className="text-muted-foreground">
            عرض شامل لجميع التقييدات النشطة والمفروضة مع تأثيرها على العمليات
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <ShieldBan className="h-8 w-8 mx-auto text-destructive mb-2" />
              <div className="text-2xl font-bold">{stats.totalActive}</div>
              <div className="text-xs text-muted-foreground">تقييد نشط</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ShieldAlert className="h-8 w-8 mx-auto text-destructive/70 mb-2" />
              <div className="text-2xl font-bold">{stats.restrictedAgainstUs}</div>
              <div className="text-xs text-muted-foreground">مفروض علينا</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <div className="text-2xl font-bold">{stats.expiringSoon}</div>
              <div className="text-xs text-muted-foreground">تنتهي قريباً</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{affectedShipments}</div>
              <div className="text-xs text-muted-foreground">شحنات متأثرة</div>
            </CardContent>
          </Card>
        </div>

        {/* Expiring Soon Warning */}
        {expiring.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                تقييدات تنتهي قريباً (خلال 7 أيام)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {expiring.map(r => {
                const meta = getRestrictionMeta(r.restriction_type);
                const daysLeft = r.expires_at ? differenceInDays(new Date(r.expires_at), new Date()) : 0;
                return (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-background border">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{meta?.icon}</span>
                      <span className="font-medium">{orgNames[r.restricted_org_id] || 'جهة غير معروفة'}</span>
                      <Badge variant="outline" className="text-xs">{meta?.label}</Badge>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {daysLeft} يوم متبقي
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Restrictions Tabs */}
        <Tabs defaultValue="imposed" dir="rtl">
          <TabsList>
            <TabsTrigger value="imposed" className="gap-1.5">
              <ShieldBan className="h-4 w-4" />
              تقييدات فرضناها ({restrictions.filter(r => r.is_active).length})
            </TabsTrigger>
            <TabsTrigger value="against-us" className="gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              مفروضة علينا ({restrictionsAgainstUs.filter(r => r.is_active).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="imposed">
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {restrictions.filter(r => r.is_active).length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <ShieldBan className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>لا توجد تقييدات نشطة مفروضة من طرفك</p>
                    </CardContent>
                  </Card>
                ) : (
                  restrictions.filter(r => r.is_active).map(r => {
                    const meta = getRestrictionMeta(r.restriction_type);
                    return (
                      <Card key={r.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {r.expires_at && (
                                <Badge variant="outline" className="text-xs">
                                  ينتهي {format(new Date(r.expires_at), 'yyyy/MM/dd', { locale: ar })}
                                </Badge>
                              )}
                              {!r.expires_at && <Badge variant="destructive" className="text-xs">دائم</Badge>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{meta?.icon}</span>
                              <div className="text-right">
                                <div className="font-semibold text-sm">
                                  {orgNames[r.restricted_org_id] || r.restricted_org_id.slice(0, 8)}
                                </div>
                                <div className="text-xs text-muted-foreground">{meta?.label} — {meta?.description}</div>
                              </div>
                            </div>
                          </div>
                          {r.reason && (
                            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 text-right">
                              السبب: {r.reason}
                            </div>
                          )}
                          <div className="mt-2 text-xs text-muted-foreground text-right">
                            منذ {formatDistanceToNow(new Date(r.created_at), { locale: ar, addSuffix: true })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="against-us">
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {restrictionsAgainstUs.filter(r => r.is_active).length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>لا توجد تقييدات مفروضة عليك من جهات أخرى</p>
                    </CardContent>
                  </Card>
                ) : (
                  restrictionsAgainstUs.filter(r => r.is_active).map(r => {
                    const meta = getRestrictionMeta(r.restriction_type);
                    return (
                      <Card key={r.id} className="border-destructive/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <Badge variant="destructive" className="text-xs">مفروض علينا</Badge>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{meta?.icon}</span>
                              <div className="text-right">
                                <div className="font-semibold text-sm">
                                  {orgNames[r.organization_id] || r.organization_id.slice(0, 8)}
                                </div>
                                <div className="text-xs text-muted-foreground">{meta?.label}</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground text-right">
                            منذ {formatDistanceToNow(new Date(r.created_at), { locale: ar, addSuffix: true })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Restriction Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">توزيع التقييدات حسب النوع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {RESTRICTION_TYPES.map(rt => (
                <div
                  key={rt.type}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
                >
                  <span className="text-xl">{rt.icon}</span>
                  <div className="flex-1 text-right">
                    <div className="text-xs font-medium">{rt.label}</div>
                    <div className="text-lg font-bold">{stats.byType[rt.type] || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RestrictionsMonitor;
