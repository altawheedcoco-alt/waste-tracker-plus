/**
 * DriverLinkedOrganizations - يعرض جميع الجهات المرتبط بها السائق
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Truck, LinkIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LinkedOrg {
  id: string;
  name: string;
  organization_type: string;
  logo_url: string | null;
  phone: string | null;
  city: string | null;
  is_primary: boolean;
}

export default function DriverLinkedOrganizations() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<LinkedOrg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchLinkedOrgs = async () => {
      try {
        // Get all organizations this driver belongs to via user_organizations
        const { data: userOrgs } = await supabase
          .from('user_organizations')
          .select('organization_id, is_primary')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (!userOrgs || userOrgs.length === 0) {
          // Fallback: check drivers table
          const { data: driverOrgs } = await supabase
            .from('drivers')
            .select('organization_id')
            .eq('profile_id', user.id);

          if (driverOrgs && driverOrgs.length > 0) {
            const orgIds = driverOrgs.map(d => d.organization_id).filter(Boolean);
            if (orgIds.length > 0) {
              const { data: orgsData } = await supabase
                .from('organizations')
                .select('id, name, organization_type, logo_url, phone, city')
                .in('id', orgIds);

              setOrgs((orgsData || []).map(o => ({ ...o, is_primary: true })));
            }
          }
        } else {
          const orgIds = userOrgs.map(uo => uo.organization_id);
          const primaryMap = Object.fromEntries(userOrgs.map(uo => [uo.organization_id, uo.is_primary]));

          const { data: orgsData } = await supabase
            .from('organizations')
            .select('id, name, organization_type, logo_url, phone, city')
            .in('id', orgIds);

          setOrgs((orgsData || []).map(o => ({
            ...o,
            is_primary: !!primaryMap[o.id],
          })));
        }
      } catch (err) {
        console.error('Error fetching linked orgs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedOrgs();
  }, [user?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const orgTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      transporter: 'جهة نقل',
      generator: 'جهة مولدة',
      recycler: 'جهة تدوير',
      disposal: 'تخلص نهائي',
      transport_office: 'مكتب نقل',
    };
    return map[type] || type;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <LinkIcon className="w-4 h-4 text-primary" />
          الجهات المرتبط بها
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {orgs.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {orgs.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>لم يتم الارتباط بأي جهة بعد</p>
            <p className="text-xs mt-1">يمكنك الارتباط بجهة ناقلة عبر كود الربط</p>
          </div>
        ) : (
          orgs.map((org) => (
            <div
              key={org.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/30 hover:border-primary/30 transition-colors"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={org.logo_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <Truck className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{org.name}</span>
                  {org.is_primary && (
                    <Badge variant="default" className="text-[9px] px-1 py-0 h-4 shrink-0">
                      أساسية
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span>{orgTypeLabel(org.organization_type)}</span>
                  {org.city && (
                    <>
                      <span>•</span>
                      <span>{org.city}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
