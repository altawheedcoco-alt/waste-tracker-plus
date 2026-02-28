import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConsultingOffice, type SigningPolicy } from '@/hooks/useConsultingOffice';
import {
  FileText, Shield, CheckCircle2, AlertTriangle, Settings,
  Stamp, Users, Eye, Loader2, Save,
} from 'lucide-react';

const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'disposal_certificate', label: 'شهادة تخلص آمن' },
  { value: 'compliance_report', label: 'تقرير امتثال' },
  { value: 'eia_report', label: 'تقرير تقييم أثر بيئي' },
  { value: 'inspection_report', label: 'تقرير تفتيش ميداني' },
  { value: 'waste_manifest', label: 'مانيفست نفايات' },
  { value: 'training_certificate', label: 'شهادة تدريب' },
  { value: 'emergency_plan', label: 'خطة طوارئ' },
  { value: 'corrective_action', label: 'إجراء تصحيحي' },
  { value: 'audit_report', label: 'تقرير تدقيق' },
  { value: 'environmental_permit', label: 'تصريح بيئي' },
  { value: 'monitoring_report', label: 'تقرير رصد بيئي' },
  { value: 'risk_assessment', label: 'تقييم مخاطر' },
];

const ROLE_LEVELS = [
  { value: 'director', label: 'مدير المكتب' },
  { value: 'senior_consultant', label: 'استشاري أول' },
  { value: 'consultant', label: 'استشاري' },
  { value: 'assistant', label: 'مساعد' },
];

const SigningPoliciesPanel = memo(() => {
  const { signingPolicies, saveSigningPolicy, isDirector, loadingPolicies } = useConsultingOffice();
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SigningPolicy>>({});

  if (loadingPolicies) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const getPolicy = (docType: string) => signingPolicies.find(p => p.document_type === docType);

  const startEdit = (docType: string) => {
    const existing = getPolicy(docType);
    setEditForm({
      document_type: docType,
      requires_director_approval: existing?.requires_director_approval ?? false,
      min_seniority_level: existing?.min_seniority_level ?? 'consultant',
      requires_office_stamp: existing?.requires_office_stamp ?? true,
      co_signature_required: existing?.co_signature_required ?? false,
      show_solidarity_clause: existing?.show_solidarity_clause ?? true,
      director_notes: existing?.director_notes ?? '',
    });
    setEditingType(docType);
  };

  const handleSave = async () => {
    await saveSigningPolicy.mutateAsync(editForm);
    setEditingType(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            سياسات التوقيع والاعتماد
          </CardTitle>
          <CardDescription>
            تحكم في قواعد التوقيع لكل نوع مستند — مَن يوقع؟ هل يحتاج ختم المكتب؟ هل المكتب متضامن؟
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isDirector && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700">فقط مدير المكتب يمكنه تعديل سياسات التوقيع</span>
            </div>
          )}

          <div className="space-y-3">
            {DOCUMENT_TYPES.map(dt => {
              const policy = getPolicy(dt.value);
              const isEditing = editingType === dt.value;

              return (
                <div key={dt.value} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{dt.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {policy ? (
                        <>
                          {policy.requires_director_approval && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">يحتاج موافقة المدير</Badge>
                          )}
                          {policy.requires_office_stamp && (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">
                              <Stamp className="w-3 h-3 ml-1" />ختم المكتب
                            </Badge>
                          )}
                          {policy.show_solidarity_clause && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">
                              <Users className="w-3 h-3 ml-1" />تضامن
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">افتراضي</Badge>
                      )}
                      {isDirector && !isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => startEdit(dt.value)} className="h-7 text-xs">
                          <Settings className="w-3 h-3 ml-1" />تعديل
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">يحتاج موافقة المدير</span>
                          <Switch checked={editForm.requires_director_approval}
                            onCheckedChange={v => setEditForm(p => ({ ...p, requires_director_approval: v }))} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">ختم المكتب مطلوب</span>
                          <Switch checked={editForm.requires_office_stamp}
                            onCheckedChange={v => setEditForm(p => ({ ...p, requires_office_stamp: v }))} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">توقيع مشترك</span>
                          <Switch checked={editForm.co_signature_required}
                            onCheckedChange={v => setEditForm(p => ({ ...p, co_signature_required: v }))} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">نص التضامن</span>
                          <Switch checked={editForm.show_solidarity_clause}
                            onCheckedChange={v => setEditForm(p => ({ ...p, show_solidarity_clause: v }))} />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">الحد الأدنى للمستوى الوظيفي</label>
                        <Select value={editForm.min_seniority_level} onValueChange={v => setEditForm(p => ({ ...p, min_seniority_level: v }))}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLE_LEVELS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">ملاحظة المدير (تظهر مع التوقيع)</label>
                        <Textarea value={editForm.director_notes || ''} onChange={e => setEditForm(p => ({ ...p, director_notes: e.target.value }))}
                          placeholder="مثال: هذا التوقيع للمعاينة فقط ولا يشمل اعتماد التخلص النهائي" className="text-sm" />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setEditingType(null)}>إلغاء</Button>
                        <Button size="sm" onClick={handleSave} disabled={saveSigningPolicy.isPending} className="gap-1.5">
                          <Save className="w-3.5 h-3.5" />حفظ السياسة
                        </Button>
                      </div>
                    </div>
                  )}

                  {policy?.director_notes && !isEditing && (
                    <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3 inline ml-1" />ملاحظة المدير: {policy.director_notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

SigningPoliciesPanel.displayName = 'SigningPoliciesPanel';
export default SigningPoliciesPanel;
