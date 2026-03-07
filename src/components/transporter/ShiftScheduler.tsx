import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar, Clock, Plus, Users, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DriverShift {
  id: string;
  driver_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  status: string;
  assigned_zone: string | null;
  max_shipments: number;
  actual_shipments: number;
  notes: string | null;
  driver?: { id: string; profile?: { full_name: string } };
}

interface Driver {
  id: string;
  profile?: { full_name: string };
}

const SHIFT_TYPES = [
  { value: 'morning', labelAr: 'صباحي', labelEn: 'Morning', color: 'bg-amber-500/10 text-amber-700' },
  { value: 'evening', labelAr: 'مسائي', labelEn: 'Evening', color: 'bg-blue-500/10 text-blue-700' },
  { value: 'night', labelAr: 'ليلي', labelEn: 'Night', color: 'bg-purple-500/10 text-purple-700' },
  { value: 'custom', labelAr: 'مخصص', labelEn: 'Custom', color: 'bg-muted text-muted-foreground' },
];

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-700',
  active: 'bg-emerald-500/10 text-emerald-700',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  no_show: 'bg-red-500/10 text-red-700',
};

const ShiftScheduler = () => {
  const { organization } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [shifts, setShifts] = useState<DriverShift[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 6 }));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [formDriverId, setFormDriverId] = useState('');
  const [formShiftType, setFormShiftType] = useState('morning');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formZone, setFormZone] = useState('');
  const [formMaxShipments, setFormMaxShipments] = useState('10');
  const [formNotes, setFormNotes] = useState('');

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchData = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);

    const weekEnd = addDays(weekStart, 6);
    const [shiftsRes, driversRes] = await Promise.all([
      (supabase.from('driver_shifts') as any)
        .select('*')
        .eq('organization_id', organization.id)
        .gte('shift_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('shift_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('shift_date')
        .order('start_time'),
      (supabase.from('drivers') as any)
        .select('id, profile:profiles(full_name)')
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .limit(50),
    ]);

    if (shiftsRes.data) setShifts(shiftsRes.data as any);
    if (driversRes.data) setDrivers(driversRes.data as any);
    setLoading(false);
  }, [organization?.id, weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddShift = async () => {
    if (!organization?.id || !formDriverId || !selectedDate) return;

    const insertData = {
      organization_id: organization.id,
      driver_id: formDriverId,
      shift_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: formStartTime,
      end_time: formEndTime,
      shift_type: formShiftType,
      assigned_zone: formZone || null,
      max_shipments: parseInt(formMaxShipments) || 10,
      notes: formNotes || null,
    };
    const { error } = await (supabase.from('driver_shifts') as any).insert(insertData);

    if (error) {
      toast.error(isAr ? 'خطأ في إضافة الوردية' : 'Error adding shift');
      return;
    }

    toast.success(isAr ? 'تم إضافة الوردية بنجاح' : 'Shift added successfully');
    setShowAddDialog(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setFormDriverId('');
    setFormShiftType('morning');
    setFormStartTime('08:00');
    setFormEndTime('17:00');
    setFormZone('');
    setFormMaxShipments('10');
    setFormNotes('');
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return (driver?.profile as any)?.full_name || driverId.slice(0, 8);
  };

  const getShiftsForDay = (date: Date) =>
    shifts.filter(s => isSameDay(new Date(s.shift_date), date));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-primary" />
          {isAr ? 'جدولة الورديات' : 'Shift Scheduler'}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(prev => addDays(prev, -7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(weekStart, 'dd MMM', { locale: isAr ? ar : undefined })} - {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: isAr ? ar : undefined })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(prev => addDays(prev, 7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayShifts = getShiftsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[160px] rounded-lg border p-2 transition-colors ${
                    isToday ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {format(day, 'EEE dd', { locale: isAr ? ar : undefined })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => { setSelectedDate(day); setShowAddDialog(true); }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {dayShifts.map((shift) => {
                      const typeConfig = SHIFT_TYPES.find(t => t.value === shift.shift_type);
                      return (
                        <div
                          key={shift.id}
                          className={`rounded-md p-1.5 text-[10px] leading-tight ${typeConfig?.color || 'bg-muted'}`}
                        >
                          <div className="font-semibold truncate">{getDriverName(shift.driver_id)}</div>
                          <div className="flex items-center gap-1 opacity-75">
                            <Clock className="w-2.5 h-2.5" />
                            {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            {shift.assigned_zone && (
                              <span className="truncate">{shift.assigned_zone}</span>
                            )}
                            <Badge variant="outline" className="text-[8px] px-1 py-0">
                              {shift.actual_shipments}/{shift.max_shipments}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    {dayShifts.length === 0 && (
                      <p className="text-[10px] text-muted-foreground text-center py-4">
                        {isAr ? 'لا ورديات' : 'No shifts'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Add Shift Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {isAr ? 'إضافة وردية' : 'Add Shift'}
              {selectedDate && (
                <Badge variant="outline">
                  {format(selectedDate, 'dd/MM/yyyy')}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isAr ? 'السائق' : 'Driver'}</Label>
              <Select value={formDriverId} onValueChange={setFormDriverId}>
                <SelectTrigger><SelectValue placeholder={isAr ? 'اختر السائق' : 'Select driver'} /></SelectTrigger>
                <SelectContent>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {(d.profile as any)?.full_name || d.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? 'نوع الوردية' : 'Shift Type'}</Label>
              <Select value={formShiftType} onValueChange={setFormShiftType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {isAr ? t.labelAr : t.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? 'من' : 'From'}</Label>
                <Input type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} />
              </div>
              <div>
                <Label>{isAr ? 'إلى' : 'To'}</Label>
                <Input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? 'المنطقة' : 'Zone'}</Label>
                <Input value={formZone} onChange={e => setFormZone(e.target.value)} placeholder={isAr ? 'مثال: الجيزة' : 'e.g. Giza'} />
              </div>
              <div>
                <Label>{isAr ? 'أقصى شحنات' : 'Max Shipments'}</Label>
                <Input type="number" value={formMaxShipments} onChange={e => setFormMaxShipments(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAddShift} disabled={!formDriverId}>
              {isAr ? 'إضافة' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ShiftScheduler;
