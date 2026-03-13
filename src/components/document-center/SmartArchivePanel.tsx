/**
 * لوحة الأرشفة الذكية — مضمنة داخل مركز المستندات الموحد
 * Wraps SmartDocumentArchive content without DashboardLayout
 */
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain, FileText, Search, Upload, FolderOpen, AlertTriangle, CheckCircle2, Clock,
  Tag, Scale, Users, Calendar, Banknote, BookOpen, Shield, Loader2, Sparkles,
  FileWarning, Eye, Filter,
} from 'lucide-react';
import { useDocumentAnalyses, useAnalyzeDocument, useDocumentStats, useSmartCollections, DocumentAnalysis } from '@/hooks/useSmartArchive';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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

const RISK_STYLES: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'منخفض' },
  medium: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', label: 'متوسط' },
  high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', label: 'عالي' },
  critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'حرج' },
};

const SmartArchivePanel = () => {
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

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{stats?.total || 0}</p>
          <p className="text-xs text-muted-foreground">إجمالي الوثائق</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats?.analyzed || 0}</p>
          <p className="text-xs text-muted-foreground">تم تحليلها</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{stats?.highRisk || 0}</p>
          <p className="text-xs text-muted-foreground">مخاطر عالية</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats?.requiresAction || 0}</p>
          <p className="text-xs text-muted-foreground">تتطلب إجراء</p>
        </CardContent></Card>
      </div>

      {/* Upload + Filter */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Upload className="w-4 h-4" /> تحليل وثيقة جديدة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>تحليل وثيقة بالذكاء الاصطناعي</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">رفع ملف نصي</p>
                <input ref={fileInputRef} type="file" accept=".txt,.csv,.md,.json" onChange={handleFileUpload} className="text-sm" />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">أو لصق النص</p>
                <Input placeholder="اسم الوثيقة" value={pasteFileName} onChange={e => setPasteFileName(e.target.value)} />
                <Textarea placeholder="الصق نص الوثيقة هنا..." value={pasteText} onChange={e => setPasteText(e.target.value)} rows={6} />
                <Button onClick={handlePasteAnalyze} disabled={!pasteText.trim() || analyzeDoc.isPending} className="w-full gap-2">
                  {analyzeDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  تحليل
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32"><SelectValue placeholder="النوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-32"><SelectValue placeholder="المخاطر" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(RISK_STYLES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد وثائق محللة بعد</p>
          <p className="text-xs mt-1">ارفع وثيقة لتحليلها بالذكاء الاصطناعي</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(doc => {
            const typeInfo = DOC_TYPE_LABELS[doc.document_type || 'other'] || DOC_TYPE_LABELS.other;
            const TypeIcon = typeInfo.icon;
            const riskInfo = doc.risk_level ? RISK_STYLES[doc.risk_level] : null;
            return (
              <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDoc(doc)}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TypeIcon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate">{doc.file_name}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant="outline" className="text-[10px]">{typeInfo.label}</Badge>
                      {riskInfo && <Badge className={`text-[10px] ${riskInfo.color}`}>{riskInfo.label}</Badge>}
                    </div>
                  </div>
                  {doc.summary && <p className="text-xs text-muted-foreground line-clamp-2">{doc.summary}</p>}
                  <div className="flex flex-wrap gap-1">
                    {doc.auto_tags?.slice(0, 4).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px]"><Tag className="w-2.5 h-2.5 ml-1" />{tag}</Badge>
                    ))}
                  </div>
                  {doc.requires_action && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3" /> {doc.action_description}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {doc.analyzed_at ? format(new Date(doc.analyzed_at), 'dd MMM yyyy', { locale: ar }) : 'قيد التحليل...'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document detail dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  {selectedDoc.file_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {selectedDoc.summary && (
                  <div><p className="font-medium text-xs text-muted-foreground mb-1">ملخص</p><p>{selectedDoc.summary}</p></div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedDoc.document_type && <div><span className="text-muted-foreground">النوع:</span> {DOC_TYPE_LABELS[selectedDoc.document_type]?.label}</div>}
                  {selectedDoc.category && <div><span className="text-muted-foreground">الفئة:</span> {selectedDoc.category}</div>}
                  {selectedDoc.sentiment && <div><span className="text-muted-foreground">المشاعر:</span> {selectedDoc.sentiment}</div>}
                  {selectedDoc.confidence_score && <div><span className="text-muted-foreground">الثقة:</span> {Math.round(selectedDoc.confidence_score * 100)}%</div>}
                </div>
                {selectedDoc.keywords?.length > 0 && (
                  <div>
                    <p className="font-medium text-xs text-muted-foreground mb-1">كلمات مفتاحية</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedDoc.keywords.map(k => <Badge key={k} variant="outline" className="text-[10px]">{k}</Badge>)}
                    </div>
                  </div>
                )}
                {selectedDoc.referenced_laws?.length > 0 && (
                  <div>
                    <p className="font-medium text-xs text-muted-foreground mb-1">قوانين مرجعية</p>
                    {selectedDoc.referenced_laws.map(l => <p key={l} className="text-xs">• {l}</p>)}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Collections */}
      {collections.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">المجموعات الذكية</h3>
          <div className="flex flex-wrap gap-2">
            {collections.map(c => (
              <Badge key={c.id} variant="outline" className="gap-1 px-3 py-1.5">
                <span>{c.icon}</span> {c.collection_name}
                <span className="text-muted-foreground">({c.document_count})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartArchivePanel;
