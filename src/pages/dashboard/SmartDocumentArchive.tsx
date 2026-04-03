import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Brain, FileText, Search, Upload, FolderOpen, AlertTriangle, CheckCircle2, Clock,
  Tag, Scale, Users, Calendar, Banknote, BookOpen, Shield, Loader2, Sparkles,
  FileWarning, Eye, Filter,
} from 'lucide-react';
import { useDocumentAnalyses, useAnalyzeDocument, useDocumentStats, useSmartCollections, DocumentAnalysis } from '@/hooks/useSmartArchive';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import BackButton from '@/components/ui/back-button';

const DOC_TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  contract: { label: 'عقد', icon: FileText },
  invoice: { label: 'فاتورة', icon: Banknote },
  license: { label: 'ترخيص', icon: Shield },
  permit: { label: 'تصريح', icon: CheckCircle2 },
  report: { label: 'تقرير', icon: BookOpen },
  letter: { label: 'خطاب', icon: FileText },
  certificate: { label: 'شهادة', icon: CheckCircle2 },
  manifest: { label: 'بيان شحن', icon: FileText },
  other: { label: 'أخرى', icon: FileText },
};

const CATEGORY_LABELS: Record<string, string> = {
  legal: 'قانوني', financial: 'مالي', operational: 'تشغيلي',
  environmental: 'بيئي', hr: 'موارد بشرية', compliance: 'امتثال',
};

const RISK_STYLES: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-emerald-100 text-emerald-800', label: 'منخفض' },
  medium: { color: 'bg-amber-100 text-amber-800', label: 'متوسط' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'عالي' },
  critical: { color: 'bg-red-100 text-red-800', label: 'حرج' },
};

const SmartDocumentArchive = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<DocumentAnalysis | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteFileName, setPasteFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading } = useDocumentAnalyses();
  const { data: stats } = useDocumentStats();
  const analyzeDoc = useAnalyzeDocument();
  const { collections, createCollection } = useSmartCollections();

  const filtered = documents.filter(d => {
    if (search && !(d.file_name?.includes(search) || d.summary?.includes(search) || d.keywords?.some(k => k.includes(search)))) return false;
    if (filterType !== 'all' && d.document_type !== filterType) return false;
    if (filterRisk !== 'all' && d.risk_level !== filterRisk) return false;
    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    analyzeDoc.mutate({ text, fileName: file.name });
    setShowUpload(false);
  };

  const handlePasteAnalyze = () => {
    if (!pasteText.trim()) return;
    analyzeDoc.mutate({ text: pasteText, fileName: pasteFileName || 'وثيقة ملصوقة' });
    setPasteText('');
    setPasteFileName('');
    setShowUpload(false);
  };

  const kpis = [
    { label: 'إجمالي الوثائق', value: stats?.total || 0, icon: FileText, color: 'text-blue-600' },
    { label: 'تم تحليلها', value: stats?.analyzed || 0, icon: Brain, color: 'text-emerald-600' },
    { label: 'مخاطر عالية', value: stats?.highRisk || 0, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'تتطلب إجراء', value: stats?.requiresAction || 0, icon: Clock, color: 'text-amber-600' },
  ];

  return (
    <DashboardLayout>
      <div dir="rtl" className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">الأرشفة الذكية وتحليل الوثائق</h1>
            <p className="text-muted-foreground text-sm">تحليل NLP تلقائي · تصنيف ذكي · استخراج البيانات</p>
          </div>
        </div>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button><Sparkles className="w-4 h-4 ml-1" /> تحليل وثيقة جديدة</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Brain className="w-5 h-5" /> تحليل وثيقة بالذكاء الاصطناعي</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
        <BackButton />
              {/* File Upload */}
              <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">رفع ملف نصي للتحليل</p>
                <p className="text-xs text-muted-foreground">TXT, CSV, JSON, MD</p>
                <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.csv,.json,.md,.xml" onChange={handleFileUpload} />
              </div>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" /><span className="text-xs text-muted-foreground">أو</span><Separator className="flex-1" />
              </div>

              {/* Paste Text */}
              <div className="space-y-2">
                <Input value={pasteFileName} onChange={e => setPasteFileName(e.target.value)} placeholder="اسم الوثيقة (اختياري)" />
                <Textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="ألصق نص الوثيقة هنا للتحليل الذكي..." rows={6} />
                <Button onClick={handlePasteAnalyze} disabled={!pasteText.trim() || analyzeDoc.isPending} className="w-full">
                  {analyzeDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Brain className="w-4 h-4 ml-1" />}
                  {analyzeDoc.isPending ? 'جاري التحليل...' : 'تحليل النص'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="documents"><FileText className="w-4 h-4 ml-1" /> الوثائق</TabsTrigger>
          <TabsTrigger value="collections"><FolderOpen className="w-4 h-4 ml-1" /> المجموعات</TabsTrigger>
          <TabsTrigger value="insights"><Sparkles className="w-4 h-4 ml-1" /> رؤى</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pr-9" placeholder="بحث بالاسم أو الكلمات المفتاحية..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36"><SelectValue placeholder="النوع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-32"><SelectValue placeholder="المخاطر" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(RISK_STYLES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}
          {!isLoading && filtered.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لم يتم تحليل أي وثائق بعد</p>
              <p className="text-sm">ابدأ برفع أو لصق نص وثيقة للتحليل الذكي</p>
            </CardContent></Card>
          )}

          <div className="space-y-2">
            {filtered.map(doc => {
              const typeInfo = DOC_TYPE_LABELS[doc.document_type || 'other'] || DOC_TYPE_LABELS.other;
              const riskStyle = RISK_STYLES[doc.risk_level || 'low'];
              const Icon = typeInfo.icon;
              return (
                <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDoc(doc)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm truncate">{doc.file_name}</span>
                            {doc.analysis_status === 'analyzing' && <Badge variant="secondary"><Loader2 className="w-3 h-3 animate-spin ml-1" /> جاري التحليل</Badge>}
                            {doc.analysis_status === 'completed' && (
                              <>
                                <Badge variant="outline">{typeInfo.label}</Badge>
                                <Badge variant="outline">{CATEGORY_LABELS[doc.category || ''] || doc.category}</Badge>
                                <Badge variant="outline" className={riskStyle.color}>{riskStyle.label}</Badge>
                                {doc.requires_action && <Badge className="bg-amber-500 text-white">يتطلب إجراء</Badge>}
                              </>
                            )}
                          </div>
                          {doc.summary && <p className="text-xs text-muted-foreground line-clamp-2">{doc.summary}</p>}
                          {doc.keywords && doc.keywords.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {doc.keywords.slice(0, 5).map(k => (
                                <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{k}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {doc.confidence_score != null && doc.confidence_score > 0 && (
                          <span className="text-xs font-mono text-muted-foreground">{doc.confidence_score}%</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), 'dd MMM', { locale: ar })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">مجموعات الأرشيف الذكي</h3>
            <Button size="sm" variant="outline" onClick={() => createCollection.mutate({ collection_name: 'مجموعة جديدة' })}>
              + مجموعة
            </Button>
          </div>
          {collections.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">لم يتم إنشاء مجموعات بعد</CardContent></Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {collections.map(c => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <FolderOpen className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">{c.collection_name}</p>
                    <p className="text-xs text-muted-foreground">{c.document_count} وثيقة</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-base">توزيع أنواع الوثائق</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(DOC_TYPE_LABELS).map(([key, val]) => {
                  const count = documents.filter(d => d.document_type === key).length;
                  if (count === 0) return null;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{val.label}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  );
                })}
                {documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>}
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-base">توزيع المخاطر</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(RISK_STYLES).map(([key, val]) => {
                  const count = documents.filter(d => d.risk_level === key).length;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{val.label}</span>
                      <Badge variant="outline" className={val.color}>{count}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileWarning className="w-5 h-5 text-amber-500" /> وثائق تتطلب إجراء</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {documents.filter(d => d.requires_action).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> لا توجد إجراءات مطلوبة
                  </p>
                )}
                {documents.filter(d => d.requires_action).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                    <div>
                      <p className="text-sm font-medium">{doc.file_name}</p>
                      {doc.action_description && <p className="text-xs text-muted-foreground">{doc.action_description}</p>}
                    </div>
                    {doc.action_deadline && (
                      <Badge variant="outline"><Calendar className="w-3 h-3 ml-1" /> {doc.action_deadline}</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  تحليل: {selectedDoc.file_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Summary */}
                {selectedDoc.summary && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">الملخص</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedDoc.summary}</p>
                  </div>
                )}

                {/* Classification */}
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.document_type && <Badge>{DOC_TYPE_LABELS[selectedDoc.document_type]?.label || selectedDoc.document_type}</Badge>}
                  {selectedDoc.category && <Badge variant="outline">{CATEGORY_LABELS[selectedDoc.category] || selectedDoc.category}</Badge>}
                  {selectedDoc.risk_level && <Badge variant="outline" className={RISK_STYLES[selectedDoc.risk_level]?.color}>{RISK_STYLES[selectedDoc.risk_level]?.label}</Badge>}
                  {selectedDoc.sentiment && <Badge variant="outline">{selectedDoc.sentiment}</Badge>}
                  {selectedDoc.confidence_score != null && <Badge variant="secondary">ثقة: {selectedDoc.confidence_score}%</Badge>}
                </div>

                {/* Risk */}
                {selectedDoc.risk_details && (
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                    <p className="text-sm font-medium flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> تفاصيل المخاطر</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedDoc.risk_details}</p>
                  </div>
                )}

                {/* Action Required */}
                {selectedDoc.requires_action && (
                  <div className="p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20">
                    <p className="text-sm font-medium flex items-center gap-1"><Clock className="w-4 h-4" /> إجراء مطلوب</p>
                    <p className="text-sm mt-1">{selectedDoc.action_description}</p>
                    {selectedDoc.action_deadline && <p className="text-xs text-muted-foreground mt-1">الموعد النهائي: {selectedDoc.action_deadline}</p>}
                  </div>
                )}

                {/* Key Entities */}
                {selectedDoc.key_entities && selectedDoc.key_entities.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Users className="w-4 h-4" /> الكيانات المستخرجة</h4>
                    <div className="space-y-1">
                      {selectedDoc.key_entities.map((ent: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">{ent.type}</Badge>
                          <span>{ent.value}</span>
                          {ent.context && <span className="text-xs text-muted-foreground">— {ent.context}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Amounts */}
                {selectedDoc.financial_amounts && selectedDoc.financial_amounts.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Banknote className="w-4 h-4" /> المبالغ المالية</h4>
                    <div className="space-y-1">
                      {selectedDoc.financial_amounts.map((amt: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-mono font-bold">{amt.amount?.toLocaleString()} {amt.currency || 'ج.م'}</span>
                          {amt.description && <span className="text-xs text-muted-foreground">— {amt.description}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referenced Laws */}
                {selectedDoc.referenced_laws && selectedDoc.referenced_laws.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Scale className="w-4 h-4" /> المراجع القانونية</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedDoc.referenced_laws.map((law, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{law}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {selectedDoc.keywords && selectedDoc.keywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Tag className="w-4 h-4" /> الكلمات المفتاحية</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedDoc.keywords.map(k => (
                        <span key={k} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto Tags */}
                {selectedDoc.auto_tags && selectedDoc.auto_tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">التصنيفات التلقائية</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedDoc.auto_tags.map(t => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                {selectedDoc.dates_mentioned && selectedDoc.dates_mentioned.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Calendar className="w-4 h-4" /> التواريخ المذكورة</h4>
                    <div className="space-y-1">
                      {selectedDoc.dates_mentioned.map((d: any, i: number) => (
                        <div key={i} className="text-sm"><span className="font-mono">{d.date}</span> {d.context && <span className="text-muted-foreground">— {d.context}</span>}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Parties */}
                {selectedDoc.related_parties && selectedDoc.related_parties.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">الأطراف ذات الصلة</h4>
                    <div className="space-y-1">
                      {selectedDoc.related_parties.map((p: any, i: number) => (
                        <div key={i} className="text-sm"><span className="font-medium">{p.name}</span> {p.role && <span className="text-muted-foreground">— {p.role}</span>}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
      </DashboardLayout>
  );
};

export default SmartDocumentArchive;
