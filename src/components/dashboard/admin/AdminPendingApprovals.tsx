import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle2, Package, AlertTriangle, ChevronLeft, Timer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { wasteTypeLabels } from '@/lib/shipmentStatusConfig';
import { useNavigate } from 'react-router-dom';

interface PendingShipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  generator_auto_approve_deadline?: string | null;
  recycler_auto_approve_deadline?: string | null;
  generator_approval_status?: string | null;
  recycler_approval_status?: string | null;
  generator_name?: string;
  transporter_name?: string;
  recycler_name?: string;
}

const AdminPendingApprovals = () => {
  const navigate = useNavigate();

  const { data: pendingShipments = [], isLoading } = useQuery({
    queryKey: ['admin-pending-approvals'],
    queryFn: async (): Promise<PendingShipment[]> => {
      // Fetch all shipments pending any approval
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, generator_id, transporter_id, recycler_id, generator_approval_status, recycler_approval_status, generator_auto_approve_deadline, recycler_auto_approve_deadline')
        .or('generator_approval_status.eq.pending,recycler_approval_status.eq.pending')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!data?.length) return [];

      const orgIds = new Set<string>();
      data.forEach(s => {
        if (s.generator_id) orgIds.add(s.generator_id);
        if (s.transporter_id) orgIds.add(s.transporter_id);
        if (s.recycler_id) orgIds.add(s.recycler_id);
      });

      const orgMap = new Map<string, string>();
      if (orgIds.size > 0) {
        const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', Array.from(orgIds));
        orgs?.forEach(o => orgMap.set(o.id, o.name));
      }

      return data.map(s => ({
        ...s,
        generator_name: s.generator_id ? orgMap.get(s.generator_id) || '—' : '—',
        transporter_name: s.transporter_id ? orgMap.get(s.transporter_id) || '—' : '—',
        recycler_name: s.recycler_id ? orgMap.get(s.recycler_id) || '—' : '—',
      }));
    },
    refetchInterval: 30_000,
  });

  const getTimeRemaining = (deadline: string) => {
    const remaining = differenceInMinutes(new Date(deadline), new Date());
    if (remaining <= 0) return 'منتهي';
    const hours = Math.floor(remaining / 60);
    const minutes = remaining % 60;
    return `${hours} س ${minutes} د`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            <Clock className="w-5 h-5" />
            شحنات بانتظار الموافقة — جميع الجهات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingShipments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            <Clock className="w-5 h-5" />
            شحنات بانتظار الموافقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mb-3 text-green-500" />
            <p>لا توجد شحنات معلقة للموافقة حالياً</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="bg-amber-50 dark:bg-amber-950/20">
        <CardTitle className="flex items-center justify-between">
          <Badge variant="destructive" className="animate-pulse">
            {pendingShipments.length}
          </Badge>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>شحنات بانتظار الموافقة — جميع الجهات</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="divide-y">
            {pendingShipments.map((shipment) => {
              const genPending = shipment.generator_approval_status === 'pending';
              const recPending = shipment.recycler_approval_status === 'pending';
              const deadline = genPending
                ? shipment.generator_auto_approve_deadline
                : shipment.recycler_auto_approve_deadline;

              return (
                <div
                  key={shipment.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="gap-1">
                      عرض <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      {genPending && <Badge variant="outline" className="text-[10px] bg-blue-50">بانتظار المولّد</Badge>}
                      {recPending && <Badge variant="outline" className="text-[10px] bg-green-50">بانتظار المدوّر</Badge>}
                      <Badge variant="outline" className="font-mono">
                        {shipment.shipment_number}
                      </Badge>
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {deadline && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1",
                            differenceInMinutes(new Date(deadline), new Date()) < 60
                              ? "bg-red-100 text-red-700 border-red-300"
                              : "bg-amber-100 text-amber-700 border-amber-300"
                          )}
                        >
                          <Timer className="w-3 h-3" />
                          {getTimeRemaining(deadline)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      <span>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</span>
                      <span className="mx-2">•</span>
                      <span>{shipment.quantity} {shipment.unit || 'كجم'}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2 text-right space-x-3 space-x-reverse">
                    <span>المولّد: {shipment.generator_name}</span>
                    <span>الناقل: {shipment.transporter_name}</span>
                    <span>المدوّر: {shipment.recycler_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdminPendingApprovals;
