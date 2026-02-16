import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShieldCheck, Plus, FileText, AlertTriangle, CheckCircle2, XCircle,
  ClipboardCheck, Calendar, Building2, User, Loader2, Eye, ChevronLeft
} from 'lucide-react';
import {
  useOHSInspections,
  OHSInspection,
  OHSChecklistItem,
  INSPECTION_TYPE_LABELS,
  FACILITY_TYPE_LABELS,
  RISK_LEVEL_CONFIG,
  STATUS_LABELS,
  CHECKLIST_STATUS_CONFIG,
  DEFAULT_CHECKLIST,
} from '@/hooks/useOHSInspections';

const OHSReportPanel = () => {
  const { inspections, isLoading, createInspection, updateInspection, fetchChecklist, updateChecklistItem } = useOHSInspections();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<OHSInspection | null>(null);
  const [checklist, setChecklist] = useState<OHSChecklistItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    facility_name: '',
    facility_address: '',
    facility_type: 'recycling',
    inspection_type: 'routine',
    inspector_name: '',
    inspector_title: '',
    employees_present: '',
    weather_conditions: '',
    summary: '',
  });

  const handleCreate = async () => {
    await createInspection.mutateAsync({
      ...form,
      employees_present: form.employees_present ? parseInt(form.employees_present) : undefined,
      checklist: true,
    });
    setShowCreate(false);
    setForm({ facility_name: '', facility_address: '', facility_type: 'recycling', inspection_type: 'routine', inspector_name: '', inspector_title: '', employees_present: '', weather_conditions: '', summary: '' });
  };

  const openInspection = async (inspection: OHSInspection) => {
    setSelectedInspection(inspection);
    setLoadingChecklist(true);
    try {
      const items = await fetchChecklist(inspection.id);
      setChecklist(items);
    } catch { setChecklist([]); }
    setLoadingChecklist(false);
  };

  const handleItemStatusChange = async (item: OHSChecklistItem, newStatus: string) => {
    await updateChecklistItem.mutateAsync({ id: item.id, status: newStatus } as any);
    setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
  };

  const calculateScore = () => {
    if (!checklist.length) return 0;
    const applicable = checklist.filter(i => i.status !== 'not_applicable' && i.status !== 'not_checked');
    if (!applicable.length) return 0;
    const passed = applicable.filter(i => i.status === 'compliant').length;
    return Math.round((passed / applicable.length) * 100);
  };

  const handleFinalize = async () => {
    if (!selectedInspection) return;
    const score = calculateScore();
    const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical';
    await updateInspection.mutateAsync({
      id: selectedInspection.id,
      overall_score: score,
      overall_risk_level: riskLevel,
      status: 'in_review',
    } as any);
    setSelectedInspection(prev => prev ? { ...prev, overall_score: score, overall_risk_level: riskLevel, status: 'in_review' } : null);
  };

  // Detail view
  if (selectedInspection) {
    const grouped = DEFAULT_CHECKLIST.map(cat => ({
      ...cat,
      items: checklist.filter(i => i.category === cat.category),
    }));
    const score = calculateScore();

    return (
      <div className="space-y-4" dir="rtl">
        <Button variant="ghost" onClick={() => setSelectedInspection(null)} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          العودة للقائمة
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  تقرير فحص #{selectedInspection.report_number}
                </CardTitle>
                <CardDescription>{selectedInspection.facility_name} - {new Date(selectedInspection.inspection_date).toLocaleDateString('ar-EG')}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{STATUS_LABELS[selectedInspection.status] || selectedInspection.status}</Badge>
                {selectedInspection.overall_risk_level && (
                  <Badge className={`${RISK_LEVEL_CONFIG[selectedInspection.overall_risk_level]?.bg} ${RISK_LEVEL_CONFIG[selectedInspection.overall_risk_level]?.color} border-0`}>
                    {RISK_LEVEL_CONFIG[selectedInspection.overall_risk_level]?.label}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Score Bar */}
            <div className="mb-6 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">نسبة الامتثال</span>
                <span className="text-2xl font-bold">{score}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            <Tabs defaultValue={grouped[0]?.category} dir="rtl">
              <TabsList className="flex-wrap h-auto gap-1 justify-start">
                {grouped.map(cat => (
                  <TabsTrigger key={cat.category} value={cat.category} className="text-xs">
                    {cat.categoryLabel}
                  </TabsTrigger>
                ))}
              </TabsList>

              {grouped.map(cat => (
                <TabsContent key={cat.category} value={cat.category}>
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-3">
                      {loadingChecklist ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                      ) : cat.items.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">لا توجد عناصر</p>
                      ) : (
                        cat.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.item_name_ar}</p>
                              <p className="text-xs text-muted-foreground">{item.item_name}</p>
                            </div>
                            <Select
                              value={item.status}
                              onValueChange={(v) => handleItemStatusChange(item, v)}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(CHECKLIST_STATUS_CONFIG).map(([key, cfg]) => (
                                  <SelectItem key={key} value={key}>
                                    <span className={cfg.color}>{cfg.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>

            {selectedInspection.status === 'draft' && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleFinalize} className="gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  إنهاء الفحص وحساب النتيجة
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            تقارير السلامة والصحة المهنية
          </h2>
          <p className="text-muted-foreground text-sm">إدارة فحوصات OHS وقوائم التدقيق والإجراءات التصحيحية</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> فحص جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء تقرير فحص جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>اسم المنشأة *</Label>
                  <Input value={form.facility_name} onChange={e => setForm(f => ({ ...f, facility_name: e.target.value }))} placeholder="مصنع التدوير" />
                </div>
                <div>
                  <Label>نوع المنشأة</Label>
                  <Select value={form.facility_type} onValueChange={v => setForm(f => ({ ...f, facility_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FACILITY_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>عنوان المنشأة</Label>
                <Input value={form.facility_address} onChange={e => setForm(f => ({ ...f, facility_address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نوع الفحص</Label>
                  <Select value={form.inspection_type} onValueChange={v => setForm(f => ({ ...f, inspection_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(INSPECTION_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>عدد العاملين الحاضرين</Label>
                  <Input type="number" value={form.employees_present} onChange={e => setForm(f => ({ ...f, employees_present: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>اسم المفتش *</Label>
                  <Input value={form.inspector_name} onChange={e => setForm(f => ({ ...f, inspector_name: e.target.value }))} />
                </div>
                <div>
                  <Label>المسمى الوظيفي</Label>
                  <Input value={form.inspector_title} onChange={e => setForm(f => ({ ...f, inspector_title: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>حالة الطقس</Label>
                <Input value={form.weather_conditions} onChange={e => setForm(f => ({ ...f, weather_conditions: e.target.value }))} placeholder="مشمس، 35°م" />
              </div>
              <div>
                <Label>ملخص مبدئي</Label>
                <Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
              <Button onClick={handleCreate} disabled={!form.facility_name || !form.inspector_name || createInspection.isPending}>
                {createInspection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء مع قائمة التدقيق'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <FileText className="h-8 w-8 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{inspections.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي التقارير</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold">{inspections.filter(i => i.status === 'approved').length}</p>
          <p className="text-xs text-muted-foreground">معتمدة</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-1" />
          <p className="text-2xl font-bold">{inspections.filter(i => i.overall_risk_level === 'high' || i.overall_risk_level === 'critical').length}</p>
          <p className="text-xs text-muted-foreground">مخاطر عالية</p>
        </Card>
        <Card className="p-4 text-center">
          <XCircle className="h-8 w-8 mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold">{inspections.filter(i => i.status === 'draft').length}</p>
          <p className="text-xs text-muted-foreground">مسودات</p>
        </Card>
      </div>

      {/* Inspections List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : inspections.length === 0 ? (
        <Card className="p-8 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">لا توجد تقارير فحص بعد</p>
          <p className="text-muted-foreground text-sm">ابدأ بإنشاء أول تقرير فحص للسلامة والصحة المهنية</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {inspections.map(inspection => (
            <Card key={inspection.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => openInspection(inspection)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${RISK_LEVEL_CONFIG[inspection.overall_risk_level]?.bg || 'bg-muted'}`}>
                      <ShieldCheck className={`h-5 w-5 ${RISK_LEVEL_CONFIG[inspection.overall_risk_level]?.color || 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{inspection.facility_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(inspection.inspection_date).toLocaleDateString('ar-EG')}</span>
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{inspection.inspector_name}</span>
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{FACILITY_TYPE_LABELS[inspection.facility_type]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{inspection.report_number}</Badge>
                    <Badge variant="outline">{INSPECTION_TYPE_LABELS[inspection.inspection_type]}</Badge>
                    <Badge className={`${RISK_LEVEL_CONFIG[inspection.overall_risk_level]?.bg} ${RISK_LEVEL_CONFIG[inspection.overall_risk_level]?.color} border-0`}>
                      {inspection.overall_score > 0 ? `${inspection.overall_score}%` : RISK_LEVEL_CONFIG[inspection.overall_risk_level]?.label}
                    </Badge>
                    <Badge variant="secondary">{STATUS_LABELS[inspection.status]}</Badge>
                    <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OHSReportPanel;
