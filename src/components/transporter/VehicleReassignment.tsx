import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, Truck, ArrowRight, CheckCircle } from 'lucide-react';

interface ReassignmentLog {
  id: string;
  original_vehicle_id: string;
  replacement_vehicle_id: string | null;
  shipment_id: string | null;
  reason: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Vehicle {
  id: string;
  plate_number: string | null;
  vehicle_type: string | null;
  status: string | null;
}

const REASON_LABELS: Record<string, { ar: string; en: string }> = {
  breakdown: { ar: 'عطل ميكانيكي', en: 'Breakdown' },
  accident: { ar: 'حادث', en: 'Accident' },
  maintenance: { ar: 'صيانة مجدولة', en: 'Scheduled Maintenance' },
  driver_unavailable: { ar: 'سائق غير متاح', en: 'Driver Unavailable' },
  capacity: { ar: 'تجاوز السعة', en: 'Over Capacity' },
  manual: { ar: 'يدوي', en: 'Manual' },
};

const VehicleReassignment = () => {
  const { organization, profile } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [logs, setLogs] = useState<ReassignmentLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  // Form
  const [formOriginalVehicle, setFormOriginalVehicle] = useState('');
  const [formReplacementVehicle, setFormReplacementVehicle] = useState('');
  const [formReason, setFormReason] = useState('breakdown');
  const [formNotes, setFormNotes] = useState('');

  const fetchData = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);

    const [logsRes, vehiclesRes] = await Promise.all([
      supabase
        .from('vehicle_reassignment_log')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('fleet_vehicles')
        .select('id, plate_number, vehicle_type, status')
        .eq('organization_id', organization.id)
        .limit(50),
    ]);

    if (logsRes.data) setLogs(logsRes.data as any);
    if (vehiclesRes.data) setVehicles(vehiclesRes.data as any);
    setLoading(false);
  }, [organization?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getVehicleName = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v?.plate_number || id.slice(0, 8);
  };

  const availableVehicles = vehicles.filter(v => v.status === 'active' || v.status === 'available');

  const handleReassign = async () => {
    if (!organization?.id || !formOriginalVehicle) return;

    const { error } = await supabase.from('vehicle_reassignment_log').insert({
      organization_id: organization.id,
      original_vehicle_id: formOriginalVehicle,
      replacement_vehicle_id: formReplacementVehicle || null,
      reason: formReason,
      status: formReplacementVehicle ? 'reassigned' : 'pending',
      reassigned_by: profile?.id || null,
      reassigned_at: formReplacementVehicle ? new Date().toISOString() : null,
      notes: formNotes || null,
    } as any);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(isAr ? 'تم تسجيل إعادة التعيين' : 'Reassignment logged');
    setShowDialog(false);
    setFormOriginalVehicle('');
    setFormReplacementVehicle('');
    setFormReason('breakdown');
    setFormNotes('');
    fetchData();
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-700',
    reassigned: 'bg-emerald-500/10 text-emerald-700',
    cancelled: 'bg-muted text-muted-foreground',
    resolved: 'bg-blue-500/10 text-blue-700',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RefreshCw className="w-5 h-5 text-primary" />
          {isAr ? 'إعادة تعيين المركبات' : 'Vehicle Reassignment'}
        </CardTitle>
        <Button size="sm" variant="destructive" onClick={() => setShowDialog(true)}>
          <AlertTriangle className="w-4 h-4 me-1" />
          {isAr ? 'تسجيل عطل' : 'Report Issue'}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{isAr ? 'لا توجد حالات إعادة تعيين' : 'No reassignment cases'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <Truck className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono font-bold">{getVehicleName(log.original_vehicle_id)}</span>
                    {log.replacement_vehicle_id && (
                      <>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono font-bold text-emerald-600">
                          {getVehicleName(log.replacement_vehicle_id)}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {REASON_LABELS[log.reason]?.[isAr ? 'ar' : 'en'] || log.reason}
                    {log.notes && ` · ${log.notes}`}
                  </p>
                </div>
                <div className="text-left">
                  <Badge variant="outline" className={STATUS_COLORS[log.status] || ''}>
                    {log.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(log.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Reassignment Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {isAr ? 'تسجيل عطل وإعادة تعيين' : 'Report Issue & Reassign'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isAr ? 'المركبة المعطلة' : 'Affected Vehicle'}</Label>
              <Select value={formOriginalVehicle} onValueChange={setFormOriginalVehicle}>
                <SelectTrigger><SelectValue placeholder={isAr ? 'اختر المركبة' : 'Select vehicle'} /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate_number || v.id.slice(0, 8)} ({v.vehicle_type || '-'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? 'السبب' : 'Reason'}</Label>
              <Select value={formReason} onValueChange={setFormReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? 'المركبة البديلة (اختياري)' : 'Replacement Vehicle (optional)'}</Label>
              <Select value={formReplacementVehicle} onValueChange={setFormReplacementVehicle}>
                <SelectTrigger><SelectValue placeholder={isAr ? 'اختر البديلة' : 'Select replacement'} /></SelectTrigger>
                <SelectContent>
                  {availableVehicles
                    .filter(v => v.id !== formOriginalVehicle)
                    .map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plate_number || v.id.slice(0, 8)} ({v.vehicle_type || '-'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button variant="destructive" onClick={handleReassign} disabled={!formOriginalVehicle}>
              {isAr ? 'تسجيل' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default VehicleReassignment;
