import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Trash2, GripVertical, Eye, EyeOff, Lock, List, Edit3,
  Settings2, Truck, Save, X
} from 'lucide-react';
import { AVAILABLE_FIELDS, QuickLinkField } from '@/hooks/useQuickShipmentLinks';

interface FormBuilderProps {
  onSave: (linkData: { link_name: string; description: string; requires_approval: boolean; auto_capture_gps: boolean; expires_at: string | null; max_uses: number | null; assigned_driver_id: string | null }, fields: QuickLinkField[]) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const modeLabels: Record<string, { label: string; icon: any; color: string }> = {
  fixed: { label: 'ثابت (مخفي)', icon: Lock, color: 'bg-red-100 text-red-700' },
  restricted_list: { label: 'قائمة مقيدة', icon: List, color: 'bg-amber-100 text-amber-700' },
  free_input: { label: 'إدخال حر', icon: Edit3, color: 'bg-emerald-100 text-emerald-700' },
};

export default function QuickLinkFormBuilder({ onSave, onCancel, saving }: FormBuilderProps) {
  const [linkName, setLinkName] = useState('');
  const [description, setDescription] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [autoCaptureGps, setAutoCaptureGps] = useState(true);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [hasMaxUses, setHasMaxUses] = useState(false);
  const [maxUses, setMaxUses] = useState<number>(100);

  const [selectedFields, setSelectedFields] = useState<QuickLinkField[]>([
    // Always include driver name & phone
    { field_name: 'driver_name', field_label: 'اسم السائق', field_type: 'text', field_mode: 'free_input', fixed_value: null, allowed_values: null, default_value: null, min_value: null, max_value: null, is_required: true, is_visible: true, sort_order: 0 },
    { field_name: 'driver_phone', field_label: 'رقم هاتف السائق', field_type: 'text', field_mode: 'free_input', fixed_value: null, allowed_values: null, default_value: null, min_value: null, max_value: null, is_required: true, is_visible: true, sort_order: 1 },
  ]);

  const [newAllowedValue, setNewAllowedValue] = useState('');

  const availableToAdd = AVAILABLE_FIELDS.filter(
    f => !selectedFields.some(sf => sf.field_name === f.name)
  );

  const addField = (fieldDef: typeof AVAILABLE_FIELDS[0]) => {
    setSelectedFields(prev => [
      ...prev,
      {
        field_name: fieldDef.name,
        field_label: fieldDef.label,
        field_type: fieldDef.type,
        field_mode: 'free_input',
        fixed_value: null,
        allowed_values: null,
        default_value: null,
        min_value: null,
        max_value: null,
        is_required: false,
        is_visible: true,
        sort_order: prev.length,
      },
    ]);
  };

  const removeField = (fieldName: string) => {
    if (fieldName === 'driver_name' || fieldName === 'driver_phone') return;
    setSelectedFields(prev => prev.filter(f => f.field_name !== fieldName));
  };

  const updateField = (fieldName: string, updates: Partial<QuickLinkField>) => {
    setSelectedFields(prev =>
      prev.map(f => (f.field_name === fieldName ? { ...f, ...updates } : f))
    );
  };

  const addAllowedValue = (fieldName: string, value: string) => {
    if (!value.trim()) return;
    setSelectedFields(prev =>
      prev.map(f => {
        if (f.field_name !== fieldName) return f;
        const current = f.allowed_values || [];
        if (current.includes(value.trim())) return f;
        return { ...f, allowed_values: [...current, value.trim()] };
      })
    );
    setNewAllowedValue('');
  };

  const removeAllowedValue = (fieldName: string, value: string) => {
    setSelectedFields(prev =>
      prev.map(f => {
        if (f.field_name !== fieldName) return f;
        return { ...f, allowed_values: (f.allowed_values || []).filter(v => v !== value) };
      })
    );
  };

  const handleSave = async () => {
    if (!linkName.trim()) {
      return;
    }
    await onSave(
      {
        link_name: linkName,
        description,
        requires_approval: requiresApproval,
        auto_capture_gps: autoCaptureGps,
        expires_at: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
        max_uses: hasMaxUses ? maxUses : null,
        assigned_driver_id: null,
      },
      selectedFields
    );
  };

  return (
    <div className="space-y-6">
      {/* Link Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            إعدادات الرابط
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم الرابط *</Label>
              <Input
                value={linkName}
                onChange={e => setLinkName(e.target.value)}
                placeholder="مثال: رابط خط القاهرة-الإسكندرية"
              />
            </div>
            <div className="space-y-2">
              <Label>وصف (اختياري)</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="وصف مختصر للرابط"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
              <Label className="text-sm">يحتاج موافقة المشرف</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={autoCaptureGps} onCheckedChange={setAutoCaptureGps} />
              <Label className="text-sm">التقاط GPS تلقائي</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
              <Label className="text-sm">تاريخ انتهاء</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={hasMaxUses} onCheckedChange={setHasMaxUses} />
              <Label className="text-sm">حد أقصى للاستخدام</Label>
            </div>
          </div>

          {(hasExpiry || hasMaxUses) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hasExpiry && (
                <div className="space-y-2">
                  <Label>ينتهي في</Label>
                  <Input type="datetime-local" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                </div>
              )}
              {hasMaxUses && (
                <div className="space-y-2">
                  <Label>عدد الاستخدامات الأقصى</Label>
                  <Input type="number" value={maxUses} onChange={e => setMaxUses(Number(e.target.value))} min={1} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            تصميم النموذج — الحقول المخصصة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected fields */}
          <div className="space-y-3">
            {selectedFields.map((field, idx) => {
              const isDriverField = field.field_name === 'driver_name' || field.field_name === 'driver_phone';
              const ModeIcon = modeLabels[field.field_mode]?.icon || Edit3;
              
              return (
                <div key={field.field_name} className="border rounded-lg p-4 space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{field.field_label}</span>
                      {isDriverField && <Badge variant="secondary" className="text-[10px]">إلزامي</Badge>}
                      {field.is_required && !isDriverField && <Badge variant="outline" className="text-[10px] text-red-600">مطلوب</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] gap-1 ${modeLabels[field.field_mode]?.color}`}>
                        <ModeIcon className="h-3 w-3" />
                        {modeLabels[field.field_mode]?.label}
                      </Badge>
                      {!isDriverField && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeField(field.field_name)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {!isDriverField && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">النمط</Label>
                          <Select value={field.field_mode} onValueChange={v => updateField(field.field_name, { 
                            field_mode: v as QuickLinkField['field_mode'],
                            is_visible: v !== 'fixed',
                          })}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free_input">إدخال حر</SelectItem>
                              <SelectItem value="restricted_list">قائمة مقيدة</SelectItem>
                              <SelectItem value="fixed">ثابت (مخفي)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2 pt-5">
                          <Switch
                            checked={field.is_required}
                            onCheckedChange={v => updateField(field.field_name, { is_required: v })}
                            className="scale-75"
                          />
                          <Label className="text-xs">مطلوب</Label>
                        </div>

                        {field.field_mode === 'fixed' && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">القيمة الثابتة</Label>
                            <Input
                              className="h-8 text-xs"
                              value={field.fixed_value || ''}
                              onChange={e => updateField(field.field_name, { fixed_value: e.target.value })}
                              placeholder="أدخل القيمة"
                            />
                          </div>
                        )}
                      </div>

                      {/* Number constraints */}
                      {field.field_type === 'number' && field.field_mode === 'free_input' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">الحد الأدنى</Label>
                            <Input
                              className="h-8 text-xs"
                              type="number"
                              value={field.min_value ?? ''}
                              onChange={e => updateField(field.field_name, { min_value: e.target.value ? Number(e.target.value) : null })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">الحد الأقصى</Label>
                            <Input
                              className="h-8 text-xs"
                              type="number"
                              value={field.max_value ?? ''}
                              onChange={e => updateField(field.field_name, { max_value: e.target.value ? Number(e.target.value) : null })}
                            />
                          </div>
                        </div>
                      )}

                      {/* Restricted list values */}
                      {field.field_mode === 'restricted_list' && (
                        <div className="space-y-2">
                          <Label className="text-xs">القيم المسموحة</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {(field.allowed_values || []).map(v => (
                              <Badge key={v} variant="secondary" className="gap-1 text-xs">
                                {v}
                                <button onClick={() => removeAllowedValue(field.field_name, v)}>
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              className="h-8 text-xs flex-1"
                              value={newAllowedValue}
                              onChange={e => setNewAllowedValue(e.target.value)}
                              placeholder="أضف قيمة (مثال: خشب كسر)"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addAllowedValue(field.field_name, newAllowedValue);
                                }
                              }}
                            />
                            <Button size="sm" variant="outline" className="h-8" onClick={() => addAllowedValue(field.field_name, newAllowedValue)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">القيمة الافتراضية</Label>
                            <Select value={field.default_value || ''} onValueChange={v => updateField(field.field_name, { default_value: v })}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="بدون قيمة افتراضية" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">بدون</SelectItem>
                                {(field.allowed_values || []).map(v => (
                                  <SelectItem key={v} value={v}>{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add field button */}
          {availableToAdd.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">أضف حقل جديد</Label>
              <div className="flex flex-wrap gap-2">
                {availableToAdd.map(f => (
                  <Button key={f.name} variant="outline" size="sm" className="text-xs gap-1" onClick={() => addField(f)}>
                    <Plus className="h-3 w-3" />
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          إلغاء
        </Button>
        <Button onClick={handleSave} disabled={saving || !linkName.trim()} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'جاري الحفظ...' : 'إنشاء الرابط'}
        </Button>
      </div>
    </div>
  );
}
