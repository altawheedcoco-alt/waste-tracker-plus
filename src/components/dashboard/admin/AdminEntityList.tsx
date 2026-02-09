import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Factory, Truck, Recycle, Search, Eye, Package, Users,
  FileText, Building2, ChevronLeft, ExternalLink, Shield, Ban,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrgWithStats {
  id: string;
  name: string;
  organization_type: string;
  city: string | null;
  is_verified: boolean;
  email: string | null;
  phone: string | null;
  representative_name: string | null;
  logo_url: string | null;
  shipmentsCount: number;
  employeesCount: number;
}

const typeConfig = {
  generator: { label: 'منشأة مولدة', icon: Factory, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  transporter: { label: 'جهة ناقلة', icon: Truck, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  recycler: { label: 'جهة معالجة', icon: Recycle, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
};

interface Props {
  orgType: 'generator' | 'transporter' | 'recycler';
}

const AdminEntityList = ({ orgType }: Props) => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const config = typeConfig[orgType];
  const Icon = config.icon;

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['admin-entity-list', orgType],
    queryFn: async () => {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type, city, is_verified, email, phone, representative_name, logo_url')
        .eq('organization_type', orgType)
        .order('name');

      if (error) throw error;
      if (!orgs?.length) return [];

      const orgIds = orgs.map(o => o.id);

      // Fetch shipment counts
      const orgField = orgType === 'generator' ? 'generator_id'
        : orgType === 'recycler' ? 'recycler_id' : 'transporter_id';

      const [shipmentsRes, profilesRes] = await Promise.all([
        supabase
          .from('shipments')
          .select(`id, ${orgField}`)
          .in(orgField, orgIds),
        supabase
          .from('profiles')
          .select('id, organization_id')
          .in('organization_id', orgIds),
      ]);

      const shipmentCounts = new Map<string, number>();
      shipmentsRes.data?.forEach(s => {
        const oid = (s as any)[orgField];
        shipmentCounts.set(oid, (shipmentCounts.get(oid) || 0) + 1);
      });

      const employeeCounts = new Map<string, number>();
      profilesRes.data?.forEach(p => {
        if (p.organization_id) {
          employeeCounts.set(p.organization_id, (employeeCounts.get(p.organization_id) || 0) + 1);
        }
      });

      return orgs.map(o => ({
        ...o,
        shipmentsCount: shipmentCounts.get(o.id) || 0,
        employeesCount: employeeCounts.get(o.id) || 0,
      })) as OrgWithStats[];
    },
  });

  const filtered = organizations.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.city?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`البحث في ${config.label}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 text-right"
            dir="rtl"
          />
        </div>
        <Badge variant="secondary" className="shrink-0">
          {organizations.length} جهة
        </Badge>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {filtered.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Org Icon / Logo */}
                  <div className="shrink-0">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${config.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {org.is_verified && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Shield className="w-3 h-3" /> موثق
                        </Badge>
                      )}
                      <h3 className="font-semibold truncate">{org.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {org.city || '—'} {org.representative_name ? `• ${org.representative_name}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {org.email || '—'} • {org.phone || '—'}
                    </p>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="w-3 h-3" />
                        {org.shipmentsCount} شحنة
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {org.employeesCount} موظف
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/dashboard/organization/${org.id}`)}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      فتح لوحة التحكم
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/shipments?org=${org.id}`)}
                      className="gap-1"
                    >
                      <Package className="w-4 h-4" />
                      شحناتها
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد جهات مطابقة</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AdminEntityList;
