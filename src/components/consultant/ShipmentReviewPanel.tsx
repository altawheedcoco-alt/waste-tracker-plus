import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, Building2, Truck, Recycle, AlertTriangle, CheckCircle2,
  Clock, Eye, Loader2, Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-muted text-foreground' },
  accepted: { label: 'مقبولة', color: 'bg-blue-100 text-blue-700' },
  in_transit: { label: 'في الطريق', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-700' },
  recycled: { label: 'تم التدوير', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'مرفوضة', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'ملغاة', color: 'bg-muted text-muted-foreground' },
};

const ShipmentReviewPanel = memo(({ assignments }: { assignments: any[] }) => {
  const navigate = useNavigate();
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const orgIds = assignments.map((a: any) => a.organization?.id).filter(Boolean);

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['consultant-shipments-review', orgIds.join(','), selectedOrg, statusFilter],
    queryFn: async () => {
      const targetOrgIds = selectedOrg === 'all' ? orgIds : [selectedOrg];
      
      let query = supabase
        .from('shipments')
        .select(`
          id, status, waste_type, quantity, unit, created_at, pickup_date,
          generator:organizations!shipments_generator_id_fkey(name),
          transporter:organizations!shipments_transporter_id_fkey(name),
          recycler:organizations!shipments_recycler_id_fkey(name)
        `)
        .in('generator_id', targetOrgIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: orgIds.length > 0,
    staleTime: 60000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="w-5 h-5 text-indigo-600" />
          مراجعة الشحنات
        </CardTitle>
        <CardDescription>مراجعة شحنات الجهات المرتبطة والتحقق من الامتثال</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-48 text-sm">
              <SelectValue placeholder="اختر الجهة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الجهات</SelectItem>
              {assignments.map((a: any) => (
                <SelectItem key={a.organization?.id} value={a.organization?.id || ''}>
                  {a.organization?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 text-sm">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(statusLabels).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">لا توجد شحنات بالفلتر المحدد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shipments.map((shipment: any, i: number) => {
              const st = statusLabels[shipment.status] || { label: shipment.status, color: 'bg-muted text-foreground' };
              return (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{shipment.waste_type || 'نوع غير محدد'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {shipment.quantity} {shipment.unit || 'طن'} • {shipment.created_at ? format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar }) : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{(shipment.generator as any)?.name || '-'}</span>
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{(shipment.transporter as any)?.name || '-'}</span>
                    <span className="flex items-center gap-1"><Recycle className="w-3 h-3" />{(shipment.recycler as any)?.name || '-'}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ShipmentReviewPanel.displayName = 'ShipmentReviewPanel';
export default ShipmentReviewPanel;
