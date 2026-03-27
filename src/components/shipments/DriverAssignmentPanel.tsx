import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserCheck, UserX, Clock, CheckCircle2, Truck, Loader2 } from 'lucide-react';
import MemberNameLink from '@/components/org-structure/MemberNameLink';

interface Driver {
  id: string;
  vehicle_plate: string;
  profiles: { full_name: string; phone: string } | null;
}

interface Assignment {
  id: string;
  status: string;
  assignment_type: string;
  assigned_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  driver: Driver | null;
}

interface Props {
  shipmentId: string;
  shipmentStatus: string;
  currentDriverId: string | null;
  organizationId: string;
  isTransporter: boolean;
  onAssigned?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'بانتظار القبول', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  accepted: { label: 'مقبولة', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rejected: { label: 'مرفوضة', color: 'bg-red-100 text-red-800', icon: UserX },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800', icon: Truck },
  completed: { label: 'مكتملة', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  cancelled: { label: 'ملغاة', color: 'bg-muted text-muted-foreground', icon: UserX },
};

export default function DriverAssignmentPanel({ shipmentId, shipmentStatus, currentDriverId, organizationId, isTransporter, onAssigned }: Props) {
  const { profile } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [shipmentId, organizationId]);

  const fetchData = async () => {
    const driversQuery = supabase.from('drivers' as any).select('id, vehicle_plate, profiles:profile_id(full_name, phone)').eq('organization_id', organizationId).eq('is_active', true);
    const assignmentsQuery = supabase.from('driver_shipment_assignments' as any).select('*').eq('shipment_id', shipmentId).order('assigned_at', { ascending: false });
    const [driversRes, assignmentsRes] = await Promise.all([driversQuery, assignmentsQuery]);
    if (driversRes.data) setDrivers(driversRes.data as any);
    if (assignmentsRes.data) {
      const enriched = await Promise.all((assignmentsRes.data as any[]).map(async (a: any) => {
        const { data: driver } = await supabase.from('drivers' as any).select('id, vehicle_plate, profiles:profile_id(full_name, phone)').eq('id', a.driver_id).single();
        return { ...a, driver };
      }));
      setAssignments(enriched as any);
    }
  };

  const assignDriver = async () => {
    if (!selectedDriver) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('driver_shipment_assignments').insert({
        shipment_id: shipmentId,
        driver_id: selectedDriver,
        organization_id: organizationId,
        assigned_by: profile?.id,
        assignment_type: 'manual',
      });
      if (error) throw error;

      // Update shipment driver_id
      await supabase.from('shipments').update({ driver_id: selectedDriver }).eq('id', shipmentId);
      
      toast.success('تم تعيين السائق بنجاح');
      setSelectedDriver('');
      fetchData();
      onAssigned?.();

      // Fire driver assignment notification
      try {
        const driver = drivers.find(d => d.id === selectedDriver);
        const driverName = (driver as any)?.profiles?.full_name || 'سائق';
        import('@/services/notificationTriggers').then(({ notifyDriverEvent }) => {
          notifyDriverEvent({
            type: 'driver_assignment',
            driverUserId: selectedDriver,
            driverName,
            details: `تم تعيينك لمهمة شحنة جديدة`,
            shipmentId,
            organizationId,
          });
        });
      } catch {}
    } catch (err: any) {
      toast.error(err.message || 'خطأ في تعيين السائق');
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (assignmentId: string, status: 'accepted' | 'rejected') => {
    setLoading(true);
    try {
      const updates: any = { status };
      if (status === 'accepted') updates.accepted_at = new Date().toISOString();
      if (status === 'rejected') {
        updates.rejected_at = new Date().toISOString();
        updates.rejection_reason = rejectionReason || null;
      }
      const { error } = await supabase.from('driver_shipment_assignments').update(updates).eq('id', assignmentId);
      if (error) throw error;
      toast.success(status === 'accepted' ? 'تم قبول المهمة' : 'تم رفض المهمة');
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeAssignment = assignments.find(a => ['pending', 'accepted', 'in_progress'].includes(a.status));

  return (
    <Card>
      <CardHeader className="text-right pb-3">
        <CardTitle className="flex items-center gap-2 justify-end text-base">
          <UserCheck className="w-5 h-5 text-primary" />
          تعيين السائق وقبول المهمة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assign new driver - only for transporter */}
        {isTransporter && !activeAssignment && !['delivered', 'confirmed', 'cancelled'].includes(shipmentStatus) && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر سائقاً..." />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {(d.profiles as any)?.full_name || 'سائق'} - {d.vehicle_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={assignDriver} disabled={!selectedDriver || loading} size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تعيين'}
            </Button>
          </div>
        )}

        {/* Current assignments */}
        {assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.map(a => {
              const config = statusConfig[a.status] || statusConfig.pending;
              const Icon = config.icon;
              return (
                <div key={a.id} className="p-3 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={config.color}>
                      <Icon className="w-3 h-3 ml-1" />
                      {config.label}
                    </Badge>
                    <div className="text-right">
                      <MemberNameLink
                        name={(a.driver as any)?.profiles?.full_name || 'سائق'}
                        profileId={(a.driver as any)?.profile_id}
                        showIcon
                        className="text-sm font-medium"
                      />
                      <p className="text-xs text-muted-foreground">{(a.driver as any)?.vehicle_plate}</p>
                    </div>
                  </div>

                  {a.status === 'rejected' && a.rejection_reason && (
                    <p className="text-xs text-destructive bg-destructive/10 p-2 rounded text-right">
                      سبب الرفض: {a.rejection_reason}
                    </p>
                  )}

                  {/* Accept/Reject buttons for the assigned driver's org */}
                  {a.status === 'pending' && isTransporter && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-green-600" onClick={() => updateAssignment(a.id, 'accepted')}>
                        <CheckCircle2 className="w-4 h-4 ml-1" /> قبول
                      </Button>
                      <div className="flex-1 space-y-1">
                        <Textarea placeholder="سبب الرفض (اختياري)" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="h-8 text-xs" />
                        <Button size="sm" variant="outline" className="w-full text-destructive" onClick={() => updateAssignment(a.id, 'rejected')}>
                          <UserX className="w-4 h-4 ml-1" /> رفض
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">لم يتم تعيين سائق بعد</p>
        )}
      </CardContent>
    </Card>
  );
}
