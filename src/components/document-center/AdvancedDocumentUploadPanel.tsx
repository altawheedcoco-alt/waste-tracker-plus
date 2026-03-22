/**
 * لوحة رفع المستندات المتطورة — Advanced Document Upload Panel
 * دعم السحب والإفلات، الرفع المتعدد، التصنيف الذكي، ومعاينة الملفات
 */
import { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Upload, X, File, Image, FileText, Loader2, FolderUp, CheckCircle2,
  AlertCircle, Trash2, Eye, Download, Clock, Tag, Search, Filter,
  FileArchive, FileCheck, Receipt, Truck, Scale, Building2, Briefcase,
  ArrowUpDown, RefreshCw, Zap, Brain, Grid3X3, List, MoreHorizontal,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';

// ─── Document Categories per Entity Type ───
const ENTITY_CATEGORIES: Record<string, { value: string; label: string; icon: string }[]> = {
  generator: [
    { value: 'waste_manifest', label: 'مانيفست المخلفات', icon: '📋' },
    { value: 'environmental_approval', label: 'الموافقة البيئية', icon: '🌿' },
    { value: 'waste_register', label: 'سجل المخلفات', icon: '📒' },
    { value: 'self_monitoring', label: 'تقرير الرصد الذاتي', icon: '📊' },
    { value: 'contract', label: 'عقد خدمات بيئية', icon: '📜' },
    { value: 'license', label: 'ترخيص / تصريح', icon: '🏛️' },
    { value: 'invoice', label: 'فاتورة', icon: '🧾' },
    { value: 'receipt', label: 'إيصال', icon: '🧾' },
    { value: 'correspondence', label: 'مراسلة رسمية', icon: '✉️' },
    { value: 'other', label: 'أخرى', icon: '📁' },
  ],
  transporter: [
    { value: 'transport_license', label: 'رخصة نقل', icon: '🚛' },
    { value: 'vehicle_registration', label: 'رخصة مركبة', icon: '🚗' },
    { value: 'driver_license', label: 'رخصة سائق', icon: '👤' },
    { value: 'hazmat_permit', label: 'تصريح نقل مواد خطرة', icon: '☢️' },
    { value: 'insurance', label: 'وثيقة تأمين', icon: '🛡️' },
    { value: 'weight_slip', label: 'صورة وزنة / تذكرة ميزان', icon: '⚖️' },
    { value: 'manifest', label: 'مانيفست النقل', icon: '📋' },
    { value: 'contract', label: 'عقد نقل', icon: '📜' },
    { value: 'invoice', label: 'فاتورة', icon: '🧾' },
    { value: 'correspondence', label: 'مراسلة', icon: '✉️' },
    { value: 'other', label: 'أخرى', icon: '📁' },
  ],
  recycler: [
    { value: 'recycling_license', label: 'ترخيص تدوير', icon: '♻️' },
    { value: 'environmental_approval', label: 'الموافقة البيئية', icon: '🌿' },
    { value: 'industrial_license', label: 'ترخيص صناعي (IDA)', icon: '🏭' },
    { value: 'quality_certificate', label: 'شهادة جودة', icon: '✅' },
    { value: 'weight_slip', label: 'صورة وزنة', icon: '⚖️' },
    { value: 'recycling_report', label: 'تقرير تدوير', icon: '📊' },
    { value: 'contract', label: 'عقد', icon: '📜' },
    { value: 'invoice', label: 'فاتورة', icon: '🧾' },
    { value: 'safety_report', label: 'تقرير سلامة', icon: '🔧' },
    { value: 'other', label: 'أخرى', icon: '📁' },
  ],
  disposal: [
    { value: 'disposal_license', label: 'ترخيص تخلص', icon: '🏗️' },
    { value: 'environmental_approval', label: 'الموافقة البيئية', icon: '🌿' },
    { value: 'disposal_certificate', label: 'شهادة تخلص آمن', icon: '📜' },
    { value: 'monitoring_report', label: 'تقرير رصد بيئي', icon: '📊' },
    { value: 'weight_slip', label: 'صورة وزنة', icon: '⚖️' },
    { value: 'safety_report', label: 'تقرير سلامة مهنية', icon: '🔧' },
    { value: 'contract', label: 'عقد', icon: '📜' },
    { value: 'invoice', label: 'فاتورة', icon: '🧾' },
    { value: 'other', label: 'أخرى', icon: '📁' },
  ],
  default: [
    { value: 'contract', label: 'عقد', icon: '📜' },
    { value: 'license', label: 'ترخيص', icon: '🏛️' },
    { value: 'invoice', label: 'فاتورة', icon: '🧾' },
    { value: 'receipt', label: 'إيصال', icon: '🧾' },
    { value: 'certificate', label: 'شهادة', icon: '📄' },
    { value: 'correspondence', label: 'مراسلة', icon: '✉️' },
    { value: 'report', label: 'تقرير', icon: '📊' },
    { value: 'other', label: 'أخرى', icon: '📁' },
  ],
};

interface QueuedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  documentType: string;
  category: string;
  description: string;
  tags: string[];
  errorMessage?: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const AdvancedDocumentUploadPanel = () => {
  const { organization, user, profile } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  const orgType = organization?.organization_type || 'default';
  const categories = ENTITY_CATEGORIES[orgType] || ENTITY_CATEGORIES.default;

  // Fetch existing documents
  const { data: documents = [], isLoading: docsLoading, refetch } = useQuery({
    queryKey: ['adv-upload-docs', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('entity_documents')
        .select('*, uploader:uploaded_by(full_name, avatar_url)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Stats
  const stats = useMemo(() => {
    const total = documents.length;
    const totalSize = documents.reduce((s: number, d: any) => s + (d.file_size || 0), 0);
    const thisMonth = documents.filter((d: any) => {
      const created = new Date(d.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    const byCategory: Record<string, number> = {};
    documents.forEach((d: any) => {
      const cat = d.document_type || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });
    return { total, totalSize, thisMonth, byCategory };
  }, [documents]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ─── Drag & Drop ───
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const processFiles = useCallback((files: FileList | File[]) => {
    const newItems: QueuedFile[] = [];
    Array.from(files).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: الحجم يتجاوز 20MB`);
        return;
      }
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      newItems.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        status: 'pending',
        progress: 0,
        documentType: '',
        category: 'documents',
        description: '',
        tags: [],
      });
    });
    setQueue(prev => [...prev, ...newItems]);
    if (newItems.length > 0) toast.success(`تم إضافة ${newItems.length} ملف للقائمة`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = '';
  }, [processFiles]);

  const removeFromQueue = (id: string) => {
    setQueue(prev => {
      const item = prev.find(f => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const updateQueueItem = (id: string, updates: Partial<QueuedFile>) => {
    setQueue(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  // ─── Upload all ───
  const handleUploadAll = async () => {
    const pending = queue.filter(f => f.status === 'pending');
    if (pending.length === 0) return toast.error('لا توجد ملفات جاهزة للرفع');
    if (!organization?.id || !user?.id) return toast.error('يجب تسجيل الدخول أولاً');

    // Validate all have document type
    const invalid = pending.filter(f => !f.documentType);
    if (invalid.length > 0) {
      toast.error(`${invalid.length} ملف بدون تحديد نوع المستند`);
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of pending) {
      updateQueueItem(item.id, { status: 'uploading', progress: 20 });
      try {
        const ext = item.name.split('.').pop() || 'file';
        const path = `${organization.id}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
        
        updateQueueItem(item.id, { progress: 40 });
        
        const { error: uploadError } = await supabase.storage
          .from('entity-documents')
          .upload(path, item.file, { contentType: item.type });
        
        if (uploadError) throw uploadError;

        updateQueueItem(item.id, { progress: 70 });

        // Store the storage path — signed URLs are generated on demand for private buckets
        const storagePath = path;

        const { error: dbError } = await supabase
          .from('entity_documents')
          .insert({
            organization_id: organization.id,
            document_type: item.documentType,
            document_category: item.category,
            title: item.name.replace(/\.[^.]+$/, ''),
            description: item.description || null,
            file_url: storagePath,
            file_name: item.name,
            file_type: item.type,
            file_size: item.size,
            tags: item.tags.length > 0 ? item.tags : null,
            uploaded_by: user.id,
            uploaded_by_role: 'member',
          });

        if (dbError) throw dbError;
        
        updateQueueItem(item.id, { status: 'success', progress: 100 });
        successCount++;
      } catch (err: any) {
        updateQueueItem(item.id, { status: 'error', errorMessage: err.message, progress: 0 });
        errorCount++;
      }
    }

    setIsUploading(false);
    queryClient.invalidateQueries({ queryKey: ['adv-upload-docs'] });
    queryClient.invalidateQueries({ queryKey: ['entity-documents'] });
    queryClient.invalidateQueries({ queryKey: ['document-center-archive'] });

    if (successCount > 0) toast.success(`✅ تم رفع ${successCount} ملف بنجاح`);
    if (errorCount > 0) toast.error(`⚠️ فشل رفع ${errorCount} ملف`);
  };

  // ─── Filtered docs for browse tab ───
  const filteredDocs = useMemo(() => {
    let result = documents;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter((d: any) =>
        d.title?.toLowerCase().includes(s) ||
        d.file_name?.toLowerCase().includes(s) ||
        d.document_type?.toLowerCase().includes(s)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter((d: any) => d.document_type === categoryFilter);
    }
    return result;
  }, [documents, searchTerm, categoryFilter]);

  const pendingCount = queue.filter(f => f.status === 'pending').length;
  const successCount = queue.filter(f => f.status === 'success').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-primary/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">إجمالي المستندات</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.thisMonth}</div>
            <div className="text-xs text-muted-foreground">هذا الشهر</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{formatFileSize(stats.totalSize)}</div>
            <div className="text-xs text-muted-foreground">حجم التخزين</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{Object.keys(stats.byCategory).length}</div>
            <div className="text-xs text-muted-foreground">أنواع المستندات</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="upload" className="gap-1.5">
            <Upload className="w-4 h-4" />
            رفع مستندات
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-1.5">
            <FolderUp className="w-4 h-4" />
            قائمة الانتظار
            {pendingCount > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="browse" className="gap-1.5">
            <FileArchive className="w-4 h-4" />
            المستندات المرفوعة
          </TabsTrigger>
        </TabsList>

        {/* ═══ Upload Tab ═══ */}
        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {/* Drop zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
                  ${dragActive
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                    dragActive ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Upload className={`w-8 h-8 ${dragActive ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {dragActive ? 'أفلت الملفات هنا' : 'اسحب الملفات وأفلتها هنا'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      أو اضغط لاختيار الملفات • PDF, صور, Word, Excel • حتى 20MB
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 mt-2">
                    <FolderUp className="w-4 h-4" />
                    اختر ملفات
                  </Button>
                </div>
              </div>

              {/* Quick category buttons */}
              <div className="mt-6">
                <Label className="text-sm font-medium mb-2 block">أنواع المستندات المتاحة لجهتك:</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <Badge key={cat.value} variant="outline" className="text-xs py-1 px-2.5 gap-1">
                      <span>{cat.icon}</span>
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Queue Tab ═══ */}
        <TabsContent value="queue" className="mt-4 space-y-3">
          {queue.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FolderUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد ملفات في قائمة الانتظار</p>
                <p className="text-xs mt-1">اسحب ملفات أو اضغط "رفع مستندات" لإضافة ملفات</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{queue.length} ملف</Badge>
                  {successCount > 0 && <Badge className="bg-emerald-600">{successCount} ✓</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQueue(prev => prev.filter(f => f.status !== 'success'))}
                    disabled={successCount === 0}
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    إزالة المكتملة
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUploadAll}
                    disabled={isUploading || pendingCount === 0}
                    className="gap-1.5"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    رفع الكل ({pendingCount})
                  </Button>
                </div>
              </div>

              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-3">
                  {queue.map(item => (
                    <Card key={item.id} className={`transition-all ${
                      item.status === 'success' ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/10' :
                      item.status === 'error' ? 'border-destructive/40 bg-destructive/5' :
                      item.status === 'uploading' ? 'border-primary/40' : ''
                    }`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Preview */}
                          <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.preview ? (
                              <img src={item.preview} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : item.type.includes('pdf') ? (
                              <FileText className="w-6 h-6 text-red-500" />
                            ) : (
                              <File className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate max-w-[200px]">{item.name}</span>
                                <span className="text-xs text-muted-foreground">{formatFileSize(item.size)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {item.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                {item.status === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
                                {item.status === 'uploading' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                                {item.status === 'pending' && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromQueue(item.id)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {item.status === 'uploading' && (
                              <Progress value={item.progress} className="h-1.5" />
                            )}

                            {item.status === 'error' && (
                              <p className="text-xs text-destructive">{item.errorMessage}</p>
                            )}

                            {item.status === 'pending' && (
                              <div className="grid grid-cols-2 gap-2">
                                <Select
                                  value={item.documentType}
                                  onValueChange={(v) => updateQueueItem(item.id, { documentType: v })}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="نوع المستند *" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map(cat => (
                                      <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                        {cat.icon} {cat.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="وصف (اختياري)"
                                  value={item.description}
                                  onChange={(e) => updateQueueItem(item.id, { description: e.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>

        {/* ═══ Browse Tab ═══ */}
        <TabsContent value="browse" className="mt-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في المستندات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 h-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="جميع الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('grid')}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('list')}>
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {docsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileArchive className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد مستندات</p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDocs.map((doc: any) => {
                const catInfo = categories.find(c => c.value === doc.document_type);
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow group">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {doc.file_type?.startsWith('image') ? (
                            <Image className="w-5 h-5 text-blue-500" />
                          ) : (
                            <FileText className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title || doc.file_name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              {catInfo?.icon} {catInfo?.label || doc.document_type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatFileSize(doc.file_size || 0)}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: arLocale })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.file_url && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewUrl(doc.file_url)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={doc.file_url} target="_blank" download>
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDocs.map((doc: any) => {
                const catInfo = categories.find(c => c.value === doc.document_type);
                return (
                  <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{doc.title || doc.file_name}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{catInfo?.label || doc.document_type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size || 0)}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(doc.created_at), 'yyyy/MM/dd')}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.file_url && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewUrl(doc.file_url)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <a href={doc.file_url} target="_blank" download><Download className="w-3.5 h-3.5" /></a>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>معاينة المستند</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center min-h-[400px]">
              {previewUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              ) : (
                <GoogleDocsPdfViewer url={previewUrl} title="معاينة المستند" height="70vh" className="w-full rounded-lg" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedDocumentUploadPanel;
