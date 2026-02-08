import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  Package,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { wasteTypeLabels } from '@/lib/shipmentStatusConfig';
import ShipmentApprovalDialog from './ShipmentApprovalDialog';

interface PendingShipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  pickup_address?: string;
  delivery_address?: string;
  created_at: string;
  generator_auto_approve_deadline?: string;
  recycler_auto_approve_deadline?: string;
  generator?: { name: string } | null;
  transporter?: { name: string } | null;
  recycler?: { name: string } | null;
}

export default function PendingApprovalsWidget() {
  const { organization } = useAuth();
  const [pendingShipments, setPendingShipments] = useState<PendingShipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<PendingShipment | null>(null);
  const [approvalType, setApprovalType] = useState<'generator' | 'recycler'>('generator');

  const organizationType = organization?.organization_type;
  const organizationId = organization?.id;

  const fetchPendingApprovals = async () => {
    if (!organizationId || !organizationType) return;

    setIsLoading(true);
    try {
      let query = supabase.from('shipments').select('*');

      if (organizationType === 'generator') {
        query = query
          .eq('generator_id', organizationId)
          .eq('generator_approval_status', 'pending')
          .not('generator_auto_approve_deadline', 'is', null);
      } else if (organizationType === 'recycler') {
        query = query
          .eq('recycler_id', organizationId)
          .eq('recycler_approval_status', 'pending')
          .not('recycler_auto_approve_deadline', 'is', null);
      } else {
        setIsLoading(false);
        return;
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related organizations
      if (data && data.length > 0) {
        const orgIds = new Set<string>();
        data.forEach((s) => {
          if (s.generator_id) orgIds.add(s.generator_id);
          if (s.transporter_id) orgIds.add(s.transporter_id);
          if (s.recycler_id) orgIds.add(s.recycler_id);
        });

        const { data: orgsData } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', Array.from(orgIds));

        const orgsMap = new Map<string, { name: string }>();
        orgsData?.forEach((org) => orgsMap.set(org.id, { name: org.name }));

        const enrichedData = data.map((s) => ({
          ...s,
          generator: s.generator_id ? orgsMap.get(s.generator_id) : null,
          transporter: s.transporter_id ? orgsMap.get(s.transporter_id) : null,
          recycler: s.recycler_id ? orgsMap.get(s.recycler_id) : null,
        }));

        setPendingShipments(enrichedData);
      } else {
        setPendingShipments([]);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('pending-approvals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
        },
        () => {
          fetchPendingApprovals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, organizationType]);

  const handleApprovalClick = (shipment: PendingShipment) => {
    setSelectedShipment(shipment);
    setApprovalType(organizationType === 'generator' ? 'generator' : 'recycler');
  };

  const getTimeRemaining = (deadline: string) => {
    const remaining = differenceInMinutes(new Date(deadline), new Date());
    if (remaining <= 0) return 'منتهي';
    const hours = Math.floor(remaining / 60);
    const minutes = remaining % 60;
    return `${hours} س ${minutes} د`;
  };

  if (organizationType !== 'generator' && organizationType !== 'recycler') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            الشحنات المعلقة للموافقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingShipments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            الشحنات المعلقة للموافقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mb-3 text-green-500" />
            <p>لا توجد شحنات معلقة للموافقة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader className="bg-amber-50 dark:bg-amber-950/20">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>الشحنات المعلقة للموافقة</span>
            </div>
            <Badge variant="destructive" className="animate-pulse">
              {pendingShipments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {pendingShipments.map((shipment) => {
                const deadline = organizationType === 'generator'
                  ? shipment.generator_auto_approve_deadline
                  : shipment.recycler_auto_approve_deadline;

                return (
                  <div
                    key={shipment.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleApprovalClick(shipment)}
                  >
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="gap-1">
                        عرض <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2">
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

                    <div className="text-xs text-muted-foreground mt-2 text-right">
                      من: {shipment.transporter?.name || 'غير محدد'}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedShipment && (
        <ShipmentApprovalDialog
          isOpen={!!selectedShipment}
          onClose={() => setSelectedShipment(null)}
          shipment={selectedShipment}
          approvalType={approvalType}
          onApprovalComplete={fetchPendingApprovals}
        />
      )}
    </>
  );
}
