/**
 * FuelShipmentLinker — Links fuel records to specific shipments
 * Shows fuel consumption per shipment for accurate cost tracking
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Link2, Unlink, Fuel, Truck, Package } from 'lucide-react';

interface FuelShipmentLinkerProps {
  records: any[];
}

export default function FuelShipmentLinker({ records }: FuelShipmentLinkerProps) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [linkingRecordId, setLinkingRecordId] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<string>('');

  // Get recent shipments for linking
  const { data: shipments = [] } = useQuery({
    queryKey: ['linkable-shipments', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, pickup_address, delivery_address, created_at')
        .eq('transporter_id', organization!.id)
        .in('status', ['approved', 'collecting', 'in_transit', 'delivered', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const linkMutation = useMutation({
    mutationFn: async ({ recordId, shipmentId }: { recordId: string; shipmentId: string }) => {
      const { error } = await (supabase as any)
        .from('fuel_records')
        .update({ shipment_id: shipmentId })
        .eq('id', recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-records'] });
      toast.success('تم ربط سجل الوقود بالشحنة');
      setLinkingRecordId(null);
      setSelectedShipment('');
    },
    onError: () => toast.error('فشل في الربط'),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await (supabase as any)
        .from('fuel_records')
        .update({ shipment_id: null })
        .eq('id', recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-records'] });
      toast.success('تم إلغاء الربط');
    },
  });

  // Calculate fuel per shipment
  const linkedRecords = records.filter((r: any) => r.shipment_id);
  const unlinkedRecords = records.filter((r: any) => !r.shipment_id);
  const shipmentFuelMap: Record<string, { liters: number; cost: number; count: number }> = {};

  for (const r of linkedRecords) {
    if (!shipmentFuelMap[r.shipment_id]) {
      shipmentFuelMap[r.shipment_id] = { liters: 0, cost: 0, count: 0 };
    }
    shipmentFuelMap[r.shipment_id].liters += r.liters || 0;
    shipmentFuelMap[r.shipment_id].cost += r.total_cost || 0;
    shipmentFuelMap[r.shipment_id].count++;
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Link2 className="h-5 w-5 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold">{linkedRecords.length}</div>
            <div className="text-xs text-muted-foreground">سجل مربوط</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Unlink className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-lg font-bold">{unlinkedRecords.length}</div>
            <div className="text-xs text-muted-foreground">غير مربوط</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Package className="h-5 w-5 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold">{Object.keys(shipmentFuelMap).length}</div>
            <div className="text-xs text-muted-foreground">شحنة مرتبطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Fuel className="h-5 w-5 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold">{linkedRecords.reduce((s: number, r: any) => s + (r.total_cost || 0), 0).toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">تكلفة مربوطة (ج.م)</div>
          </CardContent>
        </Card>
      </div>

      {/* Unlinked Records */}
      {unlinkedRecords.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Unlink className="h-4 w-4" /> سجلات غير مربوطة بشحنات
              <Badge variant="secondary">{unlinkedRecords.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unlinkedRecords.slice(0, 10).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b border-border/30 pb-2">
                <div className="flex items-center gap-2">
                  <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{r.fuel_date}</span>
                  <span className="font-mono">{r.liters}L</span>
                  <span className="text-primary">{(r.total_cost || 0).toFixed(1)} ج.م</span>
                  {r.vehicle_plate && <Badge variant="outline" className="text-[10px]">{r.vehicle_plate}</Badge>}
                </div>
                <Dialog open={linkingRecordId === r.id} onOpenChange={(open) => { if (!open) setLinkingRecordId(null); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setLinkingRecordId(r.id)}>
                      <Link2 className="h-3 w-3" /> ربط بشحنة
                    </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl">
                    <DialogHeader>
                      <DialogTitle>ربط سجل الوقود بشحنة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {r.fuel_date} — {r.liters}L — {(r.total_cost || 0).toFixed(1)} ج.م
                      </div>
                      <Select value={selectedShipment} onValueChange={setSelectedShipment}>
                        <SelectTrigger><SelectValue placeholder="اختر الشحنة" /></SelectTrigger>
                        <SelectContent>
                          {shipments.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.shipment_number} — {s.status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        className="w-full"
                        disabled={!selectedShipment || linkMutation.isPending}
                        onClick={() => linkMutation.mutate({ recordId: r.id, shipmentId: selectedShipment })}
                      >
                        {linkMutation.isPending ? 'جارٍ الربط...' : 'ربط'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Shipment Fuel Summary */}
      {Object.keys(shipmentFuelMap).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> تكلفة الوقود لكل شحنة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(shipmentFuelMap).map(([shipmentId, data]) => {
              const shipment = shipments.find(s => s.id === shipmentId);
              return (
                <div key={shipmentId} className="flex items-center justify-between text-sm border-b border-border/30 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono">{shipment?.shipment_number || shipmentId.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>{data.liters.toFixed(1)}L</span>
                    <span className="text-primary font-semibold">{data.cost.toFixed(1)} ج.م</span>
                    <Badge variant="outline" className="text-[10px]">{data.count} سجل</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
