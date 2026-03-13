import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Truck, Phone, Mail, MapPin, CheckCircle2, XCircle,
  Search, Users, Shield, Clock,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface Driver {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  is_active: boolean;
  total_trips: number;
  current_location_lat: number | null;
  current_location_lng: number | null;
  created_at: string;
}

export default function OrgDriversPanel() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['org-drivers', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Driver[];
    },
    enabled: !!organization?.id,
  });

  const filtered = useMemo(() => {
    if (!search) return drivers;
    const q = search.toLowerCase();
    return drivers.filter(d =>
      d.full_name?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.license_number?.toLowerCase().includes(q) ||
      d.vehicle_plate?.toLowerCase().includes(q)
    );
  }, [drivers, search]);

  const activeDrivers = drivers.filter(d => d.is_active);
  const availableDrivers = drivers.filter(d => d.is_available && d.is_active);

  const isTransporter = organization?.organization_type === 'transporter';

  if (!isTransporter) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Truck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">إدارة السائقين متاحة لجهات النقل فقط</p>
          <p className="text-xs text-muted-foreground mt-1">نوع جهتك الحالي: {organization?.organization_type}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-primary">{drivers.length}</p>
          <p className="text-[10px] text-muted-foreground">إجمالي السائقين</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-green-600">{activeDrivers.length}</p>
          <p className="text-[10px] text-muted-foreground">نشط</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{availableDrivers.length}</p>
          <p className="text-[10px] text-muted-foreground">متاح الآن</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-amber-600">{drivers.reduce((a, d) => a + (d.total_trips || 0), 0)}</p>
          <p className="text-[10px] text-muted-foreground">إجمالي الرحلات</p>
        </CardContent></Card>
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الرخصة أو اللوحة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 text-right"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/transporter-drivers')}>
          <Truck className="w-4 h-4 ml-1" /> إدارة السائقين الكاملة
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/driver-tracking')}>
          <MapPin className="w-4 h-4 ml-1" /> التتبع المباشر
        </Button>
      </div>

      {/* Drivers List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'لا توجد نتائج مطابقة' : 'لا يوجد سائقين مسجلين'}
              </p>
            </CardContent>
          </Card>
        )}

        {filtered.map(driver => (
          <Card key={driver.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={driver.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    <Truck className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-medium truncate">{driver.full_name}</p>
                  <div className="flex items-center gap-2 flex-wrap justify-end text-[10px] text-muted-foreground">
                    {driver.license_number && <span className="flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" />{driver.license_number}</span>}
                    {driver.vehicle_plate && <span className="flex items-center gap-0.5"><Truck className="w-2.5 h-2.5" />{driver.vehicle_plate}</span>}
                    {driver.phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{driver.phone}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {driver.is_available && driver.is_active ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 ml-0.5" /> متاح
                    </Badge>
                  ) : driver.is_active ? (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px]">
                      <Clock className="w-3 h-3 ml-0.5" /> مشغول
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      <XCircle className="w-3 h-3 ml-0.5" /> غير نشط
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">{driver.total_trips || 0} رحلة</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
