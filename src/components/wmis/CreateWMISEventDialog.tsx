import { memo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateWMISEvent, WMIS_EVENT_SOURCES, WMIS_EVENT_TYPES } from '@/hooks/useWMIS';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId?: string;
}

const CreateWMISEventDialog = memo(({ open, onOpenChange, shipmentId }: Props) => {
  const { mutate: createEvent, isPending } = useCreateWMISEvent();
  const [form, setForm] = useState({
    eventSource: 'manual',
    eventType: 'custom',
    eventSeverity: 'info',
    eventTitle: '',
    eventDescription: '',
    locationName: '',
    deviceId: '',
    deviceType: '',
    notifyGenerator: false,
    notifyTransporter: false,
    notifyRecycler: false,
    notifyConsultant: false,
  });

  const handleSubmit = () => {
    if (!form.eventTitle.trim()) return;
    createEvent({
      shipmentId,
      eventSource: form.eventSource,
      eventType: form.eventType,
      eventSeverity: form.eventSeverity,
      eventTitle: form.eventTitle,
      eventDescription: form.eventDescription || undefined,
      locationName: form.locationName || undefined,
      deviceId: form.deviceId || undefined,
      deviceType: form.deviceType || undefined,
      notifyGenerator: form.notifyGenerator,
      notifyTransporter: form.notifyTransporter,
      notifyRecycler: form.notifyRecycler,
      notifyConsultant: form.notifyConsultant,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setForm(f => ({ ...f, eventTitle: '', eventDescription: '', locationName: '' }));
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تسجيل حدث WMIS</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">المصدر</Label>
              <Select value={form.eventSource} onValueChange={v => setForm(f => ({ ...f, eventSource: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WMIS_EVENT_SOURCES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">نوع الحدث</Label>
              <Select value={form.eventType} onValueChange={v => setForm(f => ({ ...f, eventType: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WMIS_EVENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">الخطورة</Label>
            <Select value={form.eventSeverity} onValueChange={v => setForm(f => ({ ...f, eventSeverity: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">ℹ️ معلومة</SelectItem>
                <SelectItem value="warning">⚠️ تحذير</SelectItem>
                <SelectItem value="critical">🔶 حرج</SelectItem>
                <SelectItem value="emergency">🚨 طوارئ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">عنوان الحدث *</Label>
            <Input
              value={form.eventTitle}
              onChange={e => setForm(f => ({ ...f, eventTitle: e.target.value }))}
              placeholder="وصف مختصر للحدث"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">التفاصيل</Label>
            <Textarea
              value={form.eventDescription}
              onChange={e => setForm(f => ({ ...f, eventDescription: e.target.value }))}
              placeholder="تفاصيل إضافية..."
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">الموقع</Label>
            <Input
              value={form.locationName}
              onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))}
              placeholder="اسم الموقع"
            />
          </div>

          {form.eventSource === 'iot_sensor' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">معرف الجهاز</Label>
                <Input value={form.deviceId} onChange={e => setForm(f => ({ ...f, deviceId: e.target.value }))} placeholder="SENSOR-001" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">نوع الجهاز</Label>
                <Input value={form.deviceType} onChange={e => setForm(f => ({ ...f, deviceType: e.target.value }))} placeholder="temperature_sensor" />
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
            <Label className="text-xs font-semibold">إخطار الأطراف</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'notifyGenerator', label: 'المولد' },
                { key: 'notifyTransporter', label: 'الناقل' },
                { key: 'notifyRecycler', label: 'المدوّر' },
                { key: 'notifyConsultant', label: 'الاستشاري' },
              ].map(n => (
                <label key={n.key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <Switch
                    checked={(form as any)[n.key]}
                    onCheckedChange={v => setForm(f => ({ ...f, [n.key]: v }))}
                    className="scale-75"
                  />
                  {n.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.eventTitle.trim()}>
            {isPending ? 'جاري التسجيل...' : 'تسجيل الحدث'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

CreateWMISEventDialog.displayName = 'CreateWMISEventDialog';
export default CreateWMISEventDialog;
