import { memo, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from '@/components/ui/back-button';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2, Users, Link2, LinkIcon, Unlink, Search,
  ShieldCheck, ShieldAlert, ShieldX, Eye, Ban, CheckCircle,
  AlertTriangle, TrendingUp, UserX, Building, Filter, ArrowLeft, ArrowRight, Network
} from "lucide-react";
import PartnershipNetwork from '@/components/admin/PartnershipNetwork';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const orgTypeLabels: Record<string, { ar: string; en: string; color: string }> = {
  generator: { ar: 'مولد', en: 'Generator', color: 'bg-blue-500/10 text-blue-600' },
  transporter: { ar: 'ناقل', en: 'Transporter', color: 'bg-orange-500/10 text-orange-600' },
  recycler: { ar: 'مدوّر', en: 'Recycler', color: 'bg-green-500/10 text-green-600' },
  disposal: { ar: 'تخلص', en: 'Disposal', color: 'bg-red-500/10 text-red-600' },
  consultant: { ar: 'استشاري', en: 'Consultant', color: 'bg-purple-500/10 text-purple-600' },
  consulting_office: { ar: 'مكتب استشاري', en: 'Consulting Office', color: 'bg-violet-500/10 text-violet-600' },
  iso_body: { ar: 'جهة أيزو', en: 'ISO Body', color: 'bg-amber-500/10 text-amber-600' },
};

const AdminEntityCensus = memo(() => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>('all');
  const [linkStatusFilter, setLinkStatusFilter] = useState<string>('all');

  // Fetch organizations with member & partner counts
  const { data: organizations = [], isLoading: orgsLoading, error: orgsError } = useQuery({
    queryKey: ['admin-census-orgs'],
    queryFn: async () => {
      try {
        const { data: orgs, error } = await supabase
          .from('organizations')
          .select('id, name, name_en, organization_type, is_active, is_verified, is_suspended, created_at, partner_code, client_code, phone, email')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching organizations:', error);
          throw error;
        }

        // Get member counts
        const { data: members, error: membersError } = await supabase
          .from('organization_members' as any)
          .select('organization_id, status');
        if (membersError) console.error('Error fetching members:', membersError);

        // Get partner counts (external_partners are non-platform partners)
        const { data: partners, error: partnersError } = await supabase
          .from('external_partners')
          .select('organization_id');
        if (partnersError) console.error('Error fetching partners:', partnersError);

        // Get verified partnerships count
        const { data: partnerships, error: partnershipError } = await supabase
          .from('verified_partnerships')
          .select('requester_org_id, partner_org_id')
          .eq('status', 'active');
        if (partnershipError) console.error('Error fetching partnerships:', partnershipError);

        const memberMap: Record<string, number> = {};
        const partnerMap: Record<string, number> = {};
        const verifiedPartnerMap: Record<string, number> = {};

        (members || []).forEach((m: any) => {
          if (m.status === 'active') {
            memberMap[m.organization_id] = (memberMap[m.organization_id] || 0) + 1;
          }
        });

        (partners || []).forEach((p: any) => {
          partnerMap[p.organization_id] = (partnerMap[p.organization_id] || 0) + 1;
        });

        (partnerships || []).forEach((p: any) => {
          verifiedPartnerMap[p.requester_org_id] = (verifiedPartnerMap[p.requester_org_id] || 0) + 1;
          verifiedPartnerMap[p.partner_org_id] = (verifiedPartnerMap[p.partner_org_id] || 0) + 1;
        });

        return (orgs || []).map((org: any) => ({
          ...org,
          activeMembers: memberMap[org.id] || 0,
          partnersCount: (partnerMap[org.id] || 0) + (verifiedPartnerMap[org.id] || 0),
          isLinked: (memberMap[org.id] || 0) > 0 || (partnerMap[org.id] || 0) > 0 || (verifiedPartnerMap[org.id] || 0) > 0,
        }));
      } catch (err) {
        console.error('Census orgs query failed:', err);
        throw err;
      }
    },
  });

  // Fetch profiles with org membership
  const { data: profiles = [], isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ['admin-census-profiles'],
    queryFn: async () => {
      try {
        const { data: profs, error } = await supabase
          .from('profiles')
          .select('id, full_name, phone, user_id, created_at')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching profiles:', error);
          throw error;
        }

        const { data: members, error: membersError } = await supabase
          .from('organization_members' as any)
          .select('user_id, organization_id, status');
        if (membersError) console.error('Error fetching member links:', membersError);

        const { data: orgs, error: orgsErr } = await supabase
          .from('organizations')
          .select('id, name');
        if (orgsErr) console.error('Error fetching org names:', orgsErr);

        const orgMap: Record<string, string> = {};
        (orgs || []).forEach((o: any) => { orgMap[o.id] = o.name; });

        const userOrgMap: Record<string, { orgId: string; orgName: string; status: string }[]> = {};
        (members || []).forEach((m: any) => {
          if (!userOrgMap[m.user_id]) userOrgMap[m.user_id] = [];
          userOrgMap[m.user_id].push({
            orgId: m.organization_id,
            orgName: orgMap[m.organization_id] || 'غير معروف',
            status: m.status,
          });
        });

        return (profs || []).map((p: any) => ({
          ...p,
          orgs: userOrgMap[p.user_id] || [],
          isLinked: (userOrgMap[p.user_id] || []).some((o: any) => o.status === 'active'),
        }));
      } catch (err) {
        console.error('Census profiles query failed:', err);
        throw err;
      }
    },
  });

  // Stats
  const stats = useMemo(() => {
    const totalOrgs = organizations.length;
    const linkedOrgs = organizations.filter((o: any) => o.isLinked).length;
    const unlinkedOrgs = totalOrgs - linkedOrgs;
    const suspendedOrgs = organizations.filter((o: any) => o.is_suspended).length;

    const totalUsers = profiles.length;
    const linkedUsers = profiles.filter((p: any) => p.isLinked).length;
    const unlinkedUsers = totalUsers - linkedUsers;

    return { totalOrgs, linkedOrgs, unlinkedOrgs, suspendedOrgs, totalUsers, linkedUsers, unlinkedUsers };
  }, [organizations, profiles]);

  // Filter organizations
  const filteredOrgs = useMemo(() => {
    return organizations.filter((org: any) => {
      const matchSearch = !search || org.name?.includes(search) || org.name_en?.toLowerCase().includes(search.toLowerCase()) || org.email?.includes(search);
      const matchType = orgTypeFilter === 'all' || org.organization_type === orgTypeFilter;
      const matchLink = linkStatusFilter === 'all' ||
        (linkStatusFilter === 'linked' && org.isLinked) ||
        (linkStatusFilter === 'unlinked' && !org.isLinked);
      return matchSearch && matchType && matchLink;
    });
  }, [organizations, search, orgTypeFilter, linkStatusFilter]);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p: any) => {
      const matchSearch = !search || p.full_name?.includes(search) || p.phone?.includes(search);
      const matchLink = linkStatusFilter === 'all' ||
        (linkStatusFilter === 'linked' && p.isLinked) ||
        (linkStatusFilter === 'unlinked' && !p.isLinked);
      return matchSearch && matchLink;
    });
  }, [profiles, search, linkStatusFilter]);

  const handleToggleSuspend = async (orgId: string, currentSuspended: boolean) => {
    const { error } = await supabase
      .from('organizations')
      .update({
        is_suspended: !currentSuspended,
        suspension_reason: !currentSuspended ? 'غير مرتبطة بأي جهة — تم الحجب تلقائياً' : null,
        suspended_at: !currentSuspended ? new Date().toISOString() : null,
      })
      .eq('id', orgId);

    if (error) {
      toast.error(isAr ? 'حدث خطأ' : 'Error occurred');
    } else {
      toast.success(!currentSuspended
        ? (isAr ? 'تم تقييد صلاحيات الجهة' : 'Entity restricted')
        : (isAr ? 'تم إلغاء التقييد' : 'Restriction removed'));
      queryClient.invalidateQueries({ queryKey: ['admin-census-orgs'] });
    }
  };

  const handleBulkRestrict = async () => {
    const unlinkedIds = organizations.filter((o: any) => !o.isLinked && !o.is_suspended).map((o: any) => o.id);
    if (unlinkedIds.length === 0) {
      toast.info(isAr ? 'لا توجد جهات غير مرتبطة لتقييدها' : 'No unlinked entities to restrict');
      return;
    }

    for (const id of unlinkedIds) {
      await supabase.from('organizations').update({
        is_suspended: true,
        suspension_reason: 'غير مرتبطة بأي جهة — تم الحجب تلقائياً',
        suspended_at: new Date().toISOString(),
      }).eq('id', id);
    }

    toast.success(isAr ? `تم تقييد ${unlinkedIds.length} جهة غير مرتبطة` : `Restricted ${unlinkedIds.length} unlinked entities`);
    queryClient.invalidateQueries({ queryKey: ['admin-census-orgs'] });
  };

  const isLoading = orgsLoading || profilesLoading;
  const hasError = orgsError || profilesError;

  return (
    <DashboardLayout>
    <div className="p-4 sm:p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <BackButton />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            {isAr ? 'حصر وربط الكيانات' : 'Entity Census & Linking'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr ? 'حصر جميع المنظمات والمستخدمين وحالة ارتباطهم — مع تقييد الجهات غير المرتبطة' : 'Census of all organizations and users with linking status — restrict unlinked entities'}
          </p>
        </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleBulkRestrict} className="gap-2">
          <Ban className="w-4 h-4" />
          {isAr ? 'تقييد جميع غير المرتبطين' : 'Restrict All Unlinked'}
        </Button>
      </div>

      {hasError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-bold text-destructive">{isAr ? 'خطأ في تحميل البيانات' : 'Error loading data'}</p>
              <p className="text-xs text-muted-foreground">{(orgsError as any)?.message || (profilesError as any)?.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: isAr ? 'إجمالي المنظمات' : 'Total Orgs', value: stats.totalOrgs, icon: Building2, color: 'text-foreground' },
          { label: isAr ? 'مرتبطة' : 'Linked', value: stats.linkedOrgs, icon: Link2, color: 'text-green-600' },
          { label: isAr ? 'غير مرتبطة' : 'Unlinked', value: stats.unlinkedOrgs, icon: Unlink, color: 'text-red-600' },
          { label: isAr ? 'موقوفة' : 'Suspended', value: stats.suspendedOrgs, icon: Ban, color: 'text-amber-600' },
          { label: isAr ? 'إجمالي المستخدمين' : 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-foreground' },
          { label: isAr ? 'مستخدمون مرتبطون' : 'Linked Users', value: stats.linkedUsers, icon: CheckCircle, color: 'text-green-600' },
          { label: isAr ? 'مستخدمون بلا جهة' : 'Orphan Users', value: stats.unlinkedUsers, icon: UserX, color: 'text-red-600' },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-3 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'بحث بالاسم أو الهاتف أو البريد...' : 'Search by name, phone, or email...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          <Select value={orgTypeFilter} onValueChange={setOrgTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={isAr ? 'نوع الجهة' : 'Entity type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              {Object.entries(orgTypeLabels).map(([key, val]) => (
                <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={linkStatusFilter} onValueChange={setLinkStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={isAr ? 'حالة الربط' : 'Link status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="linked">{isAr ? 'مرتبطة' : 'Linked'}</SelectItem>
              <SelectItem value="unlinked">{isAr ? 'غير مرتبطة' : 'Unlinked'}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="organizations" className="gap-2">
            <Building2 className="w-4 h-4" />
            {isAr ? `المنظمات (${filteredOrgs.length})` : `Organizations (${filteredOrgs.length})`}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            {isAr ? `المستخدمون (${filteredProfiles.length})` : `Users (${filteredProfiles.length})`}
          </TabsTrigger>
          <TabsTrigger value="network" className="gap-2">
            <Network className="w-4 h-4" />
            {isAr ? 'شبكة الربط' : 'Network'}
          </TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{isAr ? 'لا توجد نتائج' : 'No results'}</div>
          ) : (
            filteredOrgs.map((org: any) => {
              const typeInfo = orgTypeLabels[org.organization_type] || { ar: org.organization_type, en: org.organization_type, color: 'bg-muted text-muted-foreground' };
              return (
                <Card key={org.id} className={`border-border/50 transition-all ${org.is_suspended ? 'opacity-60 border-destructive/30' : ''}`}>
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground truncate">{org.name}</h3>
                        <Badge className={typeInfo.color + ' border-0 text-[10px]'}>
                          {isAr ? typeInfo.ar : typeInfo.en}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {org.partner_code && (
                          <span className="flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            {isAr ? 'كود:' : 'Code:'} {org.partner_code}
                          </span>
                        )}
                        <span>{isAr ? 'أعضاء:' : 'Members:'} {org.activeMembers}</span>
                        <span>{isAr ? 'شركاء:' : 'Partners:'} {org.partnersCount}</span>
                        {org.email && <span>{org.email}</span>}
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {org.isLinked ? (
                        <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600 bg-green-500/5">
                          <Link2 className="w-3 h-3" />
                          {isAr ? 'مرتبطة' : 'Linked'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-destructive/30 text-destructive bg-destructive/5">
                          <Unlink className="w-3 h-3" />
                          {isAr ? 'غير مرتبطة' : 'Unlinked'}
                        </Badge>
                      )}
                      {org.is_suspended && (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <Ban className="w-3 h-3" />
                          {isAr ? 'مقيّدة' : 'Restricted'}
                        </Badge>
                      )}
                      {org.is_verified && (
                        <Badge variant="outline" className="gap-1 border-blue-500/30 text-blue-600 bg-blue-500/5 text-[10px]">
                          <ShieldCheck className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <Button
                      variant={org.is_suspended ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => handleToggleSuspend(org.id, org.is_suspended)}
                      className="gap-1 text-xs shrink-0"
                    >
                      {org.is_suspended ? (
                        <><CheckCircle className="w-3 h-3" />{isAr ? 'إلغاء التقييد' : 'Unrestrict'}</>
                      ) : (
                        <><Ban className="w-3 h-3" />{isAr ? 'تقييد' : 'Restrict'}</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{isAr ? 'لا توجد نتائج' : 'No results'}</div>
          ) : (
            filteredProfiles.map((profile: any) => (
              <Card key={profile.id} className={`border-border/50 transition-all ${!profile.isLinked ? 'border-amber-500/30' : ''}`}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{profile.full_name || (isAr ? 'بدون اسم' : 'No name')}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {profile.phone && <span>{profile.phone}</span>}
                      <span>{new Date(profile.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                    </div>
                    {profile.orgs.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {profile.orgs.map((org: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] gap-1">
                            <Building className="w-3 h-3" />
                            {org.orgName}
                            {org.status !== 'active' && (
                              <span className="text-amber-500">({org.status})</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {profile.isLinked ? (
                      <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600 bg-green-500/5">
                        <Link2 className="w-3 h-3" />
                        {isAr ? 'مرتبط' : 'Linked'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 bg-amber-500/5">
                        <UserX className="w-3 h-3" />
                        {isAr ? 'بلا جهة' : 'No org'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        {/* Network Tab */}
        <TabsContent value="network">
          <PartnershipNetwork />
        </TabsContent>
      </Tabs>
    </div>
  );
}
    </DashboardLayout>
);

AdminEntityCensus.displayName = 'AdminEntityCensus';

export default AdminEntityCensus;
