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
  ClipboardCheck, Calendar, Building2, User, Loader2, Eye, ChevronLeft,
  Trash2, Edit3, PlusCircle, MessageSquare
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
  getChecklistForFacilityType,
} from '@/hooks/useOHSInspections';

const OHSReportPanel = () => {
  const {
    inspections, isLoading, createInspection, updateInspection,
    fetchChecklist, updateChecklistItem, addChecklistItem, deleteChecklistItem,
  } = useOHSInspections();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<OHSInspection | null>(null);
  const [checklist, setChecklist] = useState<OHSChecklistItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  // Add item form
  const [showAddItem, setShowAddItem] = useState(false);
  const [addItemCategory, setAddItemCategory] = useState('');
  const [newItem, setNewItem] = useState({ name: '', name_ar: '', severity: 'medium' });

  // Edit notes
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

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

  const handleSaveNotes = async (item: OHSChecklistItem) => {
    await updateChecklistItem.mutateAsync({ id: item.id, notes: editNotes } as any);
    setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, notes: editNotes } : i));
    setEditingItemId(null);
    setEditNotes('');
  };

  const handleAddItem = async () => {
    if (!selectedInspection || !newItem.name_ar) return;
    await addChecklistItem.mutateAsync({
      inspection_id: selectedInspection.id,
      category: addItemCategory,
      item_name: newItem.name || newItem.name_ar,
      item_name_ar: newItem.name_ar,
      severity: newItem.severity,
    });
    // Refresh checklist
    const items = await fetchChecklist(selectedInspection.id);
    setChecklist(items);
    setNewItem({ name: '', name_ar: '', severity: 'medium' });
    setShowAddItem(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteChecklistItem.mutateAsync(itemId);
    setChecklist(prev => prev.filter(i => i.id !== itemId));
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
    // Get categories from the checklist items themselves (dynamic, not hardcoded)
    const categorySet = new Map<string, string>();
    const templateCats = getChecklistForFacilityType(selectedInspection.facility_type);
    templateCats.forEach(c => categorySet.set(c.category, c.categoryLabel));
    // Also add any custom categories from actual items
    checklist.forEach(item => {
      if (!categorySet.has(item.category)) {
        categorySet.set(item.category, item.category);
      }
    });

    const grouped = Array.from(categorySet.entries()).map(([cat, label]) => ({
      category: cat,
      categoryLabel: label,
      items: checklist.filter(i => i.category === cat),
    })).filter(g => g.items.length > 0);

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
                <CardDescription>
                  {selectedInspection.facility_name} - {FACILITY_TYPE_LABELS[selectedInspection.facility_type]} - {new Date(selectedInspection.inspection_date).toLocaleDateString('ar-EG')}
                </CardDescription>
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
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>ممتثل: {checklist.filter(i => i.status === 'compliant').length}</span>
                <span>غير ممتثل: {checklist.filter(i => i.status === 'non_compliant').length}</span>
                <span>جزئي: {checklist.filter(i => i.status === 'partial').length}</span>
                <span>لم يُفحص: {checklist.filter(i => i.status === 'not_checked').length}</span>
              </div>
            </div>

            <Tabs defaultValue={grouped[0]?.category} dir="rtl">
              <TabsList className="flex-wrap h-auto gap-1 justify-start">
                {grouped.map(cat => (
                  <TabsTrigger key={cat.category} value={cat.category} className="text-xs">
                    {cat.categoryLabel}
                    <Badge variant="secondary" className="mr-1 text-[10px] px-1">{cat.items.length}</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {grouped.map(cat => (
                <TabsContent key={cat.category} value={cat.category}>
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2">
                      {loadingChecklist ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                      ) : (
                        <>
                          {cat.items.map(item => (
                            <div key={item.id} className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{item.item_name_ar}</p>
                                  <p className="text-xs text-muted-foreground">{item.item_name}</p>
                                  {item.notes && (
                                    <p className="text-xs text-primary mt-1 bg-primary/5 rounded px-2 py-1">📝 {item.notes}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Select
                                    value={item.status}
                                    onValueChange={(v) => handleItemStatusChange(item, v)}
                                  >
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
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
                                  {/* Consultant: Edit notes */}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setEditingItemId(item.id);
                                      setEditNotes(item.notes || '');
                                    }}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </Button>
                                  {/* Consultant: Delete */}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {/* Inline notes editor */}
                              {editingItemId === item.id && (
                                <div className="mt-2 flex gap-2">
                                  <Input
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    placeholder="ملاحظات الاستشاري..."
                                    className="text-sm h-8"
                                  />
                                  <Button size="sm" className="h-8" onClick={() => handleSaveNotes(item)}>حفظ</Button>
                                  <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingItemId(null)}>إلغاء</Button>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Consultant: Add new item to this category */}
                          {showAddItem && addItemCategory === cat.category ? (
                            <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">العنصر بالعربية *</Label>
                                  <Input
                                    value={newItem.name_ar}
                                    onChange={e => setNewItem(n => ({ ...n, name_ar: e.target.value }))}
                                    placeholder="فحص جديد..."
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">العنصر بالإنجليزية</Label>
                                  <Input
                                    value={newItem.name}
                                    onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                                    placeholder="New check item..."
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 items-end">
                                <div>
                                  <Label className="text-xs">الخطورة</Label>
                                  <Select value={newItem.severity} onValueChange={v => setNewItem(n => ({ ...n, severity: v }))}>
                                    <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">منخفضة</SelectItem>
                                      <SelectItem value="medium">متوسطة</SelectItem>
                                      <SelectItem value="high">عالية</SelectItem>
                                      <SelectItem value="critical">حرجة</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button size="sm" className="h-8" onClick={handleAddItem} disabled={!newItem.name_ar || addChecklistItem.isPending}>
                                  {addChecklistItem.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'إضافة'}
                                </Button>
                                <Button size="sm" variant="outline" className="h-8" onClick={() => setShowAddItem(false)}>إلغاء</Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2 border-dashed"
                              onClick={() => { setShowAddItem(true); setAddItemCategory(cat.category); }}
                            >
                              <PlusCircle className="h-4 w-4" />
                              إضافة عنصر فحص جديد (الاستشاري)
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>

            {/* Recommendations - consultant can edit */}
            <div className="mt-4 space-y-2">
              <Label className="font-semibold">توصيات الاستشاري</Label>
              <Textarea
                value={selectedInspection.recommendations || ''}
                onChange={e => setSelectedInspection(prev => prev ? { ...prev, recommendations: e.target.value } : null)}
                placeholder="أضف توصياتك وملاحظاتك هنا..."
                rows={3}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedInspection) {
                    updateInspection.mutateAsync({ id: selectedInspection.id, recommendations: selectedInspection.recommendations } as any);
                  }
                }}
              >
                حفظ التوصيات
              </Button>
            </div>

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
                  <Input fieldContext="facility_name" value={form.facility_name} onChange={e => setForm(f => ({ ...f, facility_name: e.target.value }))} placeholder="مصنع التدوير" />
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

              {/* Preview what checklist will be generated */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs font-semibold mb-1">📋 قائمة التدقيق التي ستُولّد تلقائياً:</p>
                <div className="flex flex-wrap gap-1">
                  {getChecklistForFacilityType(form.facility_type).map(cat => (
                    <Badge key={cat.category} variant="secondary" className="text-[10px]">
                      {cat.categoryLabel} ({cat.items.length})
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  إجمالي: {getChecklistForFacilityType(form.facility_type).reduce((s, c) => s + c.items.length, 0)} عنصر فحص • يمكن للاستشاري إضافة/تعديل/حذف أي عنصر
                </p>
              </div>

              <div>
                <Label>عنوان المنشأة</Label>
                <Input fieldContext="facility_address" value={form.facility_address} onChange={e => setForm(f => ({ ...f, facility_address: e.target.value }))} />
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
                  <Input fieldContext="inspector_name" value={form.inspector_name} onChange={e => setForm(f => ({ ...f, inspector_name: e.target.value }))} />
                </div>
                <div>
                  <Label>المسمى الوظيفي</Label>
                  <Input fieldContext="job_title" value={form.inspector_title} onChange={e => setForm(f => ({ ...f, inspector_title: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>حالة الطقس</Label>
                <Input fieldContext="weather_conditions" value={form.weather_conditions} onChange={e => setForm(f => ({ ...f, weather_conditions: e.target.value }))} placeholder="مشمس، 35°م" />
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
          <XCircle className="h-8 w-8 mx-auto text-destructive mb-1" />
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
