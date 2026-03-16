import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Printer, ExternalLink, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import UnifiedShipmentPrint from '@/components/shipments/unified-print/UnifiedShipmentPrint';

const statusLabels: Record<string, string> = {
  new: 'جديدة', approved: 'تمت الموافقة', in_transit: 'قيد النقل',
  delivered: 'تم التسليم', confirmed: 'مؤكدة', cancelled: 'ملغية',
};

const AdminShipmentSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, quantity, unit, created_at, pickup_address, delivery_address, pickup_date, expected_delivery_date, notes, generator_notes, recycler_notes, waste_description, hazard_level, packaging_method, disposal_method, approved_at, collection_started_at, in_transit_at, delivered_at, confirmed_at, manual_driver_name, manual_vehicle_plate, generator_id, transporter_id, recycler_id, driver_id')
        .or(`shipment_number.ilike.%${query.trim()}%,pickup_address.ilike.%${query.trim()}%,delivery_address.ilike.%${query.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!data?.length) {
        setResults([]);
        toast({ title: 'لا توجد نتائج', description: `لم يتم العثور على شحنة تطابق "${query}"` });
        return;
      }

      // Enrich with org names
      const orgIds = new Set<string>();
      data.forEach(s => {
        if (s.generator_id) orgIds.add(s.generator_id);
        if (s.transporter_id) orgIds.add(s.transporter_id);
        if (s.recycler_id) orgIds.add(s.recycler_id);
      });

      const orgMap = new Map<string, any>();
      if (orgIds.size > 0) {
        const { data: orgs } = await supabase.from('organizations').select('id, name, email, phone, address, city, representative_name').in('id', Array.from(orgIds));
        orgs?.forEach(o => orgMap.set(o.id, o));
      }

      // Enrich with driver info
      const driverIds = [...new Set(data.map(s => s.driver_id).filter(Boolean))] as string[];
      const driverMap = new Map<string, any>();
      if (driverIds.length > 0) {
        const { data: drivers } = await supabase
          .from('drivers')
          .select('id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)')
          .in('id', driverIds);
        drivers?.forEach(d => {
          const profile = Array.isArray(d.profile) ? d.profile[0] : d.profile;
          driverMap.set(d.id, {
            license_number: d.license_number,
            vehicle_type: d.vehicle_type,
            vehicle_plate: d.vehicle_plate,
            profile: { full_name: profile?.full_name || '', phone: profile?.phone || '' },
          });
        });
      }

      const enriched = data.map(s => ({
        ...s,
        generator: s.generator_id ? orgMap.get(s.generator_id) || null : null,
        transporter: s.transporter_id ? orgMap.get(s.transporter_id) || null : null,
        recycler: s.recycler_id ? orgMap.get(s.recycler_id) || null : null,
        driver: s.driver_id ? driverMap.get(s.driver_id) || null : null,
      }));

      setResults(enriched);
    } catch (error) {
      console.error('Search error:', error);
      toast({ title: 'خطأ في البحث', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (shipment: any) => {
    setSelectedShipment(shipment);
    setPrintOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base justify-end">
            <Search className="w-5 h-5 text-primary" />
            بحث سريع عن شحنة — طباعة وإرسال
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSearch} disabled={loading || !query.trim()} className="shrink-0">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span className="mr-1 text-xs">بحث</span>
            </Button>
            <Input
              placeholder="رقم الشحنة أو العنوان..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="text-right text-sm"
              dir="rtl"
            />
          </div>

          {results.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {results.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handlePrint(s)} title="طباعة">
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/shipments/${s.id}`)} title="عرض التفاصيل">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 text-right min-w-0">
                    <div className="flex items-center gap-2 justify-end">
                      <Badge variant="outline" className="text-[10px]">
                        {statusLabels[s.status] || s.status}
                      </Badge>
                      <span className="font-semibold text-sm font-mono">{s.shipment_number}</span>
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {s.generator?.name || '—'} → {s.transporter?.name || '—'} → {s.recycler?.name || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UnifiedShipmentPrint
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        shipment={selectedShipment}
      />
    </>
  );
};

export default AdminShipmentSearch;
